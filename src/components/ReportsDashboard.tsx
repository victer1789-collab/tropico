import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  Save,
  Search,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { MonthlyAcademicReport, UserProfile, VirtualClass, AttendanceRecord, UserRole } from '../types';
import {
  subscribeToReports,
  generateMonthlyReports,
  upsertReportGrade,
  exportReportsCSV,
} from '../services/reportService';
import { db } from '../firebase';

interface ReportsDashboardProps {
  students: UserProfile[];
  classes: VirtualClass[];
  attendance: AttendanceRecord[];
  activeRole: UserRole;
  currentUserId: string;
  currentUserName: string;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  students,
  classes,
  attendance,
  activeRole,
  currentUserId,
  currentUserName,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [reports, setReports] = useState<MonthlyAcademicReport[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<number>(18);
  const [tempFeedback, setTempFeedback] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToReports(selectedMonth, (data) => {
      setReports(data);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedMonth]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyReports(
        selectedMonth,
        students,
        classes,
        attendance,
        currentUserId,
        currentUserName
      );
    } catch (err) {
      console.error('Error generating reports:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGrade = async (reportId: string) => {
    await upsertReportGrade(reportId, tempGrade, tempFeedback);
    setEditingGradeId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportReportsCSV(reports, selectedMonth);
  };

  // Aggregated KPIs
  const totalReports = reports.length;
  const avgAttendance =
    totalReports > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.attendanceRate, 0) / totalReports)
      : 0;
  const avgGrade =
    totalReports > 0
      ? (reports.reduce((acc, r) => acc + r.grade, 0) / totalReports).toFixed(1)
      : '0.0';
  const atRiskCount = reports.filter((r) => r.attendanceRate < 75).length;

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedSubject !== 'all' && r.subject !== selectedSubject) return false;
    if (selectedGrade !== 'all' && r.gradeLevel && r.gradeLevel !== selectedGrade) return false;
    if (search && !r.studentName.toLowerCase().includes(search.toLowerCase()) && !r.studentEmail.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const subjects = Array.from(new Set(reports.map((r) => r.subject))).filter(Boolean);
  const isTeacherOrAdmin = activeRole === 'admin' || activeRole === 'docente';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Reportes Mensuales de Desempeño Académico
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              Evaluación Integral
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Métricas de asistencia a clases virtuales de Meet, puntualidad y rendimiento académico consolidado.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-inherit font-semibold focus:outline-none cursor-pointer"
            >
              <option value="2026-10" className="bg-slate-900">Octubre 2026</option>
              <option value="2026-11" className="bg-slate-900">Noviembre 2026</option>
              <option value="2026-12" className="bg-slate-900">Diciembre 2026</option>
              <option value="2026-09" className="bg-slate-900">Septiembre 2026</option>
            </select>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/30 glow-electric transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Calculando...' : 'Recalcular Mes'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Asistencia Promedio</span>
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{avgAttendance}%</span>
            <span className="text-xs text-emerald-400 font-medium">+4.2% vs mes anterior</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${avgAttendance}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Calificación Media</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{avgGrade}</span>
            <span className="text-xs text-slate-400">Escala de 0 a 20</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Rendimiento académico satisfactorio</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Alumnos en Alerta</span>
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-400">{atRiskCount}</span>
            <span className="text-xs text-slate-400">menos del 75% asistencia</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Requieren acompañamiento tutorial</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Evaluados</span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-400">{totalReports}</span>
            <span className="text-xs text-slate-400">alumnos registrados</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Mes: {selectedMonth}</p>
        </div>
      </div>

      {/* Visual Progress Comparison Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span>Distribución Gráfica de Asistencia por Estudiante</span>
        </h3>

        <div className="space-y-3">
          {reports.slice(0, 5).map((rep) => (
            <div key={rep.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{rep.studentName}</span>
                <span className="text-slate-400 font-mono">{rep.attendanceRate}% ({rep.classesAttended}/{rep.classesTotal} clases)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    rep.attendanceRate >= 85
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                      : rep.attendanceRate >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${rep.attendanceRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table: Search & Filter */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar estudiante o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
            <span className="text-slate-400">Grado:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="1ero">1ero</option>
              <option value="2do">2do</option>
              <option value="3ero">3ero</option>
              <option value="4to">4to</option>
              <option value="5to">5to</option>
              <option value="6to">6to</option>
            </select>

            <span className="text-slate-400 ml-2">Materia:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Asignatura</th>
                <th className="py-3 px-4 text-center">Clases Total</th>
                <th className="py-3 px-4 text-center">Asistidas</th>
                <th className="py-3 px-4 text-center">Tardanzas</th>
                <th className="py-3 px-4 text-center">Faltas</th>
                <th className="py-3 px-4 text-center">% Asistencia</th>
                <th className="py-3 px-4 text-center">Calificación (0-20)</th>
                <th className="py-3 px-4">Observación Pedagógica</th>
                {isTeacherOrAdmin && <th className="py-3 px-4 text-center no-print">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No se encontraron reportes para los criterios seleccionados. Haz clic en "Recalcular Mes" para generar.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => {
                  const isEditing = editingGradeId === rep.id;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{rep.studentName}</span>
                          {rep.gradeLevel && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                              {rep.gradeLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">{rep.studentEmail}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 text-[11px]">
                          {rep.subject}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-300">{rep.classesTotal}</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-semibold">{rep.classesAttended}</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400">{rep.classesLate}</td>
                      <td className="py-3 px-4 text-center font-mono text-red-400">{rep.classesAbsent}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            rep.attendanceRate >= 85
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : rep.attendanceRate >= 70
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {rep.attendanceRate}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={tempGrade}
                            onChange={(e) => setTempGrade(Number(e.target.value))}
                            className="w-14 px-1.5 py-0.5 text-center rounded bg-slate-950 border border-blue-500 text-white font-bold"
                          />
                        ) : (
                          <span className={`text-sm ${rep.grade >= 14 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {rep.grade}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempFeedback}
                            onChange={(e) => setTempFeedback(e.target.value)}
                            placeholder="Comentario pedagógico..."
                            className="w-full px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-white text-xs"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-300 line-clamp-2">{rep.feedback || 'Sin observaciones.'}</span>
                        )}
                      </td>

                      {isTeacherOrAdmin && (
                        <td className="py-3 px-4 text-center no-print">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveGrade(rep.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              title="Guardar calificación"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingGradeId(rep.id);
                                setTempGrade(rep.grade);
                                setTempFeedback(rep.feedback || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                            >
                              Calificar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
