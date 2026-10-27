import React, { useState } from 'react';
import { X, Video, Calendar, Clock, BookOpen, Sparkles, Loader2, Check, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createGoogleMeetSpace } from '../services/meetService';
import { createGoogleCalendarEvent } from '../services/calendarService';
import { createClass } from '../services/classService';
import { VirtualClass, GradeLevel } from '../types';
import { db } from '../firebase';

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: (classObj: VirtualClass) => void;
}

export const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({
  isOpen,
  onClose,
  onClassCreated,
}) => {
  const { user, userProfile, accessToken } = useAuth();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(userProfile?.assignedSubjects || 'Matemáticas y Cálculo');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | 'Todos'>('5to');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(60);
  const [autoMeet, setAutoMeet] = useState(true);
  const [customMeetUrl, setCustomMeetUrl] = useState('');
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Por favor ingresa el título de la clase.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let finalMeetUrl = customMeetUrl.trim();
      let meetSpaceName: string | undefined = undefined;

      // 1. Generate Google Meet link via Meet API if selected
      if (autoMeet || !finalMeetUrl) {
        const meetRes = await createGoogleMeetSpace(accessToken);
        finalMeetUrl = meetRes.meetUrl;
        meetSpaceName = meetRes.spaceName;
      }

      // 2. Synchronize with Google Calendar if enabled
      let calendarEventId: string | undefined = undefined;
      let calendarHtmlLink: string | undefined = undefined;

      if (syncCalendar && accessToken) {
        const calRes = await createGoogleCalendarEvent(accessToken, {
          title: `[${gradeLevel} Grado] ${title}`,
          description: description || `Clase virtual de ${subject} para ${gradeLevel} Grado en Academia Virtual Mi Trópico`,
          scheduledAt: new Date(date).toISOString(),
          durationMinutes: duration,
          meetUrl: finalMeetUrl,
        });

        if (calRes.eventId) {
          calendarEventId = calRes.eventId;
          calendarHtmlLink = calRes.htmlLink;
        }
      }

      // 3. Save virtual class to Firestore
      const newClassData = {
        title: title.trim(),
        subject,
        gradeLevel,
        description:
          description.trim() ||
          `Sesión de ${subject} para ${gradeLevel} Grado a través de Google Meet en Academia Virtual Mi Trópico.`,
        teacherId: user?.uid || userProfile?.uid || 'docente_mitropico',
        teacherName: userProfile?.displayName || user?.displayName || 'Docente Mi Trópico',
        teacherEmail: userProfile?.email || user?.email || 'docente@mitropico.edu',
        meetUrl: finalMeetUrl,
        meetSpaceName,
        calendarEventId,
        calendarHtmlLink,
        scheduledAt: new Date(date).toISOString(),
        durationMinutes: duration,
        status: 'scheduled' as const,
      };

      const newId = await createClass(newClassData);

      const createdObj: VirtualClass = {
        ...newClassData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onClassCreated(createdObj);
      onClose();
    } catch (err) {
      console.error('Error creating class:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error al programar la clase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Programar Clase Virtual</h2>
            <p className="text-xs text-slate-400">
              Academia Virtual Mi Trópico • Google Meet &amp; Calendar
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asignatura y Grado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Materia
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Matemáticas, Física, Lenguaje"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Grado Destino
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel | 'Todos')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="1ro">1ro Grado</option>
                <option value="2do">2do Grado</option>
                <option value="3ro">3ro Grado</option>
                <option value="4to">4to Grado</option>
                <option value="5to">5to Grado</option>
                <option value="6to">6to Grado</option>
                <option value="Todos">Todos los grados</option>
              </select>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título o Tema de la Clase *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Ecuaciones Diferenciales y Aplicaciones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción u Objetivos
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre lo que se desarrollará en la sesión virtual..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Fecha y Hora + Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha y Hora
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Duración
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1.5 horas)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>
          </div>

          {/* Google Meet Settings */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" /> Enlace de Google Meet
              </span>
              <button
                type="button"
                onClick={() => setAutoMeet(!autoMeet)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer border ${
                  autoMeet
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {autoMeet ? '✓ Generar con API' : 'Personalizado'}
              </button>
            </div>

            {autoMeet ? (
              <p className="text-[11px] text-slate-400">
                Se generará automáticamente un enlace seguro de Google Meet vinculado a tu sesión docente.
              </p>
            ) : (
              <input
                type="url"
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                value={customMeetUrl}
                onChange={(e) => setCustomMeetUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Google Calendar Sync */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="syncCalendar"
              checked={syncCalendar}
              onChange={(e) => setSyncCalendar(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="syncCalendar" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Sincronizar en Google Calendar
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Configura alertas y recordatorios automáticos (10 y 30 minutos antes).
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 glow-electric cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando y Notificando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Notificar a Alumnos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
