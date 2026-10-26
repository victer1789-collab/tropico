import React, { useState } from 'react';
import {
  Video,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Users,
  Copy,
  Check,
  Download,
  BookOpen,
  Sparkles,
  ExternalLink,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { VirtualClass, AttendanceRecord, UserProfile, GradeLevel, Announcement } from '../types';
import { createGoogleMeetSpace } from '../services/meetService';
import { createClass, updateClassStatus } from '../services/classService';
import { Megaphone } from 'lucide-react';

interface TeacherDashboardProps {
  userProfile: UserProfile;
  accessToken: string | null;
  classes: VirtualClass[];
  attendance: AttendanceRecord[];
  students: UserProfile[];
  announcements?: Announcement[];
  onOpenScheduleModal: () => void;
  onOpenLiveAttendance: (classObj: VirtualClass) => void;
  onDeleteClass: (classObj: VirtualClass) => void;
  onJoinMeet: (classObj: VirtualClass) => void;
  onBroadcastClassCreated: (classObj: VirtualClass) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  userProfile,
  accessToken,
  classes,
  attendance,
  students,
  announcements = [],
  onOpenScheduleModal,
  onOpenLiveAttendance,
  onDeleteClass,
  onJoinMeet,
  onBroadcastClassCreated,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const teacherGrades = userProfile.teacherGrades && userProfile.teacherGrades.length > 0
    ? userProfile.teacherGrades
    : ['1ro', '2do', '3ro', '4to', '5to', '6to'];

  const [instantGrade, setInstantGrade] = useState<string>(teacherGrades[0] || '5to');
  const [instantTitle, setInstantTitle] = useState('');
  const [showInstantForm, setShowInstantForm] = useState(false);
  const [isInstantLoading, setIsInstantLoading] = useState(false);

  const teacherSubject = userProfile.assignedSubjects || 'Matemáticas y Cálculo';

  // Filter announcements for teachers (todos or docentes)
  const teacherAnnouncements = announcements.filter(
    (a) => a.targetAudience === 'todos' || a.targetAudience === 'docentes'
  );

  // Classes created by this teacher
  const myClasses = classes.filter((c) => c.teacherId === userProfile.uid || !c.teacherId);
  const liveClasses = myClasses.filter((c) => c.status === 'live');
  const upcomingClasses = myClasses.filter((c) => c.status === 'scheduled');
  const pastClasses = myClasses.filter((c) => c.status === 'completed');

  const copyMeetLink = (cls: VirtualClass) => {
    navigator.clipboard.writeText(cls.meetUrl);
    setCopiedId(cls.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Instant Google Meet link generator & transmit
  const handleCreateAndBroadcastInstantMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInstantLoading(true);

    try {
      // 1. Generate Google Meet link automatically using official API or instant room
      const meetRes = await createGoogleMeetSpace(accessToken);

      const title = instantTitle.trim() || `Clase en Vivo de ${teacherSubject} (${instantGrade} Grado)`;
      const newClass: Omit<VirtualClass, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        subject: teacherSubject,
        gradeLevel: instantGrade,
        description: `Transmisión en vivo de ${teacherSubject} para ${instantGrade} Grado en Google Meet.`,
        teacherId: userProfile.uid,
        teacherName: userProfile.displayName,
        teacherEmail: userProfile.email,
        meetUrl: meetRes.meetUrl,
        meetSpaceName: meetRes.spaceName,
        scheduledAt: new Date().toISOString(),
        durationMinutes: 90,
        status: 'live', // Start immediately in live mode
      };

      const classId = await createClass(newClass);
      const createdObj: VirtualClass = {
        ...newClass,
        id: classId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Broadcast notification to students
      onBroadcastClassCreated(createdObj);

      // 3. Reset form
      setShowInstantForm(false);
      setInstantTitle('');

      // 4. Open Google Meet call for the teacher
      window.open(meetRes.meetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error creating instant meet:', err);
    } finally {
      setIsInstantLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Announcements for Teacher */}
      {teacherAnnouncements.length > 0 && (
        <div className="space-y-2">
          {teacherAnnouncements.slice(0, 2).map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border shadow-lg flex items-start gap-3 animate-in fade-in ${
                ann.priority === 'urgente'
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-slate-900 border-purple-500/40 text-purple-200'
              }`}
            >
              <Megaphone className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ann.priority === 'urgente' ? 'text-red-400' : 'text-purple-400'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Comunicado de Dirección General: {ann.title}
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

      {/* Teacher Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/50 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                Panel Docente • Especialidad: {teacherSubject}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                Meet Automático Activo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido, {userProfile.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Inicia transmisiones con generación automática de Google Meet en 1 clic, notifica a tus alumnos y supervisa la lista de asistencia en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowInstantForm(!showInstantForm)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 glow-cyan transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Iniciar Clase Ahora (Meet Automático)</span>
            </button>

            <button
              onClick={onOpenScheduleModal}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 glow-electric transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Clase</span>
            </button>
          </div>
        </div>

        {/* Quick Instant Meet Creation Card */}
        {showInstantForm && (
          <form
            onSubmit={handleCreateAndBroadcastInstantMeet}
            className="mt-5 p-5 rounded-2xl bg-slate-950/90 border border-blue-500/50 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Iniciar Transmisión con Google Meet Automático</span>
              </h3>
              <span className="text-[11px] text-cyan-300">
                El enlace se crea solo y se notifica al curso seleccionado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tema o Título de la Sesión
                </label>
                <input
                  type="text"
                  placeholder={`Ej. Repaso Intensivo de ${teacherSubject}`}
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Grado Dirigido
                </label>
                <select
                  value={instantGrade}
                  onChange={(e) => setInstantGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none cursor-pointer"
                >
                  {teacherGrades.map((g) => (
                    <option key={g} value={g}>
                      {g} Grado (Mi Curso)
                    </option>
                  ))}
                  <option value="Todos">Todos mis grados</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInstantForm(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isInstantLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-extrabold shadow-lg shadow-blue-900/40 glow-electric transition-all flex items-center gap-2 cursor-pointer"
              >
                {isInstantLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando Sala Meet...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Lanzar Clase y Notificar a Alumnos</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Clases En Vivo Ahora</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">{liveClasses.length}</span>
          <p className="text-[11px] text-slate-400 mt-1">Transmitiendo en Google Meet</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Próximas Sesiones</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{upcomingClasses.length}</span>
          <p className="text-[11px] text-slate-400 mt-1">Sincronizadas con Google Calendar</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Alumnos Registrados</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-cyan-400">{students.length}</span>
          <p className="text-[11px] text-slate-400 mt-1">De 1ero a 6to grado</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Asistencias Totales</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-purple-400">{attendance.length}</span>
          <p className="text-[11px] text-slate-400 mt-1">Registros en tiempo real</p>
        </div>
      </div>

      {/* Live Active Classes Section */}
      {liveClasses.length > 0 && (
        <div className="rounded-3xl bg-slate-900/90 border-2 border-emerald-500/50 p-6 shadow-2xl glow-electric">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span>Tus Clases en Vivo en Google Meet</span>
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Transmitiendo Ahora
            </span>
          </div>

          <div className="space-y-3">
            {liveClasses.map((cls) => {
              const liveConnectedCount = attendance.filter((a) => a.classId === cls.id).length;

              return (
                <div
                  key={cls.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 font-semibold text-xs">
                        {cls.subject} ({cls.gradeLevel || '5to'} Grado)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {liveConnectedCount} alumnos conectados en vivo
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{cls.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">{cls.meetUrl}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <button
                      onClick={() => copyMeetLink(cls)}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800"
                      title="Copiar enlace de Google Meet"
                    >
                      {copiedId === cls.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-400" />
                      )}
                    </button>

                    <button
                      onClick={() => onOpenLiveAttendance(cls)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Pasar Lista en Vivo</span>
                    </button>

                    <button
                      onClick={() => onJoinMeet(cls)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/40 glow-electric transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Entrar a Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => updateClassStatus(cls.id, 'completed')}
                      className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
                    >
                      <span>Finalizar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Scheduled Classes */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Clases Programadas en Calendario</span>
          </h2>
          <span className="text-xs text-slate-400">{upcomingClasses.length} sesiones agendadas</span>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-semibold">No tienes clases futuras agendadas</p>
            <button
              onClick={onOpenScheduleModal}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
            >
              + Programar Nueva Clase
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 text-xs font-semibold">
                      {cls.subject} ({cls.gradeLevel || '5to'} Grado)
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(cls.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{cls.title}</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-md">{cls.meetUrl}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateClassStatus(cls.id, 'live')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Ahora</span>
                  </button>

                  <button
                    onClick={() => copyMeetLink(cls)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  >
                    {copiedId === cls.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onDeleteClass(cls)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
