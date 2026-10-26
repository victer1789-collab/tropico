/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { WelcomeLoginScreen } from './components/WelcomeLoginScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { CalendarView } from './components/CalendarView';
import { ReportsDashboard } from './components/ReportsDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ScheduleClassModal } from './components/ScheduleClassModal';
import { LiveAttendanceModal } from './components/LiveAttendanceModal';
import { NotificationsModal } from './components/NotificationsModal';
import { JoinCodeModal } from './components/JoinCodeModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { VirtualClass, AttendanceRecord, UserProfile, InAppNotification, Announcement } from './types';
import { subscribeToClasses, updateClassStatus, deleteClass } from './services/classService';
import { subscribeToAllAttendance, registerClassEntry } from './services/attendanceService';
import { deleteGoogleCalendarEvent } from './services/calendarService';
import {
  checkAndSeedInitialData,
  SAMPLE_CLASSES,
  SAMPLE_ATTENDANCE,
  SAMPLE_ANNOUNCEMENTS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
} from './services/seedService';
import { subscribeToAnnouncements } from './services/announcementService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Sparkles, CheckCircle2, Bell, LogOut } from 'lucide-react';

function MainApp() {
  const { user, userProfile, activeRole, accessToken, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<'calendar' | 'reports' | 'admin'>('calendar');
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<VirtualClass | null>(null);

  // Destructive delete confirmation modal
  const [classToDelete, setClassToDelete] = useState<VirtualClass | null>(null);

  // Notifications & Sound
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notifiedClassIdsRef = useRef<Set<string>>(new Set());

  // Toast banner for immediate feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Play gentle sound alert
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio policy safe
    }
  };

  // Seed sample data and listen to PWA prompt
  useEffect(() => {
    if (user && !userProfile?.uid.startsWith('demo_')) {
      checkAndSeedInitialData(user.email || undefined, user.uid);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [user, userProfile]);

  // Real-time Firestore subscriptions or Demo data loader
  useEffect(() => {
    // 1. If unauthenticated, clear datasets and do not attach Firestore listeners
    if (!user && !userProfile) {
      setClasses([]);
      setAttendance([]);
      setUsers([]);
      setAnnouncements([]);
      return;
    }

    // 2. If user is in Demo Mode (fictive user testing)
    if (userProfile?.uid.startsWith('demo_')) {
      setClasses(SAMPLE_CLASSES);
      setAttendance(SAMPLE_ATTENDANCE);
      setUsers([...INITIAL_STUDENTS, ...INITIAL_TEACHERS]);
      setAnnouncements(SAMPLE_ANNOUNCEMENTS);
      return;
    }

    // 3. Authenticated user with Firebase Auth
    if (user) {
      const unsubClasses = subscribeToClasses((data) => {
        setClasses(data);
      });

      const unsubAttendance = subscribeToAllAttendance((data) => {
        setAttendance(data);
      });

      let unsubUsers: (() => void) | undefined;
      try {
        unsubUsers = onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const list: UserProfile[] = [];
            snap.forEach((d) => list.push(d.data() as UserProfile));
            setUsers(list);
          },
          (err) => {
            console.warn('Users listener notice:', err);
          }
        );
      } catch (e) {
        console.warn('Users listener attach error:', e);
      }

      const unsubAnnouncements = subscribeToAnnouncements((data) => {
        setAnnouncements(data);
      });

      return () => {
        if (unsubClasses) unsubClasses();
        if (unsubAttendance) unsubAttendance();
        if (unsubUsers) unsubUsers();
        if (unsubAnnouncements) unsubAnnouncements();
      };
    }
  }, [user, userProfile?.uid]);

  // Automated notification checker for upcoming classes
  useEffect(() => {
    const checkUpcomingClasses = () => {
      const now = new Date().getTime();

      classes.forEach((c) => {
        const classTime = new Date(c.scheduledAt).getTime();
        const diffMinutes = Math.round((classTime - now) / (1000 * 60));

        // If class is in <= 15 min and >= 0, or live now
        if (diffMinutes <= 15 && diffMinutes >= -5 && !notifiedClassIdsRef.current.has(c.id)) {
          notifiedClassIdsRef.current.add(c.id);

          const newNotif: InAppNotification = {
            id: `notif_${c.id}_${Date.now()}`,
            title: c.status === 'live' ? `¡Clase de ${c.subject} EN VIVO!` : `Próxima Clase: ${c.title}`,
            message:
              c.status === 'live'
                ? `El profesor ${c.teacherName} está transmitiendo en Google Meet (${c.gradeLevel || '5to'} Grado). Entra para marcar asistencia.`
                : `Comienza en ${Math.max(1, diffMinutes)} minutos. Conéctate a Google Meet.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'class_starting',
            classId: c.id,
            meetUrl: c.meetUrl,
            targetGrade: c.gradeLevel,
          };

          setNotifications((prev) => [newNotif, ...prev]);
          playAlertSound();
          setToastMessage(newNotif.title);
          setTimeout(() => setToastMessage(null), 6000);
        }
      });
    };

    checkUpcomingClasses();
    const interval = setInterval(checkUpcomingClasses, 20000);
    return () => clearInterval(interval);
  }, [classes, soundEnabled]);

  // Handle Join Class & Record Real-time Attendance
  const handleJoinClass = async (classObj: VirtualClass) => {
    // 1. Register attendance if user is logged in
    if (userProfile) {
      try {
        const record = await registerClassEntry(classObj, userProfile);
        const statusLabel = record.status === 'late' ? 'Tardanza' : 'Presente';

        const notif: InAppNotification = {
          id: `att_notif_${Date.now()}`,
          title: 'Asistencia Registrada',
          message: `Tu asistencia en "${classObj.title}" fue guardada como: ${statusLabel}.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'attendance',
          classId: classObj.id,
        };
        setNotifications((prev) => [notif, ...prev]);

        setToastMessage(`✓ Asistencia registrada: ${statusLabel}`);
        setTimeout(() => setToastMessage(null), 4000);
      } catch (err) {
        console.warn('Error recording attendance:', err);
      }
    }

    // 2. Open Google Meet link in new tab
    if (classObj.meetUrl) {
      window.open(classObj.meetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Broadcast when teacher launches an instant or scheduled class
  const handleBroadcastClassCreated = (newClass: VirtualClass) => {
    const broadcastNotif: InAppNotification = {
      id: `bc_${newClass.id}_${Date.now()}`,
      title: `¡Nueva Clase de ${newClass.subject}!`,
      message: `${newClass.teacherName} ha compartido el enlace de Google Meet para ${newClass.gradeLevel || '5to'} Grado.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'class_created',
      classId: newClass.id,
      meetUrl: newClass.meetUrl,
      targetGrade: newClass.gradeLevel,
    };

    if (userProfile?.uid.startsWith('demo_')) {
      setClasses((prev) => [newClass, ...prev]);
    }

    setNotifications((prev) => [broadcastNotif, ...prev]);
    playAlertSound();
    setToastMessage(`Enlace de Meet enviado a ${newClass.gradeLevel || '5to'} Grado`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Broadcast announcement from administration
  const handleBroadcastAnnouncement = (newAnn: Announcement) => {
    if (userProfile?.uid.startsWith('demo_')) {
      setAnnouncements((prev) => [newAnn, ...prev]);
    }

    const broadcastNotif: InAppNotification = {
      id: `ann_notif_${newAnn.id}_${Date.now()}`,
      title: `Comunicado Oficial: ${newAnn.title}`,
      message: newAnn.content,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'announcement',
    };

    setNotifications((prev) => [broadcastNotif, ...prev]);
    playAlertSound();
    setToastMessage(`Comunicado enviado a ${newAnn.targetAudience}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Join direct via link / code modal
  const handleJoinDirectMeet = async (meetUrl: string, matchedClass?: VirtualClass) => {
    if (matchedClass) {
      await handleJoinClass(matchedClass);
    } else {
      window.open(meetUrl, '_blank', 'noopener,noreferrer');
      setToastMessage('Redirigiendo a Google Meet...');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle class deletion with Workspace-compliant confirmation
  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    try {
      if (classToDelete.calendarEventId && accessToken) {
        await deleteGoogleCalendarEvent(accessToken, classToDelete.calendarEventId);
      }
      await deleteClass(classToDelete.id);
      if (userProfile?.uid.startsWith('demo_')) {
        setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id));
      }
      setToastMessage('Clase eliminada del calendario.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error deleting class:', err);
    } finally {
      setClassToDelete(null);
    }
  };

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  // IF NOT LOGGED IN: Render the Welcome & Onboarding Login Screen
  if (!user && !userProfile) {
    return <WelcomeLoginScreen onSuccess={() => {}} />;
  }

  const isUserAdmin = userProfile?.role === 'admin' || user?.email?.toLowerCase() === 'victer1789@gmail.com';

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-2xl glow-electric border border-blue-400/30 flex items-center gap-2.5 animate-in slide-in-from-top-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        installPromptEvent={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Admin Mode indicator banner (Only visible for Admins/Directors) */}
      {isUserAdmin && (
        <div className="bg-purple-950/40 border-b border-purple-500/30 py-1.5 px-4 no-print text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-purple-200 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>
                Sesión de Dirección / Administrador: <strong className="text-white">{user?.email || userProfile?.email || 'victer1789@gmail.com'}</strong>
              </span>
            </div>
            <button
              onClick={logout}
              className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer underline"
            >
              <LogOut className="w-3 h-3" />
              <span>Cerrar sesión institucional</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Role-Specific or Tab-Specific */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'calendar' && (
          <>
            {activeRole === 'estudiante' && userProfile ? (
              <StudentDashboard
                userProfile={userProfile}
                classes={classes}
                attendance={attendance}
                reports={[]}
                announcements={announcements}
                onJoinClass={handleJoinClass}
                onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
              />
            ) : activeRole === 'docente' && userProfile ? (
              <TeacherDashboard
                userProfile={userProfile}
                accessToken={accessToken}
                classes={classes}
                attendance={attendance}
                students={users.filter((u) => u.role === 'estudiante')}
                announcements={announcements}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                onOpenLiveAttendance={(cls) => setSelectedClassForAttendance(cls)}
                onDeleteClass={(cls) => setClassToDelete(cls)}
                onJoinMeet={handleJoinClass}
                onBroadcastClassCreated={handleBroadcastClassCreated}
              />
            ) : (
              <CalendarView
                classes={classes}
                activeRole={activeRole}
                currentUserId={user?.uid || userProfile?.uid}
                onJoinClass={handleJoinClass}
                onOpenLiveAttendance={(cls) => setSelectedClassForAttendance(cls)}
                onUpdateStatus={(classId, status) => updateClassStatus(classId, status)}
                onDeleteClass={(cls) => setClassToDelete(cls)}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              />
            )}
          </>
        )}

        {currentTab === 'reports' && (
          <ReportsDashboard
            students={users.filter((u) => u.role === 'estudiante')}
            classes={classes}
            attendance={attendance}
            activeRole={activeRole}
            currentUserId={user?.uid || userProfile?.uid || 'doc_current'}
            currentUserName={userProfile?.displayName || user?.displayName || 'Docente'}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            users={users}
            currentUserId={user?.uid || userProfile?.uid || ''}
            currentUserEmail={user?.email || userProfile?.email || 'victer1789@gmail.com'}
            announcements={announcements}
            onRefreshUsers={() => {}}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Academia Virtual Mi Trópico • Clases virtuales y en tiempo real</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Cursos de 1ero a 6to Grado</span>
            <span>•</span>
            <span>Asistencia en Vivo</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScheduleClassModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onClassCreated={(createdClass) => {
          handleBroadcastClassCreated(createdClass);
          setToastMessage('¡Clase programada exitosamente en Meet & Calendar!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      <LiveAttendanceModal
        isOpen={Boolean(selectedClassForAttendance)}
        onClose={() => setSelectedClassForAttendance(null)}
        classObj={selectedClassForAttendance}
        activeRole={activeRole}
        onJoinMeet={handleJoinClass}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onMarkAsRead={(id) => {
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
        onClearAll={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onJoinClass={(classId, meetUrl) => {
          const cls = classes.find((c) => c.id === classId);
          if (cls) handleJoinClass(cls);
          else window.open(meetUrl, '_blank');
          setIsNotificationsModalOpen(false);
        }}
      />

      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        classes={classes}
        onJoinDirectMeet={handleJoinDirectMeet}
      />

      {/* Workspace-mandated explicit confirmation dialog for class & calendar deletion */}
      <ConfirmationModal
        isOpen={Boolean(classToDelete)}
        title="¿Eliminar Clase Virtual y Evento de Google Calendar?"
        message={`¿Estás seguro de que deseas eliminar permanentemente la sesión "${classToDelete?.title}"? Esta acción borrará la clase de Google Calendar y no se podrá deshacer.`}
        confirmLabel="Eliminar Clase"
        cancelLabel="Conservar Clase"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setClassToDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
