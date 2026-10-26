import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Download,
  Copy,
  Check,
  Video,
  Clock,
  Laptop,
  Smartphone,
  ExternalLink,
  Edit2,
  Save,
} from 'lucide-react';
import { VirtualClass, AttendanceRecord, AttendanceStatus, UserRole } from '../types';
import {
  subscribeToClassAttendance,
  updateAttendanceStatus,
  exportAttendanceCSV,
} from '../services/attendanceService';

interface LiveAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classObj: VirtualClass | null;
  activeRole: UserRole;
  onJoinMeet: (classObj: VirtualClass) => void;
}

export const LiveAttendanceModal: React.FC<LiveAttendanceModalProps> = ({
  isOpen,
  onClose,
  classObj,
  activeRole,
  onJoinMeet,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !classObj) return;

    const unsubscribe = subscribeToClassAttendance(classObj.id, (data) => {
      setRecords(data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, classObj]);

  if (!isOpen || !classObj) return null;

  const copyMeet = () => {
    navigator.clipboard.writeText(classObj.meetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExport = () => {
    exportAttendanceCSV(records, classObj.title);
  };

  const startEdit = (rec: AttendanceRecord) => {
    setEditingId(rec.id);
    setEditStatus(rec.status);
    setEditNotes(rec.notes || '');
  };

  const saveEdit = async (recId: string) => {
    await updateAttendanceStatus(recId, editStatus, editNotes);
    setEditingId(null);
  };

  const filteredRecords = records.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.studentName.toLowerCase().includes(search.toLowerCase()) && !r.studentEmail.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const statusConfigs: Record<AttendanceStatus, { label: string; bg: string; text: string; border: string }> = {
    present: { label: 'Presente', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    late: { label: 'Tardanza', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    absent: { label: 'Ausente', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    excused: { label: 'Justificado', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  };

  const isTeacherOrAdmin = activeRole === 'admin' || activeRole === 'docente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-500/30">
                {classObj.subject}
              </span>
              {classObj.status === 'live' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EN VIVO
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">{classObj.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Docente: <span className="text-slate-200">{classObj.teacherName}</span> • Asistencia en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={copyMeet}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar Meet'}</span>
            </button>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => onJoinMeet(classObj)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/40 glow-electric transition-all cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Entrar a Meet</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Total Conectados</span>
              <h4 className="text-base font-bold text-white">{records.length}</h4>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Puntuales</span>
              <h4 className="text-base font-bold text-emerald-400">
                {records.filter((r) => r.status === 'present').length}
              </h4>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Tardanzas</span>
              <h4 className="text-base font-bold text-amber-400">
                {records.filter((r) => r.status === 'late').length}
              </h4>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Escritorio / Móvil</span>
              <h4 className="text-xs font-bold text-slate-200">
                {records.filter((r) => r.deviceType?.includes('Escritorio')).length} / {records.filter((r) => r.deviceType?.includes('Móvil')).length}
              </h4>
            </div>
          </div>
        </div>

        {/* Controls: Search & Status Filter */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border-b border-slate-800">
          <input
            type="text"
            placeholder="Buscar estudiante por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['all', 'present', 'late', 'excused', 'absent'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  filter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st === 'all'
                  ? 'Todos'
                  : st === 'present'
                  ? 'Presentes'
                  : st === 'late'
                  ? 'Tardanzas'
                  : st === 'excused'
                  ? 'Justificados'
                  : 'Ausentes'}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Sin registros de asistencia aún</p>
              <p className="text-xs text-slate-500 mt-1">
                Cuando los estudiantes hagan clic en "Entrar a Clase (Meet)", su asistencia se registrará en vivo aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRecords.map((rec) => {
                const config = statusConfigs[rec.status] || statusConfigs.present;
                const isEditing = editingId === rec.id;

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                        {rec.studentName[0]?.toUpperCase() || 'E'}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          {rec.studentName}
                        </h4>
                        <p className="text-[11px] text-slate-400">{rec.studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                      {/* Device badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        {rec.deviceType?.includes('Móvil') ? (
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span className="text-[11px]">{rec.deviceType || 'Web'}</span>
                      </div>

                      {/* Entry Time */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {rec.joinedAt
                            ? new Date(rec.joinedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'N/A'}
                        </span>
                      </div>

                      {/* Status pill or Edit selector */}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          >
                            <option value="present">Presente</option>
                            <option value="late">Tardanza</option>
                            <option value="excused">Justificado</option>
                            <option value="absent">Ausente</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Notas..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs w-32"
                          />
                          <button
                            onClick={() => saveEdit(rec.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                          >
                            {config.label}
                          </span>

                          {rec.notes && (
                            <span className="text-[11px] text-slate-400 max-w-[120px] truncate" title={rec.notes}>
                              "{rec.notes}"
                            </span>
                          )}

                          {isTeacherOrAdmin && (
                            <button
                              onClick={() => startEdit(rec)}
                              title="Modificar estado de asistencia"
                              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
