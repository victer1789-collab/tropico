export type UserRole = 'admin' | 'docente' | 'estudiante';

export type GradeLevel = '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | 'Otro';

export interface UserPermissions {
  canCreateClasses: boolean;
  canManageAttendance: boolean;
  canEditGrades: boolean;
  canExportReports: boolean;
  canManageUsers: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  gradeLevel?: string; // For students: e.g. '1ro' - '6to' or custom
  teacherGrades?: string[]; // For teachers: grades they pass with (e.g. ['3ro', '4to', '5to'])
  assignedSubjects?: string; // For teachers: su materia / especialidad
  permissions?: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

export type ClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface VirtualClass {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel?: string; // Target grade (1ro - 6to or Todos)
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  meetUrl: string;
  meetSpaceName?: string;
  calendarEventId?: string;
  calendarHtmlLink?: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  status: ClassStatus;
  targetGroup?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  gradeLevel?: string;
  joinedAt?: string;
  leftAt?: string;
  status: AttendanceStatus;
  deviceType?: string;
  notes?: string;
  updatedAt: string;
}

export interface MonthlyAcademicReport {
  id: string;
  monthYear: string; // e.g. "2026-10"
  studentId: string;
  studentName: string;
  studentEmail: string;
  gradeLevel?: string;
  teacherId: string;
  teacherName?: string;
  subject: string;
  attendanceRate: number; // percentage (0 - 100)
  classesTotal: number;
  classesAttended: number;
  classesLate: number;
  classesAbsent: number;
  grade: number; // 0 - 20
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'class_starting' | 'class_created' | 'attendance' | 'grade' | 'system' | 'announcement';
  classId?: string;
  meetUrl?: string;
  targetGrade?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgente' | 'informativo';
  targetAudience: 'todos' | 'estudiantes' | 'docentes' | string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}
