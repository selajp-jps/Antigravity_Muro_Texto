import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Download } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, joinUrl, sessionCode, sessionTitle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('session-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${sessionCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-850 border border-slate-700/80 bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            Acceso para estudiantes
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">{sessionTitle || 'Sesión en Vivo'}</h3>
          <p className="text-slate-400 text-sm mt-1">
            Escanea el código QR con tu celular o ingresa con el código:
          </p>
          <div className="mt-2 text-2xl font-mono font-black text-indigo-400 bg-slate-950/70 border border-indigo-500/30 rounded-lg py-1.5 px-4 inline-block tracking-widest">
            {sessionCode}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-5 rounded-xl inline-block shadow-inner my-2">
          <QRCodeSVG
            id="session-qr-svg"
            value={joinUrl}
            size={240}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="truncate text-left font-mono">{joinUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition text-xs shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Descargar imagen QR
            </button>
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium transition"
            >
              <ExternalLink className="w-4 h-4" />
              Probar enlace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
