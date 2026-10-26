import React from 'react';
import { Bell, X, Video, CheckCircle2, Clock, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { InAppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onJoinClass?: (classId: string, meetUrl: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  soundEnabled,
  onToggleSound,
  onJoinClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Centro de Notificaciones
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {notifications.filter((n) => !n.read).length} nuevas
                </span>
              </h3>
              <p className="text-xs text-slate-400">Alertas automáticas de clases y asistencia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium">No tienes notificaciones pendientes</p>
              <p className="text-xs text-slate-500 mt-1">
                Las alertas de inicio de clase y registro de asistencia aparecerán aquí.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-800/40 border-slate-800/80 text-slate-300'
                    : 'bg-gradient-to-r from-blue-950/40 to-slate-900 border-blue-500/40 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                        notif.type === 'class_starting'
                          ? 'bg-blue-600/20 text-blue-400'
                          : notif.type === 'attendance'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {notif.type === 'class_starting' ? (
                        <Video className="w-4 h-4" />
                      ) : notif.type === 'attendance' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{notif.message}</p>
                      <span className="text-[11px] text-slate-400 mt-1 inline-block">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {notif.meetUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onJoinClass && notif.classId) {
                          onJoinClass(notif.classId, notif.meetUrl!);
                        } else {
                          window.open(notif.meetUrl, '_blank');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shadow-md shadow-blue-900/30 flex-shrink-0 cursor-pointer"
                    >
                      Entrar <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Notificaciones sincronizadas con Google Calendar & Meet
            </span>
            <button
              onClick={onClearAll}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
            >
              Marcar todo como leído
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
