import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  User as UserIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Copy,
  Check,
  Play,
  CheckCircle,
  Trash2,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { VirtualClass, UserRole } from '../types';

interface CalendarViewProps {
  classes: VirtualClass[];
  activeRole: UserRole;
  currentUserId?: string;
  onJoinClass: (classObj: VirtualClass) => void;
  onOpenLiveAttendance: (classObj: VirtualClass) => void;
  onUpdateStatus: (classId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled') => void;
  onDeleteClass: (classObj: VirtualClass) => void;
  onOpenScheduleModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  classes,
  activeRole,
  currentUserId,
  onJoinClass,
  onOpenLiveAttendance,
  onUpdateStatus,
  onDeleteClass,
  onOpenScheduleModal,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique subjects
  const subjects = Array.from(new Set(classes.map((c) => c.subject))).filter(Boolean);

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    if (filterSubject !== 'all' && cls.subject !== filterSubject) return false;
    if (filterGrade !== 'all' && cls.gradeLevel && cls.gradeLevel !== filterGrade && cls.gradeLevel !== 'Todos') return false;
    if (filterStatus === 'live' && cls.status !== 'live') return false;
    if (filterStatus === 'scheduled' && cls.status !== 'scheduled') return false;
    if (filterStatus === 'completed' && cls.status !== 'completed') return false;
    return true;
  });

  // Days in month calculation for the grid
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  const copyMeetLink = (cls: VirtualClass) => {
    navigator.clipboard.writeText(cls.meetUrl);
    setCopiedId(cls.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCountdownText = (scheduledAt: string, status: string) => {
    if (status === 'live') return '¡En vivo ahora!';
    if (status === 'completed') return 'Finalizada';
    if (status === 'cancelled') return 'Cancelada';

    const diffMs = new Date(scheduledAt).getTime() - new Date().getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 0 && Math.abs(diffMins) < 120) return 'Iniciando sesión...';
    if (diffMins <= 60 && diffMins > 0) return `Empieza en ${diffMins} min`;
    if (diffMins > 60 && diffMins <= 1440) return `Empieza en ${Math.round(diffMins / 60)} horas`;
    return new Date(scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Calendario de Clases Virtuales
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              {classes.filter((c) => c.status === 'live').length > 0 ? 'Clase En Vivo' : 'Activo'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Acceso directo a Google Meet, control de asistencia sincronizado y notificaciones automáticas.
          </p>
        </div>

        {/* View mode toggle and schedule action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Vista Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lista de Clases</span>
            </button>
          </div>

          {activeRole !== 'estudiante' && (
            <button
              onClick={onOpenScheduleModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 glow-electric cursor-pointer flex items-center gap-1.5"
            >
              <Video className="w-4 h-4" />
              <span>+ Programar Clase</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium pl-1">Filtrar:</span>
        <button
          onClick={() => { setFilterSubject('all'); setFilterStatus('all'); }}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
            filterSubject === 'all' && filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Todas ({classes.length})
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === 'live' ? 'all' : 'live')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'live'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>En Vivo Ahora ({classes.filter((c) => c.status === 'live').length})</span>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === 'scheduled' ? 'all' : 'scheduled')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
            filterStatus === 'scheduled'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Próximas ({classes.filter((c) => c.status === 'scheduled').length})
        </button>

        {/* Grade filters */}
        {(['1ero', '2do', '3ero', '4to', '5to', '6to'] as const).map((gr) => (
          <button
            key={gr}
            onClick={() => setFilterGrade(filterGrade === gr ? 'all' : gr)}
            className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
              filterGrade === gr
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 text-purple-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {gr} Grado
          </button>
        ))}

        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setFilterSubject(filterSubject === sub ? 'all' : sub)}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterSubject === sub
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Grid (if in calendar mode) */}
        {viewMode === 'calendar' && (
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl h-fit">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>{monthNames[month]} {year}</span>
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 rounded-lg" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const dayClasses = classes.filter((c) => c.scheduledAt.startsWith(dateStr));
                const isToday =
                  new Date().getDate() === dayNumber &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(new Date(year, month, dayNumber))}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between text-xs transition-all cursor-pointer border ${
                      isToday
                        ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold'
                        : dayClasses.length > 0
                        ? 'border-slate-700/80 bg-slate-850 hover:border-slate-600 text-slate-200'
                        : 'border-transparent hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <span>{dayNumber}</span>
                    {dayClasses.length > 0 && (
                      <div className="flex gap-1 pb-0.5">
                        {dayClasses.slice(0, 3).map((dc) => (
                          <span
                            key={dc.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              dc.status === 'live'
                                ? 'bg-emerald-400 animate-pulse'
                                : dc.status === 'completed'
                                ? 'bg-slate-500'
                                : 'bg-blue-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> En Vivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Programada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Concluida
              </span>
            </div>
          </div>
        )}

        {/* Right / Full Column: Class Cards */}
        <div className={viewMode === 'calendar' ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Video className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No hay clases programadas</h3>
              <p className="text-xs text-slate-400 mt-1">
                {filterSubject !== 'all'
                  ? 'No hay clases para la asignatura seleccionada.'
                  : 'Crea tu primera clase con Google Meet para comenzar.'}
              </p>
              {activeRole !== 'estudiante' && (
                <button
                  onClick={onOpenScheduleModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Programar Clase Ahora
                </button>
              )}
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const isLive = cls.status === 'live';
              const isOwner = cls.teacherId === currentUserId || activeRole === 'admin';

              return (
                <div
                  key={cls.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                    isLive
                      ? 'bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-blue-500/60 shadow-xl glow-electric'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top status & subject */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-400 font-semibold text-xs border border-blue-500/20">
                        {cls.subject}
                      </span>

                      {cls.gradeLevel && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 font-semibold text-xs border border-purple-500/20">
                          {cls.gradeLevel} Grado
                        </span>
                      )}

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          EN VIVO AHORA
                        </span>
                      ) : cls.status === 'completed' ? (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-medium text-xs">
                          Finalizada
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 font-medium text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getCountdownText(cls.scheduledAt, cls.status)}
                        </span>
                      )}

                      {/* Google Calendar sync indicator */}
                      {cls.calendarEventId && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Google Calendar
                        </span>
                      )}
                    </div>

                    {/* Teacher quick actions */}
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        {cls.status === 'scheduled' && (
                          <button
                            onClick={() => onUpdateStatus(cls.id, 'live')}
                            title="Iniciar transmisión en vivo"
                            className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Iniciar</span>
                          </button>
                        )}
                        {cls.status === 'live' && (
                          <button
                            onClick={() => onUpdateStatus(cls.id, 'completed')}
                            title="Concluir clase"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">Finalizar</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClass(cls)}
                          title="Eliminar clase"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title and description */}
                  <h3 className="mt-3 text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {cls.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {cls.description}
                  </p>

                  {/* Metadata: Teacher, Date, Duration */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">{cls.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cls.durationMinutes} minutos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(cls.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyMeetLink(cls)}
                        title="Copiar enlace de Google Meet"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === cls.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Live attendance view */}
                      <button
                        onClick={() => onOpenLiveAttendance(cls)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Asistencia</span>
                      </button>

                      {/* Enter Google Meet button */}
                      <button
                        onClick={() => onJoinClass(cls)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          isLive
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-900/40 glow-electric'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Entrar a Clase</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
