import React, { useState } from 'react';
import {
  Video,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  Award,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { VirtualClass, AttendanceRecord, MonthlyAcademicReport, UserProfile, Announcement } from '../types';
import { Megaphone } from 'lucide-react';

interface StudentDashboardProps {
  userProfile: UserProfile;
  classes: VirtualClass[];
  attendance: AttendanceRecord[];
  reports: MonthlyAcademicReport[];
  announcements?: Announcement[];
  onJoinClass: (classObj: VirtualClass) => void;
  onOpenJoinCodeModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userProfile,
  classes,
  attendance,
  reports,
  announcements = [],
  onJoinClass,
  onOpenJoinCodeModal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const studentGrade = userProfile.gradeLevel || '5to';

  // Filter announcements for this student (todos, estudiantes, or their grade)
  const myAnnouncements = announcements.filter(
    (a) =>
      a.targetAudience === 'todos' ||
      a.targetAudience === 'estudiantes' ||
      a.targetAudience.toLowerCase().includes(studentGrade.toLowerCase())
  );

  // Filter classes relevant for this student (their grade or 'Todos')
  const myClasses = classes.filter((c) => {
    if (!c.gradeLevel || c.gradeLevel === 'Todos') return true;
    const cleanStudentGrade = studentGrade.toLowerCase().replace('grado', '').trim();
    const cleanClassGrade = c.gradeLevel.toLowerCase().replace('grado', '').trim();
    return cleanClassGrade === cleanStudentGrade || c.gradeLevel.toLowerCase().includes(cleanStudentGrade);
  });

  // Live classes right now for this student
  const liveClass = myClasses.find((c) => c.status === 'live');

  // Upcoming classes
  const upcomingClasses = myClasses.filter((c) => c.status === 'scheduled');

  // My attendance records
  const myAttendance = attendance.filter((a) => a.studentId === userProfile.uid);
  const totalAttended = myAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const totalLate = myAttendance.filter((a) => a.status === 'late').length;

  // My monthly academic report
  const myReport = reports.find((r) => r.studentId === userProfile.uid);
  const attendancePercentage = myReport
    ? myReport.attendanceRate
    : myClasses.length > 0
    ? Math.round((totalAttended / myClasses.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                Aula de {studentGrade} Grado
              </span>
              <span className="text-xs text-slate-400">Academia Virtual Mi Trópico</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ¡Hola, {userProfile.displayName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Toca directamente el botón <strong className="text-white">"Unirse a Clase"</strong> para entrar a tu sesión en vivo y registrar tu asistencia en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ingreso Directo en 1 Clic</span>
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Announcements for Student */}
      {myAnnouncements.length > 0 && (
        <div className="space-y-2">
          {myAnnouncements.slice(0, 2).map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border shadow-lg flex items-start gap-3 animate-in fade-in ${
                ann.priority === 'urgente'
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-slate-900 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <Megaphone className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ann.priority === 'urgente' ? 'text-red-400' : 'text-cyan-400'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Comunicado de Dirección: {ann.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Live Class Alert (If any class is streaming now) */}
      {liveClass && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950/50 border-2 border-emerald-500 shadow-2xl glow-electric animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>¡CLASE EN VIVO EN ESTE MOMENTO!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{liveClass.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30">
                  {liveClass.subject}
                </span>
                <span>•</span>
                <span>Docente: <strong className="text-white">{liveClass.teacherName}</strong></span>
                <span>•</span>
                <span>Grado: <strong className="text-cyan-300">{liveClass.gradeLevel || studentGrade} Grado</strong></span>
              </div>
            </div>

            <button
              onClick={() => onJoinClass(liveClass)}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-blue-600 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm shadow-2xl shadow-blue-900/60 glow-electric transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 flex-shrink-0"
            >
              <Video className="w-5 h-5 animate-pulse" />
              <span>Unirse a Clase Ahora (1 Clic)</span>
              <ExternalLink className="w-4 h-4 opacity-90" />
            </button>
          </div>
        </div>
      )}

      {/* Student KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>% Asistencia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">{attendancePercentage}%</span>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalAttended} asistencias confirmadas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Nota del Mes</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-cyan-400">
            {myReport ? `${myReport.grade}/20` : '18/20'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Escala vigesimal (0 a 20)</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tardanzas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400">{totalLate}</span>
          <p className="text-[11px] text-slate-400 mt-1">Ingresos luego de 10 min</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mi Grado</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{studentGrade}</span>
          <p className="text-[11px] text-slate-400 mt-1">Secundaria / Academia</p>
        </div>
      </div>

      {/* Main Grid: Scheduled Classes for the Student */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Mis Próximas Clases Virtuales
              </h2>
              <p className="text-xs text-slate-400">
                Enlaces directos de Google Meet y horarios para {studentGrade} Grado
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {upcomingClasses.length} programadas
          </span>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold">No tienes clases pendientes para hoy</p>
            <p className="text-xs text-slate-500 mt-1">
              Tus docentes publicarán las sesiones con enlaces de Google Meet en este panel.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((cls) => {
              const diffMinutes = Math.round(
                (new Date(cls.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60)
              );

              return (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-semibold text-xs border border-blue-500/30">
                        {cls.subject}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {diffMinutes > 0 ? `Comienza en ${diffMinutes} min` : 'Iniciando en breve'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white">{cls.title}</h3>
                    <p className="text-xs text-slate-400">
                      Profesor: <span className="text-slate-300">{cls.teacherName}</span> • Fecha:{' '}
                      {new Date(cls.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onJoinClass(cls)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-900/40 glow-electric transition-all cursor-pointer active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Unirse a Clase</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance log */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mi Historial de Asistencia Reciente</span>
          </h3>

          {myAttendance.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Aún no tienes asistencias registradas. Entra a una clase en vivo para marcar tu presencia.
            </p>
          ) : (
            <div className="space-y-2">
              {myAttendance.slice(0, 5).map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">
                      {classes.find((c) => c.id === att.classId)?.title || 'Clase Virtual'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {att.joinedAt ? new Date(att.joinedAt).toLocaleString() : 'N/A'} • {att.deviceType || 'Web'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      att.status === 'present'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : att.status === 'late'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {att.status === 'present' ? 'Presente' : att.status === 'late' ? 'Tardanza' : 'Ausente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teacher Feedback & Evaluation */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Observaciones del Docente &amp; Desempeño</span>
          </h3>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Evaluación Mensual (Octubre 2026)</span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-xs">
                Nota: {myReport ? myReport.grade : 18}/20
              </span>
            </div>

            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{myReport?.feedback || 'Demuestra constancia en el ingreso puntual a las sesiones de Google Meet y excelente desempeño en las evaluaciones.'}"
            </p>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Academia Virtual Mi Trópico</span>
              <span>Docente Tutor Asignado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
