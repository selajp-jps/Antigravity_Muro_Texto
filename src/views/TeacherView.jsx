import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { ingresarConGoogle, mensajeDeError } from '../auth';
import confetti from 'canvas-confetti';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Printer, 
  Copy, 
  Download, 
  Trash2, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  Search, 
  Check, 
  Sparkles,
  Users,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ResponseCard from '../components/ResponseCard';
import QRCodeModal from '../components/QRCodeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { copyResponsesToClipboard, downloadResponsesAsText } from '../utils/exportUtils';

export default function TeacherView({ sessionCode, onGoHome, usuario, cargandoSesion }) {
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado del ingreso docente (para la pantalla de acceso al proyector)
  const [ingresando, setIngresando] = useState(false);
  const [errorIngreso, setErrorIngreso] = useState('');

  const handleIngresarDocente = async () => {
    setErrorIngreso('');
    setIngresando(true);
    try {
      await ingresarConGoogle();
    } catch (err) {
      console.error('Error al iniciar sesión docente:', err);
      setErrorIngreso(mensajeDeError(err));
    } finally {
      setIngresando(false);
    }
  };

  // Track previous count for animation and sound/confetti
  const prevCountRef = useRef(0);
  const [justUpdated, setJustUpdated] = useState(false);

  const studentJoinUrl = `${window.location.origin}${window.location.pathname}#/join/${sessionCode}`;

  // Listen to Session Document
  useEffect(() => {
    if (!sessionCode) return;
    const sessionRef = doc(db, 'sessions', sessionCode);

    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data());
        setError('');
      } else {
        setError(`No existe la sesión con código "${sessionCode}".`);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error al escuchar sesión:', err);
      setError('Error al conectar con la sesión: ' + err.message);
      setLoading(false);
    });

    return () => unsubSession();
  }, [sessionCode]);

  // Listen to Responses Subcollection in real-time
  useEffect(() => {
    if (!sessionCode) return;
    const responsesRef = collection(db, 'sessions', sessionCode, 'responses');
    const q = query(responsesRef, orderBy('createdAt', 'desc'));

    const unsubResponses = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() });
      });

      // Check if new responses arrived for pulse animation
      if (items.length > prevCountRef.current && prevCountRef.current !== 0) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 2000);
      }
      prevCountRef.current = items.length;

      setResponses(items);
    }, (err) => {
      console.error('Error al escuchar respuestas:', err);
    });

    return () => unsubResponses();
  }, [sessionCode]);

  // Toggle Revealed State
  const toggleRevealed = async () => {
    if (!session) return;
    try {
      const nextState = !session.revealed;
      const sessionRef = doc(db, 'sessions', sessionCode);
      await updateDoc(sessionRef, { revealed: nextState });

      // If revealing, shoot subtle celebratory confetti
      if (nextState && responses.length > 0) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error al cambiar revelado:', err);
      alert('Error al actualizar estado en Firestore.');
    }
  };

  // Toggle Locked State
  const toggleLocked = async () => {
    if (!session) return;
    try {
      const sessionRef = doc(db, 'sessions', sessionCode);
      await updateDoc(sessionRef, { locked: !session.locked });
    } catch (err) {
      console.error('Error al cambiar bloqueo:', err);
      alert('Error al pausar sesión en Firestore.');
    }
  };

  // Copy Responses
  const handleCopyClipboard = async () => {
    const ok = await copyResponsesToClipboard(session, responses);
    if (ok) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Download Responses as .txt
  const handleDownloadTxt = () => {
    downloadResponsesAsText(session, responses);
  };

  // Print / PDF for Moodle
  const handlePrint = () => {
    window.print();
  };

  // Clear all responses for next commission
  const handleClearResponses = async () => {
    setIsClearing(true);
    try {
      const responsesRef = collection(db, 'sessions', sessionCode, 'responses');
      const snap = await getDocs(responsesRef);
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // Reset revealed state to false for fresh start
      const sessionRef = doc(db, 'sessions', sessionCode);
      await updateDoc(sessionRef, { revealed: false });

      setIsClearModalOpen(false);
    } catch (err) {
      console.error('Error al limpiar respuestas:', err);
      alert('Error al limpiar respuestas: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((e) => console.log(e));
      }
      setIsFullscreen(false);
    }
  };

  // Filter responses
  const filteredResponses = responses.filter((r) => {
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.toLowerCase();
    const textMatch = r.text?.toLowerCase().includes(queryLower);
    const authorMatch = r.author?.toLowerCase().includes(queryLower);
    return textMatch || authorMatch;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Cargando sesión de aula...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-800/90 border border-red-500/30 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Sesión no encontrada</h2>
        <p className="text-slate-300 text-sm mb-6">{error || 'Verifica el código ingresado.'}</p>
        <button
          onClick={onGoHome}
          className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition"
        >
          Volver a la pantalla principal
        </button>
      </div>
    );
  }

  const isRevealed = !!session.revealed;
  const isLocked = !!session.locked;

  // ---------------------------------------------------------------------
  //  CONTROL DE ACCESO AL PROYECTOR
  //  Ver la sesión y el contador es libre (lo necesita el aula), pero los
  //  controles de docente exigen la cuenta del equipo. Si no hay sesión
  //  iniciada, en lugar del panel se muestra el ingreso.
  // ---------------------------------------------------------------------
  if (!usuario) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-300">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Panel del docente</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-1">
            Sesión <span className="font-mono font-bold text-indigo-400">{sessionCode}</span> —{' '}
            {session.title || 'sin título'}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Para revelar opiniones, pausar envíos o limpiar respuestas necesitás ingresar con tu
            cuenta docente. Los alumnos siguen respondiendo normalmente desde el QR o el código.
          </p>

          {errorIngreso && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorIngreso}</span>
            </div>
          )}

          <button
            onClick={handleIngresarDocente}
            disabled={ingresando || cargandoSesion}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {ingresando || cargandoSesion ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span>
                Conectando con Google...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Ingresar con Google
              </>
            )}
          </button>

          <div className="mt-5 pt-5 border-t border-slate-700/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Acceso exclusivo del equipo docente autorizado
          </div>

          <button
            onClick={onGoHome}
            className="mt-4 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Volver a la pantalla principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* ================= PRINT VIEW HEADER (Only visible when printing / PDF) ================= */}
      <div className="print-only p-8 text-slate-900 bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              {session.title}
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Código de Sesión: <span className="font-mono">{session.code}</span> | Muro de Interacción Universitaria
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Fecha de reporte: {new Date().toLocaleDateString('es-ES')}</p>
            <p>Hora: {new Date().toLocaleTimeString('es-ES')}</p>
            <p className="font-bold mt-1">{responses.length} aportes de alumnos</p>
          </div>
        </div>

        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Consigna o Pregunta Disparadora:
          </p>
          <p className="text-lg font-semibold text-slate-900 italic">
            "{session.prompt}"
          </p>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 pb-1 border-b border-slate-300">
          Respuestas de los Estudiantes ({responses.length}):
        </h2>
      </div>

      {/* ================= TOP TEACHER TOOLBAR (Interactive / On Screen) ================= */}
      <div className="no-print bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-16 z-30 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          {/* Status & Counters */}
          <div className="flex items-center gap-3">
            {/* Live Count Badge */}
            <div 
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-sm transition-all duration-300 ${
                justUpdated 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-850 bg-slate-900/90 text-slate-200 border-slate-700'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{responses.length}</span>
              <span className="text-xs font-normal text-slate-400">respuestas</span>
            </div>

            {/* Lock Status Badge */}
            <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              isLocked 
                ? 'bg-red-500/15 text-red-300 border border-red-500/30' 
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? 'Respuestas Pausadas' : 'Recepción Abierta'}
            </div>

            {/* Revealed Badge */}
            <div className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              isRevealed 
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' 
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}>
              {isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {isRevealed ? 'Opiniones Visibles' : 'Opiniones Ocultas'}
            </div>
          </div>

          {/* Teacher Actions Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 1. REVELAR / OCULTAR */}
            <button
              onClick={toggleRevealed}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition transform active:scale-95 ${
                isRevealed
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
              }`}
              title={isRevealed ? 'Ocultar opiniones en el proyector' : 'Mostrar todas las opiniones en pantalla'}
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isRevealed ? 'Ocultar opiniones' : 'Revelar opiniones'}</span>
            </button>

            {/* 2. BLOQUEAR / DESBLOQUEAR */}
            <button
              onClick={toggleLocked}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                isLocked
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title={isLocked ? 'Reanudar recepción de respuestas' : 'Pausar/bloquear nuevos envíos'}
            >
              {isLocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
              <span className="hidden sm:inline">{isLocked ? 'Reanudar envíos' : 'Pausar envíos'}</span>
            </button>

            {/* 3. VER CÓDIGO QR */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition"
              title="Mostrar código QR en grande para escanear"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Ver QR</span>
            </button>

            {/* 4. IMPRIMIR / PDF PARA MOODLE */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition"
              title="Guardar o imprimir en PDF para Moodle / Campus"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden lg:inline">Guardar PDF</span>
            </button>

            {/* 5. COPIAR AL PORTAPAPELES */}
            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition"
              title="Copiar texto resumen de todas las opiniones"
            >
              {copiedToast ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden xl:inline">{copiedToast ? '¡Copiado!' : 'Copiar texto'}</span>
            </button>

            {/* 6. DESCARGAR .TXT */}
            <button
              onClick={handleDownloadTxt}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl transition"
              title="Descargar archivo .txt con las respuestas"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* 7. REINICIAR / LIMPIAR */}
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 rounded-xl transition"
              title="Limpiar respuestas para otra comisión"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* 8. PANTALLA COMPLETA */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl transition hidden sm:block"
              title="Modo pantalla completa para cañón de proyección"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN PROJECTOR CANVAS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* BANNER DE CONSIGNA / PREGUNTA DISPARADORA (GRANDE PARA EL AULA) */}
        <div className="no-print bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
          {/* Subtle decorative glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {session.title}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-200 mt-0.5">
                Consigna de la Actividad
              </h2>
            </div>

            {/* Session code Pill */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950/70 border border-slate-700 px-4 py-2 rounded-2xl">
              <span className="text-xs text-slate-400">Código para el aula:</span>
              <span className="font-mono font-black text-indigo-400 tracking-wider text-lg">
                {session.code}
              </span>
            </div>
          </div>

          {/* The Big Prompt for the Classroom */}
          <p className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
            "{session.prompt}"
          </p>

          {isLocked && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              La recepción de opiniones se encuentra pausada en este momento.
            </div>
          )}
        </div>

        {/* ================= CONDITIONAL CONTENT: HIDDEN VS REVEALED ================= */}
        {!isRevealed ? (
          /* ================= WAITING / HIDDEN STATE (Large QR + Live Counter) ================= */
          <div className="no-print bg-slate-850/60 border border-slate-700/80 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl backdrop-blur-md">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
              <EyeOff className="w-4 h-4 text-amber-400" />
              Las opiniones permanecen ocultas para no condicionar las respuestas
            </div>

            {/* Central QR Code */}
            <div className="bg-white p-6 rounded-2xl inline-block shadow-2xl border-4 border-indigo-500/30 mb-6">
              <QRCodeSVG
                value={studentJoinUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Escanea el código con tu celular para opinar
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
                O ingresa desde tu navegador con el código{' '}
                <span className="font-mono font-bold text-indigo-400 text-lg">{session.code}</span>
              </p>

              {/* Dynamic Live Counter */}
              <div className="pt-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-2xl font-black text-white font-mono">{responses.length}</span>
                  <span className="text-sm font-medium text-slate-300">
                    {responses.length === 1 ? 'estudiante ha respondido' : 'estudiantes han respondido'}
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={toggleRevealed}
                  className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95 inline-flex items-center gap-2.5"
                >
                  <Eye className="w-5 h-5" />
                  Revelar opiniones en pantalla ahora
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= REVEALED STATE: WALL OF RESPONSES ================= */
          <div>
            {/* Filter and wall stats */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Muro de Opiniones ({filteredResponses.length} de {responses.length})
                </h3>
              </div>

              {/* Search / Filter */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en las respuestas..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Empty state if no responses yet */}
            {responses.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/50 border border-slate-700/60 rounded-3xl p-8 max-w-xl mx-auto">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">Aún no se han recibido respuestas</h4>
                <p className="text-sm text-slate-400 mb-6">
                  Pide a los estudiantes que escaneen el código QR o ingresen con el código <span className="font-mono text-indigo-400 font-bold">{session.code}</span>.
                </p>
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition inline-flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Mostrar Código QR
                </button>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No se encontraron respuestas que coincidan con "{searchQuery}".
              </div>
            ) : (
              /* Responsive Grid of Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredResponses.map((item, index) => (
                  <ResponseCard
                    key={item.id}
                    response={item}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= PRINT CARDS CONTAINER (All responses cleanly rendered) ================= */}
      <div className="print-only">
        <div className="space-y-4">
          {responses.map((item, index) => (
            <div key={item.id} className="print-card p-4 rounded border border-slate-300">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-2 pb-1 border-b border-slate-200">
                <span>
                  #{index + 1} - {item.isAnonymous ? 'Anónimo' : (item.author || 'Estudiante')}
                </span>
                <span>
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal QR Code */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        joinUrl={studentJoinUrl}
        sessionCode={session.code}
        sessionTitle={session.title}
      />

      {/* Modal Clear Confirmation */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearResponses}
        isLoading={isClearing}
        title="¿Reiniciar respuestas de la sesión?"
        message={`Esta acción borrará las ${responses.length} respuestas recibidas para el código "${session.code}". Podrás reutilizar este mismo código con otra comisión o turno.`}
        confirmText="Sí, borrar y reiniciar"
      />
    </div>
  );
}
