import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Send, 
  CheckCircle2, 
  Lock, 
  User, 
  MessageSquare, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  PlusCircle,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StudentView({ sessionCode, onGoHome }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(() => localStorage.getItem('muro_student_name') || '');
  const [isAnonymous, setIsAnonymous] = useState(() => localStorage.getItem('muro_student_anon') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState(null);

  // Subscribe to Session in real-time
  useEffect(() => {
    if (!sessionCode) return;
    const sessionRef = doc(db, 'sessions', sessionCode);

    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data());
        setError('');
      } else {
        setError(`La sesión con código "${sessionCode}" no fue encontrada.`);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error al escuchar sesión:', err);
      setError('Error de conexión con la sesión: ' + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (session?.locked) {
      alert('La recepción de respuestas está bloqueada.');
      return;
    }

    if (!text.trim()) {
      alert('Por favor, escribe tu opinión antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const responsesRef = collection(db, 'sessions', sessionCode, 'responses');
      const studentName = isAnonymous ? 'Anónimo' : (author.trim() || 'Estudiante');

      const newResponse = {
        text: text.trim(),
        author: studentName,
        isAnonymous: Boolean(isAnonymous),
        createdAt: serverTimestamp(),
      };

      await addDoc(responsesRef, newResponse);

      // Save name preference locally
      if (!isAnonymous && author.trim()) {
        localStorage.setItem('muro_student_name', author.trim());
      }
      localStorage.setItem('muro_student_anon', String(isAnonymous));

      setSubmittedAnswer(newResponse);
      setHasSubmitted(true);

      // Mini confetti on mobile for rewarding interaction
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });

    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      alert('Ocurrió un error al enviar tu respuesta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnotherAnswer = () => {
    setText('');
    setHasSubmitted(false);
    setSubmittedAnswer(null);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-300 p-4 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-base font-medium">Conectando con el aula...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-800/90 border border-red-500/30 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Sesión no disponible</h2>
        <p className="text-slate-300 text-sm mb-6">{error || 'Verifica el código de la sesión.'}</p>
        <button
          onClick={onGoHome}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition"
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  const isLocked = Boolean(session.locked);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-lg mx-auto px-4 py-6 sm:py-8">
      {/* Session Header Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/25 backdrop-blur-md mb-6">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate max-w-[200px]">
              {session.title}
            </span>
          </div>
          <span className="font-mono font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
            {session.code}
          </span>
        </div>

        {/* Prompt Card */}
        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" /> Consigna de la Cátedra:
          </span>
          <p className="text-base sm:text-lg font-bold text-white leading-snug">
            "{session.prompt}"
          </p>
        </div>
      </div>

      {/* State A: Session is locked by teacher */}
      {isLocked && !hasSubmitted ? (
        <div className="bg-red-950/40 border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center text-red-200 shadow-xl animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Recepción de Respuestas Cerrada</h3>
          <p className="text-sm text-red-300 leading-relaxed">
            El docente o ayudante ha pausado los envíos de esta actividad. Presta atención al proyector para el debate y puesta en común de las opiniones.
          </p>
        </div>
      ) : hasSubmitted ? (
        /* State B: Answer submitted successfully */
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-xl shadow-black/25 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-extrabold text-white mb-2">
            ¡Respuesta enviada con éxito!
          </h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Esperando que el docente comparta las opiniones en pantalla.
          </p>

          {/* Preview of submitted text */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-left mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-1 border-b border-slate-800">
              <span>Tu aporte ({submittedAnswer?.isAnonymous ? 'Anónimo' : submittedAnswer?.author})</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Registrado en vivo
              </span>
            </div>
            <p className="text-slate-100 text-sm sm:text-base italic whitespace-pre-wrap">
              "{submittedAnswer?.text}"
            </p>
          </div>

          {/* Option to send another response if not locked */}
          {!isLocked && (
            <button
              onClick={handleResetForAnotherAnswer}
              className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-sm font-semibold transition flex items-center justify-center gap-2 border border-slate-600"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Enviar otra opinión o aporte
            </button>
          )}
        </div>
      ) : (
        /* State C: Active submission form */
        <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/25 backdrop-blur-md space-y-5">
          {/* Main textarea */}
          <div>
            <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Tu respuesta u opinión:
              </span>
              <span className={`text-xs font-mono ${text.length > 800 ? 'text-amber-400' : 'text-slate-400'}`}>
                {text.length}/1000
              </span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Escribe aquí tus ideas, argumentos o dudas con claridad..."
              rows={5}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-base resize-none"
              required
              autoFocus
            />
          </div>

          {/* Name & Anonymous settings */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="anon-toggle" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200 cursor-pointer select-none">
                <input
                  id="anon-toggle"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-600 cursor-pointer"
                />
                <span>Enviar como respuesta anónima</span>
              </label>
              {isAnonymous && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Anónimo
                </span>
              )}
            </div>

            {!isAnonymous && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Tu nombre y apellido (opcional):
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ej. Martín García"
                  maxLength={50}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Enviando al proyector...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar opinión al aula
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer info */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Muro de Clases Universitario • Conexión en tiempo real</p>
      </div>
    </div>
  );
}
