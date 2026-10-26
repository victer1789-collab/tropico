import React, { useState } from 'react';
import {
  Video,
  Bell,
  Calendar,
  Users,
  BarChart3,
  LogOut,
  Shield,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  KeyRound,
  Download,
  School,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: 'calendar' | 'reports' | 'admin';
  setCurrentTab: (tab: 'calendar' | 'reports' | 'admin') => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenScheduleModal: () => void;
  onOpenJoinCodeModal: () => void;
  installPromptEvent?: any;
  onInstallPwa?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  unreadCount,
  onOpenNotifications,
  soundEnabled,
  onToggleSound,
  onOpenScheduleModal,
  onOpenJoinCodeModal,
  installPromptEvent,
  onInstallPwa,
}) => {
  const { user, userProfile, activeRole, setActiveRole, loginWithGoogle, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    admin: { label: 'Administrador', bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-300', icon: Shield },
    docente: { label: 'Docente', bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-300', icon: GraduationCap },
    estudiante: { label: 'Estudiante', bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-300', icon: Video },
  };

  const currentRoleConfig = roleLabels[activeRole];
  const CurrentRoleIcon = currentRoleConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Main Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('calendar')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-900/40 glow-electric flex items-center justify-center">
                <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
                  <School className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  Academia Virtual Mi Trópico
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Clases Virtuales
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentTab('calendar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'calendar'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {activeRole === 'estudiante'
                    ? `Mi Aula (${userProfile?.gradeLevel || '5to'} Grado)`
                    : activeRole === 'docente'
                    ? 'Panel Docente & Meet'
                    : 'Clases & Calendario'}
                </span>
              </button>

              <button
                onClick={() => setCurrentTab('reports')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'reports'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>
                  {activeRole === 'estudiante' ? 'Mis Notas & Asistencia' : 'Reportes Académicos'}
                </span>
              </button>

              {/* Only admin can see Admin Panel tab */}
              {(userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'victer1789@gmail.com') && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Panel Administrador</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right: Actions, Role Display & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button if available */}
            {installPromptEvent && (
              <button
                onClick={onInstallPwa}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instalar PWA</span>
              </button>
            )}

            {/* Audio notifications toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Alertas sonoras activadas' : 'Alertas sonoras en silencio'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
              aria-label="Abrir notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Strict Role Display: Only show own role badge. Only Master/Admin gets view switch */}
            {userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'victer1789@gmail.com' ? (
              <div className="relative">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold select-none ${currentRoleConfig.bg} ${currentRoleConfig.text}`}
                >
                  <CurrentRoleIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vista Admin:</span>
                  <select
                    aria-label="Cambiar vista de rol"
                    value={activeRole}
                    onChange={(e) => setActiveRole(e.target.value as UserRole)}
                    className="bg-transparent text-inherit text-xs font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="admin" className="bg-slate-900 text-white">
                      Admin
                    </option>
                    <option value="docente" className="bg-slate-900 text-white">
                      Docente
                    </option>
                    <option value="estudiante" className="bg-slate-900 text-white">
                      Estudiante
                    </option>
                  </select>
                </div>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold select-none ${currentRoleConfig.bg} ${currentRoleConfig.text}`}
              >
                <CurrentRoleIcon className="w-3.5 h-3.5" />
                <span>
                  {activeRole === 'estudiante'
                    ? `Estudiante (${userProfile?.gradeLevel || '5to'} Grado)`
                    : `Docente (${userProfile?.assignedSubjects || 'Matemáticas'})`}
                </span>
              </div>
            )}

            {/* Google Authentication Section */}
            {user || userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userProfile?.displayName || 'Avatar'}
                      className="w-8 h-8 rounded-full border border-blue-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400">
                      {(userProfile?.displayName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-sm font-semibold text-white truncate">
                        {userProfile?.displayName || user?.displayName || 'Usuario Mi Trópico'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{userProfile?.email || user?.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-medium border border-blue-500/20">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>Google Workspace Activo</span>
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      <div className="px-3 py-1.5 text-xs text-slate-400">
                        <span>Rol: </span>
                        <strong className="text-slate-200 capitalize">{activeRole}</strong>
                        {userProfile?.gradeLevel && (
                          <span className="ml-1 text-cyan-300 font-bold">
                            ({userProfile.gradeLevel} Grado)
                          </span>
                        )}
                      </div>
                      {userProfile?.assignedSubjects && (
                        <div className="px-3 py-1.5 text-xs text-slate-400">
                          <span>Especialidad: </span>
                          <span className="text-slate-300">{userProfile.assignedSubjects}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <span>Acceder</span>
              </button>
            )}

            {/* Direct "Salir sesión" button to return to Welcome & Login screen */}
            {(user || userProfile) && (
              <button
                onClick={logout}
                title="Salir sesión y volver a la pantalla principal"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 py-2 px-2">
        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
            currentTab === 'calendar' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>
            {activeRole === 'estudiante'
              ? 'Mi Aula'
              : activeRole === 'docente'
              ? 'Mis Clases'
              : 'Calendario'}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('reports')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
            currentTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Reportes</span>
        </button>

        {(userProfile?.role === 'admin' || userProfile?.email?.toLowerCase() === 'victer1789@gmail.com') && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              currentTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Usuarios</span>
          </button>
        )}

        {activeRole !== 'estudiante' && (
          <button
            onClick={onOpenScheduleModal}
            className="flex flex-col items-center gap-1 text-[11px] font-medium p-1 text-cyan-400"
          >
            <Plus className="w-5 h-5" />
            <span>Crear</span>
          </button>
        )}

        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[11px] font-medium p-1 text-red-400 hover:text-red-300 cursor-pointer"
          title="Salir sesión"
        >
          <LogOut className="w-5 h-5" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};
