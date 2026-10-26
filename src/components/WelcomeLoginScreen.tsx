import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Check,
  School,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface WelcomeLoginScreenProps {
  onSuccess?: () => void;
}

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({ onSuccess }) => {
  const { loginWithGoogle, loginAsDemo } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('estudiante');

  // Student specific selection: 1ro a 6to o Selecciona otro
  const [studentGrade, setStudentGrade] = useState<string>('5to');
  const [customGradeText, setCustomGradeText] = useState<string>('');
  const [isOtherGrade, setIsOtherGrade] = useState<boolean>(false);

  // Teacher specific selection: con qué cursos pasa (multi-select) y qué materia
  const [teacherGrades, setTeacherGrades] = useState<string[]>(['3ro', '4to', '5to']);
  const [teacherSubject, setTeacherSubject] = useState<string>('Matemáticas y Cálculo');

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gradeOptions = ['1ro', '2do', '3ro', '4to', '5to', '6to'];
  const commonSubjects = [
    'Matemáticas',
    'Física',
    'Química',
    'Lenguaje y Literatura',
    'Biología',
    'Historia y Geografía',
    'Computación & Robótica',
  ];

  // Toggle grade for teacher
  const toggleTeacherGrade = (g: string) => {
    setTeacherGrades((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((item) => item !== g) : prev) : [...prev, g]
    );
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMsg(null);

    const finalStudentGrade = isOtherGrade ? customGradeText.trim() || 'Otro' : studentGrade;

    try {
      await loginWithGoogle({
        role: selectedRole,
        gradeLevel: selectedRole === 'estudiante' ? finalStudentGrade : undefined,
        teacherGrades: selectedRole === 'docente' ? teacherGrades : undefined,
        assignedSubjects: selectedRole === 'docente' ? teacherSubject.trim() || 'Matemáticas' : undefined,
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Login error:', err);
      if (!err?.message?.includes('closed-by-user') && !err?.message?.includes('cancelled-popup-request')) {
        setErrorMsg('Error al autenticar con Google. Puedes usar los accesos de prueba rápida mientras tanto.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoAccess = async (role: UserRole, grade?: string, sub?: string, tGrades?: string[]) => {
    await loginAsDemo(role, grade, sub, tGrades);
    onSuccess?.();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-5 right-10 w-[350px] h-[350px] bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Brand Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-3 glow-electric">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <School className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                Academia Virtual Mi Trópico
              </h2>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Clases virtuales y en tiempo real
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Academia Virtual Mi Trópico
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-cyan-300 font-semibold">
            Clases virtuales y en tiempo real
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Elige tu rol para configurar tu perfil y acceder a tus herramientas con cuenta Google:
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-slate-900/95 border border-slate-700/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Elige tu rol: Estudiante o Docente */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Elige tu rol:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Estudiante button */}
              <button
                type="button"
                onClick={() => setSelectedRole('estudiante')}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  selectedRole === 'estudiante'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/30 glow-electric'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {selectedRole === 'estudiante' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Estudiante</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Entrar a mis clases y ver notas</p>
                </div>
              </button>

              {/* Docente button */}
              <button
                type="button"
                onClick={() => setSelectedRole('docente')}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  selectedRole === 'docente'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-900/30 glow-electric'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {selectedRole === 'docente' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Docente</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Crear Meet y pasar asistencia</p>
                </div>
              </button>
            </div>
          </div>

          {/* IF DOCENTE IS MARKED: En esa misma pantalla de qué cursos y con qué cursos pasas y qué materia */}
          {selectedRole === 'docente' && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center justify-between">
                  <span>¿Con qué cursos pasas clases? (Selecciona los cursos):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Puedes marcar varios</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {gradeOptions.map((g) => {
                    const isChecked = teacherGrades.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleTeacherGrade(g)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          isChecked
                            ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 opacity-60" />}
                        <span>{g}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Cursos activos: <strong className="text-slate-200">{teacherGrades.join(', ')}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                  ¿Qué materia dictas?:
                </label>
                {/* Quick Subject Suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonSubjects.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setTeacherSubject(sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        teacherSubject === sub
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  placeholder="Escribe el nombre de tu materia..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* IF ESTUDIANTE IS MARKED: Marque qué curso de 1ro a 6to o seleccione otro */}
          {selectedRole === 'estudiante' && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 animate-in fade-in space-y-3">
              <label className="block text-xs font-bold text-blue-300">
                Marque su curso escolar (1ro a 6to o seleccione otro):
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gradeOptions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setStudentGrade(g);
                      setIsOtherGrade(false);
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      !isOtherGrade && studentGrade === g
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    {g} Grado
                  </button>
                ))}

                {/* Seleccione otro button */}
                <button
                  type="button"
                  onClick={() => setIsOtherGrade(true)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
                    isOtherGrade
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  Otro...
                </button>
              </div>

              {/* Text input if "Otro" is picked */}
              {isOtherGrade && (
                <div className="pt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customGradeText}
                    onChange={(e) => setCustomGradeText(e.target.value)}
                    placeholder="Escribe tu grado (ej. Pre-Universitario, Primaria...)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Curso seleccionado:{' '}
                <strong className="text-white">
                  {isOtherGrade ? customGradeText || 'Otro' : `${studentGrade} Grado`}
                </strong>
              </p>
            </div>
          )}

          {/* Main Action: Register with Google Account */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{loadingGoogle ? 'Autenticando...' : 'Registrarse e Ingresar con Cuenta Google'}</span>
            </button>
          </div>

          {/* Quick Demo Access (As requested to easily test how the PWA behaves) */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                O prueba al instante con usuarios ficticios de ejemplo:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoAccess('estudiante', '5to')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-blue-300">Lucía Flores</div>
                <div className="text-[10px] text-slate-400">Estudiante (5to Grado)</div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Ver Panel Alumno →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccess('docente', undefined, 'Matemáticas y Cálculo', ['3ro', '4to', '5to', '6to'])}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-cyan-300">Prof. Carlos Mendoza</div>
                <div className="text-[10px] text-slate-400">Docente (Matemáticas)</div>
                <span className="text-[10px] text-cyan-400 font-semibold mt-1 block">Ver Panel Docente →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccess('admin')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-purple-300">Dirección General</div>
                <div className="text-[10px] text-slate-400">Administrador</div>
                <span className="text-[10px] text-purple-400 font-semibold mt-1 block">Gestión Total →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security and Free-tier note */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticación segura con Google • Plan Gratuito Firebase Spark</span>
        </div>
      </div>
    </div>
  );
};
