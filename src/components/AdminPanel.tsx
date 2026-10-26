import React, { useState } from 'react';
import {
  Users,
  Shield,
  GraduationCap,
  Video,
  Search,
  UserPlus,
  Key,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Megaphone,
  Send,
  AlertTriangle,
  Mail,
  UserCheck,
  Calendar,
  BookOpen,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, UserRole, UserPermissions, Announcement } from '../types';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreErrors';
import { createAnnouncement, deleteAnnouncement } from '../services/announcementService';

interface AdminPanelProps {
  users: UserProfile[];
  currentUserId: string;
  currentUserEmail?: string;
  announcements?: Announcement[];
  onRefreshUsers: () => void;
  onBroadcastAnnouncement?: (announcement: Announcement) => void;
}

const MASTER_ADMIN_EMAIL = 'victer1789@gmail.com';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  currentUserId,
  currentUserEmail,
  announcements = [],
  onRefreshUsers,
  onBroadcastAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'announcements'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Add new admin state (restricted to master admin)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAddAdmin, setLoadingAddAdmin] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  // New announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgente' | 'informativo'>('informativo');
  const [annAudience, setAnnAudience] = useState<'todos' | 'estudiantes' | 'docentes' | string>('todos');
  const [loadingAnn, setLoadingAnn] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('docente');
  const [newGrade, setNewGrade] = useState('5to');
  const [newSubject, setNewSubject] = useState('Matemáticas');
  const [loadingAdd, setLoadingAdd] = useState(false);

  const isMasterAdmin =
    currentUserEmail?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() ||
    users.find((u) => u.uid === currentUserId)?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  // Role change handler
  const handleRoleChange = async (targetUid: string, newRoleValue: UserRole) => {
    try {
      const docRef = doc(db, 'users', targetUid);
      await updateDoc(docRef, {
        role: newRoleValue,
        updatedAt: new Date().toISOString(),
      });
      onRefreshUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  // Status toggle handler
  const handleStatusToggle = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onRefreshUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (user: UserProfile) => {
    if (user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      alert('No es posible eliminar la cuenta del Director / Administrador Principal.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      // If admin, remove from admins collection
      if (user.role === 'admin') {
        try {
          await deleteDoc(doc(db, 'admins', user.uid));
        } catch (e) {
          // safe ignore
        }
      }
      setUserToDelete(null);
      if (selectedUserDetail?.uid === user.uid) setSelectedUserDetail(null);
      onRefreshUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  // Add new administrator by email
  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoadingAddAdmin(true);
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);

    try {
      // Find if user already exists
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existingUser) {
        // Upgrade to admin
        await updateDoc(doc(db, 'users', existingUser.uid), {
          role: 'admin',
          updatedAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'admins', existingUser.uid), {
          email: cleanEmail,
          grantedBy: currentUserEmail || MASTER_ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Pre-register admin record
        const tempId = `admin_${Date.now()}_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        await setDoc(doc(db, 'admins', tempId), {
          email: cleanEmail,
          grantedBy: currentUserEmail || MASTER_ADMIN_EMAIL,
          createdAt: new Date().toISOString(),
        });

        // Create pre-profile in users
        await setDoc(doc(db, 'users', tempId), {
          uid: tempId,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          role: 'admin',
          status: 'active',
          permissions: {
            canCreateClasses: true,
            canManageAttendance: true,
            canEditGrades: true,
            canExportReports: true,
            canManageUsers: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setAdminSuccessMsg(`✓ El correo ${cleanEmail} ha sido designado con privilegios de Administrador.`);
      setNewAdminEmail('');
      onRefreshUsers();
    } catch (err) {
      setAdminErrorMsg('Error al designar administrador en Firestore.');
      console.error(err);
    } finally {
      setLoadingAddAdmin(false);
    }
  };

  // Submit Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setLoadingAnn(true);
    setAnnSuccessMsg(null);

    try {
      const author = currentUserEmail || MASTER_ADMIN_EMAIL;
      const authorName = users.find((u) => u.email === author)?.displayName || 'Dirección General Mi Trópico';

      const annId = await createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        targetAudience: annAudience,
        authorName,
        authorEmail: author,
      });

      const newAnn: Announcement = {
        id: annId,
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        targetAudience: annAudience,
        authorName,
        authorEmail: author,
        createdAt: new Date().toISOString(),
      };

      onBroadcastAnnouncement?.(newAnn);

      setAnnTitle('');
      setAnnContent('');
      setAnnSuccessMsg('¡Comunicado publicado y notificado a la comunidad educativa!');
      setTimeout(() => setAnnSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error creating announcement:', err);
    } finally {
      setLoadingAnn(false);
    }
  };

  // Create User form
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    setLoadingAdd(true);
    try {
      const tempUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUser: UserProfile = {
        uid: tempUid,
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim(),
        role: newRole,
        status: 'active',
        gradeLevel: newRole === 'estudiante' ? newGrade : undefined,
        assignedSubjects: newRole === 'docente' ? newSubject : undefined,
        permissions: {
          canCreateClasses: newRole !== 'estudiante',
          canManageAttendance: true,
          canEditGrades: newRole !== 'estudiante',
          canExportReports: true,
          canManageUsers: newRole === 'admin',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', tempUid), newUser);
      setShowAddUserModal(false);
      setNewEmail('');
      setNewName('');
      onRefreshUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    } finally {
      setLoadingAdd(false);
    }
  };

  // KPIs
  const totalUsers = users.length;
  const totalDocentes = users.filter((u) => u.role === 'docente').length;
  const totalEstudiantes = users.filter((u) => u.role === 'estudiante').length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (gradeFilter !== 'all' && u.gradeLevel !== gradeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchName = u.displayName.toLowerCase().includes(s);
      const matchEmail = u.email.toLowerCase().includes(s);
      const matchSub = u.assignedSubjects?.toLowerCase().includes(s);
      if (!matchName && !matchEmail && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Master Admin Badge */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/60 border border-slate-800 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Panel de Control Institucional</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                Director / Master Admin: <strong className="text-white">{MASTER_ADMIN_EMAIL}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestión Integral de Usuarios &amp; Comunicados
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Supervisión de perfiles de docentes y estudiantes, designación segura de administradores por correo, eliminación de cuentas y envío de comunicados oficiales.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 glow-electric transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Usuario</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs within Admin Panel */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio de Usuarios ({totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administradores Autorizados ({totalAdmins})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Mandar Comunicados ({announcements.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Usuarios</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{totalUsers}</span>
          <p className="text-[11px] text-slate-400 mt-1">Cuentas vinculadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Docentes Activos</span>
            <GraduationCap className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-cyan-400">{totalDocentes}</span>
          <p className="text-[11px] text-slate-400 mt-1">Generadores de Google Meet</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Estudiantes (1ro-6to)</span>
            <Video className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">{totalEstudiantes}</span>
          <p className="text-[11px] text-slate-400 mt-1">Asistencia en tiempo real</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Administradores</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-extrabold text-purple-400">{totalAdmins}</span>
          <p className="text-[11px] text-slate-400 mt-1">Gestión por correo</p>
        </div>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o materia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto text-xs">
              <span className="text-slate-400">Rol:</span>
              {(['all', 'admin', 'docente', 'estudiante'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    roleFilter === r
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {r === 'all'
                    ? 'Todos'
                    : r === 'admin'
                    ? 'Admins'
                    : r === 'docente'
                    ? 'Docentes'
                    : 'Estudiantes'}
                </button>
              ))}

              <span className="text-slate-400 ml-2">Grado:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los grados</option>
                <option value="1ro">1ro Grado</option>
                <option value="2do">2do Grado</option>
                <option value="3ro">3ro Grado</option>
                <option value="4to">4to Grado</option>
                <option value="5to">5to Grado</option>
                <option value="6to">6to Grado</option>
              </select>
            </div>
          </div>

          {/* User Rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Grado / Asignatura</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.uid === currentUserId;
                    const isMaster = u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

                    return (
                      <tr key={u.uid} className="hover:bg-slate-850/50 transition-colors">
                        {/* User Profile */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-blue-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-md">
                              {u.displayName[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.displayName}</span>
                                {isMaster && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                                    Director General
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role selector */}
                        <td className="py-3 px-4">
                          <select
                            disabled={isMaster}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer border ${
                              u.role === 'admin'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : u.role === 'docente'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            <option value="admin" className="bg-slate-900 text-white">Administrador</option>
                            <option value="docente" className="bg-slate-900 text-white">Docente</option>
                            <option value="estudiante" className="bg-slate-900 text-white">Estudiante</option>
                          </select>
                        </td>

                        {/* Grade / Subject */}
                        <td className="py-3 px-4 text-slate-300">
                          {u.role === 'estudiante' ? (
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold text-xs border border-cyan-500/20">
                              {u.gradeLevel || '5to'} Grado
                            </span>
                          ) : u.role === 'docente' ? (
                            <div className="space-y-0.5">
                              <span className="text-xs text-white font-medium block">
                                {u.assignedSubjects || 'Matemáticas'}
                              </span>
                              {u.teacherGrades && (
                                <span className="text-[10px] text-slate-400">
                                  Cursos: {u.teacherGrades.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-purple-300 font-medium">Gestión Total</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            disabled={isMaster}
                            onClick={() => handleStatusToggle(u)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Inactivo</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions: View Detail & Delete */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ver detalle de usuario */}
                            <button
                              onClick={() => setSelectedUserDetail(u)}
                              title="Ver detalle del usuario"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>

                            {/* Ver permisos */}
                            <button
                              onClick={() => setSelectedUserForPerms(u)}
                              title="Configurar permisos"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            >
                              <Key className="w-4 h-4 text-amber-400" />
                            </button>

                            {/* Eliminar usuario (no borrar a uno mismo ni al Master Admin) */}
                            {!isMaster && !isSelf && (
                              <button
                                onClick={() => setUserToDelete(u)}
                                title="Eliminar usuario"
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADMINISTRATORS MANAGEMENT (Restricted to victer1789@gmail.com and active admins) */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Card to add new admin by email */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">
                  Designar Nuevo Administrador con Cuenta de Correo
                </h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Solo tú ({MASTER_ADMIN_EMAIL}) puedes agregar administradores
              </span>
            </div>

            {adminSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{adminSuccessMsg}</span>
              </div>
            )}

            {adminErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                {adminErrorMsg}
              </div>
            )}

            <form onSubmit={handleAddAdminByEmail} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Escribe el correo electrónico de Google del nuevo administrador:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo.coordinador@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingAddAdmin}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/40 glow-electric cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{loadingAddAdmin ? 'Asignando...' : 'Designar como Administrador'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Al ingresar con su cuenta Google, el usuario accederá de inmediato con el rol de Administrador y tendrá acceso total al panel.
              </p>
            </form>
          </div>

          {/* List of current administrators */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Cuentas con Privilegios de Administrador</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users
                .filter((u) => u.role === 'admin' || u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase())
                .map((adm) => {
                  const isMaster = adm.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

                  return (
                    <div
                      key={adm.uid}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-sm flex items-center justify-center border border-purple-500/30">
                          {adm.displayName[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{adm.displayName}</span>
                            {isMaster && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                                Director General
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{adm.email}</span>
                          <span className="text-[10px] text-emerald-400 font-medium">Permisos de gestión completos</span>
                        </div>
                      </div>

                      {!isMaster && (
                        <button
                          onClick={() => handleRoleChange(adm.uid, 'docente')}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-300 text-[11px] border border-slate-800 transition-colors"
                          title="Remover permisos de administrador"
                        >
                          Revocar Admin
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST ANNOUNCEMENTS (Mandar comunicados) */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Create announcement card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cyan-400" />
                <span>Emitir Comunicado Oficial a la Academia</span>
              </h2>
              <span className="text-xs text-slate-400">
                Se enviará notificación automática a los participantes
              </span>
            </div>

            {annSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{annSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título del Comunicado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Suspensión de actividades por feriado o Inicio de evaluaciones trimestrales..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Audiencia Destinataria
                  </label>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Toda la Academia (Estudiantes y Docentes)</option>
                    <option value="estudiantes">Solo Estudiantes</option>
                    <option value="docentes">Solo Docentes</option>
                    <option value="1ro">Solo 1ro Grado</option>
                    <option value="2do">Solo 2do Grado</option>
                    <option value="3ro">Solo 3ro Grado</option>
                    <option value="4to">Solo 4to Grado</option>
                    <option value="5to">Solo 5to Grado</option>
                    <option value="6to">Solo 6to Grado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nivel de Prioridad
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="informativo">Informativo (Azul / General)</option>
                    <option value="normal">Normal (Verde / Académico)</option>
                    <option value="urgente">Urgente (Rojo / Importancia Alta)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensaje o Contenido del Comunicado *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el texto detallado del comunicado institucional..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loadingAnn}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 glow-electric transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{loadingAnn ? 'Transmitiendo...' : 'Publicar y Enviar Comunicado'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of published announcements */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-400" />
              <span>Historial de Comunicados Emitidos</span>
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aún no has emitido ningún comunicado. Completa el formulario de arriba para enviar el primero.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            ann.priority === 'urgente'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : ann.priority === 'normal'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {ann.priority}
                        </span>
                        <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Audiencia: <strong className="text-slate-200 capitalize">{ann.targetAudience}</strong></span>
                        <span>•</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title="Eliminar comunicado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>

                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      Emitido por: {ann.authorName} ({ann.authorEmail})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW FULL USER DETAIL (VER CADA USUARIO) */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-base shadow-lg">
                {selectedUserDetail.displayName[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedUserDetail.displayName}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedUserDetail.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : selectedUserDetail.role === 'docente'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {selectedUserDetail.role}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{selectedUserDetail.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Identificador (UID):</span>
                <span className="font-mono text-slate-300 truncate max-w-xs">{selectedUserDetail.uid}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Estado de Cuenta:</span>
                <span className={selectedUserDetail.status === 'active' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {selectedUserDetail.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {selectedUserDetail.role === 'estudiante' && (
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Grado Escolar:</span>
                  <span className="text-cyan-300 font-bold">{selectedUserDetail.gradeLevel || '5to'} Grado</span>
                </div>
              )}
              {selectedUserDetail.role === 'docente' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Materia / Especialidad:</span>
                    <span className="text-white font-medium">{selectedUserDetail.assignedSubjects || 'Matemáticas'}</span>
                  </div>
                  {selectedUserDetail.teacherGrades && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Cursos Asignados:</span>
                      <span className="text-slate-200">{selectedUserDetail.teacherGrades.join(', ')}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Fecha de Registro:</span>
                <span className="text-slate-300">{new Date(selectedUserDetail.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Actions in Detail Modal */}
            <div className="flex items-center justify-between pt-2">
              {selectedUserDetail.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase() ? (
                <button
                  onClick={() => {
                    setUserToDelete(selectedUserDetail);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Usuario</span>
                </button>
              ) : (
                <span className="text-[11px] text-purple-400 font-semibold">Cuenta Master protegida</span>
              )}

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE USER */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-red-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">¿Eliminar Usuario de la Academia?</h3>
              <p className="text-xs text-slate-300 mt-1">
                ¿Estás seguro de que deseas eliminar la cuenta de{' '}
                <strong className="text-white">{userToDelete.displayName}</strong> ({userToDelete.email})?
              </p>
              <p className="text-[11px] text-red-400 mt-2">
                Esta acción removerá el perfil y sus permisos de acceso en Firebase.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <span>Registrar Usuario</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Sánchez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico Google *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rol</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="docente">Docente</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {newRole === 'estudiante' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Grado</label>
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="1ro">1ro Grado</option>
                      <option value="2do">2do Grado</option>
                      <option value="3ro">3ro Grado</option>
                      <option value="4to">4to Grado</option>
                      <option value="5to">5to Grado</option>
                      <option value="6to">6to Grado</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Materia</label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Materia..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAdd}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  {loadingAdd ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PERMISSIONS MODAL */}
      {selectedUserForPerms && (
        <PermissionsModal
          user={selectedUserForPerms}
          onClose={() => setSelectedUserForPerms(null)}
          onSave={async (updatedPerms) => {
            const docRef = doc(db, 'users', selectedUserForPerms.uid);
            await updateDoc(docRef, { permissions: updatedPerms, updatedAt: new Date().toISOString() });
            setSelectedUserForPerms(null);
            onRefreshUsers();
          }}
        />
      )}
    </div>
  );
};

// Subcomponent: Granular Permissions Modal
const PermissionsModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onSave: (perms: UserPermissions) => void;
}> = ({ user, onClose, onSave }) => {
  const [perms, setPerms] = useState<UserPermissions>(
    user.permissions || {
      canCreateClasses: user.role !== 'estudiante',
      canManageAttendance: true,
      canEditGrades: user.role !== 'estudiante',
      canExportReports: true,
      canManageUsers: user.role === 'admin',
    }
  );

  const toggle = (key: keyof UserPermissions) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-amber-400" />
          <span>Permisos Específicos de Acceso</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Configuración granular para <strong className="text-slate-200">{user.displayName}</strong> ({user.role})
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <span className="text-xs font-semibold text-white block">Crear y Programar Clases</span>
              <span className="text-[11px] text-slate-400">Generar salas de Meet y sincronizar calendario</span>
            </div>
            <input
              type="checkbox"
              checked={perms.canCreateClasses}
              onChange={() => toggle('canCreateClasses')}
              className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <span className="text-xs font-semibold text-white block">Control de Asistencia en Vivo</span>
              <span className="text-[11px] text-slate-400">Modificar asistencia en tiempo real</span>
            </div>
            <input
              type="checkbox"
              checked={perms.canManageAttendance}
              onChange={() => toggle('canManageAttendance')}
              className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <span className="text-xs font-semibold text-white block">Calificar Desempeño</span>
              <span className="text-[11px] text-slate-400">Editar notas y reportes mensuales</span>
            </div>
            <input
              type="checkbox"
              checked={perms.canEditGrades}
              onChange={() => toggle('canEditGrades')}
              className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <span className="text-xs font-semibold text-white block">Gestión de Usuarios</span>
              <span className="text-[11px] text-slate-400">Administrar privilegios institucionales</span>
            </div>
            <input
              type="checkbox"
              checked={perms.canManageUsers}
              onChange={() => toggle('canManageUsers')}
              className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
            />
          </label>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(perms)}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
          >
            Guardar Permisos
          </button>
        </div>
      </div>
    </div>
  );
};
