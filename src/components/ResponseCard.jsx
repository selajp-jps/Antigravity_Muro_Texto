import React from 'react';
import { User, Clock, ShieldCheck } from 'lucide-react';

export default function ResponseCard({ response, index }) {
  const isAnonymous = response.isAnonymous || !response.author || response.author.trim() === '';
  const authorName = isAnonymous ? 'Anónimo' : response.author;

  let timeString = '';
  if (response.createdAt?.toDate) {
    timeString = response.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (response.createdAt instanceof Date) {
    timeString = response.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Generate subtle accent tint based on index for visual variety on the wall
  const colorBorders = [
    'hover:border-indigo-500/60 border-slate-750',
    'hover:border-blue-500/60 border-slate-750',
    'hover:border-emerald-500/60 border-slate-750',
    'hover:border-violet-500/60 border-slate-750',
    'hover:border-amber-500/60 border-slate-750',
    'hover:border-cyan-500/60 border-slate-750',
  ];
  const borderClass = colorBorders[index % colorBorders.length];

  return (
    <div
      className={`print-card group relative bg-slate-800/95 border border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${borderClass}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 print:border-slate-400 print:text-slate-800">
            #{index + 1}
          </span>
          <div className="flex items-center gap-1.5 font-medium">
            {isAnonymous ? (
              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-700/40 text-[11px] print:text-slate-700">
                <User className="w-3 h-3" /> Anónimo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40 text-[11px] font-semibold print:text-slate-900">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> {authorName}
              </span>
            )}
          </div>
        </div>

        {timeString && (
          <span className="flex items-center gap-1 text-slate-400 text-[11px] font-mono print:text-slate-600">
            <Clock className="w-3 h-3" /> {timeString}
          </span>
        )}
      </div>

      {/* Card Body - Large, readable text suitable for projector */}
      <div className="text-slate-100 print:text-black text-base sm:text-lg font-normal leading-relaxed break-words flex-1 whitespace-pre-wrap">
        {response.text}
      </div>
    </div>
  );
}
