import React from 'react';
import { Presentation, Home, Sparkles } from 'lucide-react';

export default function Navbar({ onGoHome, currentSessionCode, role }) {
  return (
    <header className="no-print bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg group-hover:text-indigo-400 transition">
                Muro de Clases
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-2.5 h-2.5" /> Universitario
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interacción y lluvia de ideas en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentSessionCode && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">Sesión:</span>
              <span className="font-mono font-bold text-indigo-400">{currentSessionCode}</span>
              {role && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  role === 'teacher' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {role === 'teacher' ? 'Proyector' : 'Estudiante'}
                </span>
              )}
            </div>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition"
              title="Volver al inicio"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
