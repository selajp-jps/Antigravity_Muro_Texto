import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Sparkles, 
  Presentation, 
  Users, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink, 
  RotateCcw,
  BookOpen,
  MessageSquare,
  KeyRound,
  Play
} from 'lucide-react';

export default function HomeView({ onNavigateToTeacher, onNavigateToStudent }) {
  // Form State for creating session
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Created session modal/state
  const [createdSession, setCreatedSession] = useState(null);
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);
  const [copiedTeacherLink, setCopiedTeacherLink] = useState(false);

  // Form State for joining session
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('student'); // 'student' | 'teacher'
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Random Code Generator
  const generateRandomCode = () => {
    const prefixes = ['ADM', 'DER', 'MED', 'CS', 'ECO', 'FILO', 'ING', 'PSI', 'SOC', 'BIO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(100 + Math.random() * 900);
    setCustomCode(`${prefix}-${number}`);
  };

  const normalizeCode = (raw) => {
    return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!title.trim()) {
      setCreateError('Por favor, ingresa el nombre de la materia o tema.');
      return;
    }
    if (!prompt.trim()) {
      setCreateError('Por favor, redacta la consigna o pregunta disparadora.');
      return;
    }

    let codeToUse = customCode.trim() ? normalizeCode(customCode) : '';
    if (!codeToUse) {
      const prefixes = ['ADM', 'CLASE', 'UNIV', 'TALLER'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      codeToUse = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    }

    setIsCreating(true);

    try {
      const sessionRef = doc(db, 'sessions', codeToUse);
      const existingSnap = await getDoc(sessionRef);

      if (existingSnap.exists()) {
        // If it already exists, confirm whether to update or use another code
        const confirmOverwrite = window.confirm(
          `Ya existe una sesión con el código "${codeToUse}". ¿Deseas sobreescribirla con esta nueva consigna?`
        );
        if (!confirmOverwrite) {
          setIsCreating(false);
          return;
        }
      }

      const newSessionData = {
        code: codeToUse,
        title: title.trim(),
        prompt: prompt.trim(),
        locked: false,
        revealed: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(sessionRef, newSessionData);

      const baseUrl = window.location.origin + window.location.pathname;
      const studentUrl = `${baseUrl}#/join/${codeToUse}`;
      const teacherUrl = `${baseUrl}#/teacher/${codeToUse}`;

      setCreatedSession({
        code: codeToUse,
        title: title.trim(),
        prompt: prompt.trim(),
        studentUrl,
        teacherUrl,
      });

    } catch (err) {
      console.error('Error al crear sesión:', err);
      setCreateError('Ocurrió un error al guardar en Firestore: ' + (err.message || 'Verifica tu conexión.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    setJoinError('');

    const code = normalizeCode(joinCode);
    if (!code) {
      setJoinError('Por favor, ingresa un código de sesión válido.');
      return;
    }

    setIsJoining(true);

    try {
      const sessionRef = doc(db, 'sessions', code);
      const snap = await getDoc(sessionRef);

      if (!snap.exists()) {
        setJoinError(`No se encontró ninguna sesión activa con el código "${code}". Verifica que esté bien escrito.`);
        setIsJoining(false);
        return;
      }

      if (joinRole === 'teacher') {
        onNavigateToTeacher(code);
      } else {
        onNavigateToStudent(code);
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      setJoinError('Error al conectar con el servidor: ' + (err.message || ''));
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'student') {
      setCopiedStudentLink(true);
      setTimeout(() => setCopiedStudentLink(false), 2000);
    } else {
      setCopiedTeacherLink(true);
      setTimeout(() => setCopiedTeacherLink(false), 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Herramienta pedagógica universitaria en tiempo real
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
          Muro Digital de Interacción y Participación en el Aula
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300">
          Crea una sesión en segundos. Proyecta la consigna en el aula, permite a tus alumnos responder desde su celular sin contraseñas y revela las opiniones cuando desees debatir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Session */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/60">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nueva Sesión de Clase</h2>
              <p className="text-xs text-slate-400">Configura la actividad para proyectar en el aula</p>
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-5">
            {createError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {createError}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Materia / Tema de la clase
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Administración I - Comisión 2 / Bioética"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Consigna o pregunta disparadora
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej. ¿Qué dilema ético identifican en el caso analizado y cómo lo resolverían?"
                rows={3}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm sm:text-base resize-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Código de sesión <span className="text-xs text-slate-400 font-normal">(simple para el aula)</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Generar código
                </button>
              </div>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="Ej. ADM-101 (Opcional, se genera automático si está vacío)"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition uppercase text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creando sesión en la nube...
                </>
              ) : (
                <>
                  Crear sesión de clase
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Join Session + Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Join Box */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/60">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Unirse a una Sesión</h2>
                <p className="text-xs text-slate-400">Ingresa con el código provisto por la cátedra</p>
              </div>
            </div>

            <form onSubmit={handleJoinSession} className="space-y-4">
              {joinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {joinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Código de la sesión
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ej. ADM-101"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 font-mono text-center text-lg tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Ingresar como:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinRole('student')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      joinRole === 'student'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinRole('teacher')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      joinRole === 'teacher'
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Presentation className="w-4 h-4" />
                    Docente / Proyector
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-600"
              >
                {isJoining ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verificando código...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400" />
                    Entrar a la sesión
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick instructions card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              💡 Dinámica recomendada en el aula:
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
              <li>Crea la sesión y abre la vista de proyector en la pantalla grande.</li>
              <li>Los alumnos escanean el código QR proyectado con sus teléfonos.</li>
              <li>Deja las respuestas ocultas mientras responden para no sesgar opiniones.</li>
              <li>Haz clic en <strong>Revelar opiniones</strong> para debatir en conjunto y luego <strong>Guardar en PDF</strong> para el campus virtual.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Modal after Creating Session */}
      {createdSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 text-slate-100 relative">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">¡Sesión creada con éxito!</h3>
              <p className="text-slate-300 text-sm mt-1">
                Código asignado: <span className="font-mono font-bold text-indigo-400 text-base">{createdSession.code}</span>
              </p>
            </div>

            {/* Quick Access Grid */}
            <div className="space-y-4">
              {/* Student Access Box */}
              <div className="bg-slate-850 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-md">
                  <QRCodeSVG
                    value={createdSession.studentUrl}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Para los Estudiantes
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Escanean el QR o entran directo al enlace sin registro.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(createdSession.studentUrl, 'student')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-600"
                    >
                      {copiedStudentLink ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedStudentLink ? '¡Enlace copiado!' : 'Copiar enlace estudiante'}
                    </button>
                    <a
                      href={createdSession.studentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-lg transition border border-slate-600"
                      title="Abrir vista de estudiante"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Teacher Access Box */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Para el Proyector / Docente
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Controla el muro, revela las opiniones y genera el PDF para Moodle.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => copyToClipboard(createdSession.teacherUrl, 'teacher')}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700"
                    title="Copiar enlace de control"
                  >
                    {copiedTeacherLink ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onNavigateToTeacher(createdSession.code)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Presentation className="w-4 h-4" />
                    Abrir Proyector Ahora
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setCreatedSession(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cerrar este diálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
