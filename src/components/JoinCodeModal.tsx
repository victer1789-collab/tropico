import React, { useState } from 'react';
import { X, Video, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { VirtualClass } from '../types';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: VirtualClass[];
  onJoinDirectMeet: (meetUrl: string, classObj?: VirtualClass) => void;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onClose,
  classes,
  onJoinDirectMeet,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setError('Por favor ingresa un enlace o código de Google Meet.');
      return;
    }

    let finalUrl = trimmed;
    // If user enters code like "abc-defg-hij", prepend https://meet.google.com/
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      finalUrl = `https://meet.google.com/${trimmed}`;
    }

    // Check if it matches an existing class
    const matchedClass = classes.find((c) => c.meetUrl === finalUrl || c.meetUrl.includes(trimmed));

    onJoinDirectMeet(finalUrl, matchedClass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Unirse a Clase con Enlace</h3>
            <p className="text-xs text-slate-400">Google Meet con asistencia automática</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enlace o Código de la Reunión
            </label>
            <input
              type="text"
              required
              placeholder="https://meet.google.com/xxx-yyyy-zzz o xxx-yyyy-zzz"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Al unirte, tu asistencia se registrará automáticamente en tiempo real en la plataforma.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 glow-electric cursor-pointer flex items-center gap-1.5"
            >
              <span>Acceder a Meet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
