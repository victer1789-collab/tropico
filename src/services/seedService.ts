import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  VirtualClass,
  UserProfile,
  AttendanceRecord,
  MonthlyAcademicReport,
  Announcement,
} from '../types';

export const INITIAL_STUDENTS: UserProfile[] = [
  {
    uid: 'std_01_mateo',
    email: 'mateo.fernandez@mitropico.edu',
    displayName: 'Mateo Fernández Castillo',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '1ero',
    assignedSubjects: 'Matemáticas, Lenguaje, Ciencias',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_02_camila',
    email: 'camila.torres@mitropico.edu',
    displayName: 'Camila Torres Mendoza',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '1ero',
    assignedSubjects: 'Matemáticas, Lenguaje, Ciencias',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_03_lucas',
    email: 'lucas.ramirez@mitropico.edu',
    displayName: 'Lucas Ramírez Silva',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '2do',
    assignedSubjects: 'Matemáticas, Historia, Ciencias',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_04_sofia',
    email: 'sofia.paredes@mitropico.edu',
    displayName: 'Sofía Paredes Salazar',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '2do',
    assignedSubjects: 'Matemáticas, Historia, Ciencias',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_05_valeria',
    email: 'valeria.gomez@mitropico.edu',
    displayName: 'Valeria Gómez Rivas',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '3ero',
    assignedSubjects: 'Física Elemental, Álgebra, Literatura',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_06_diego',
    email: 'diego.morales@mitropico.edu',
    displayName: 'Diego Morales Cruz',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '3ero',
    assignedSubjects: 'Física Elemental, Álgebra, Literatura',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_07_andrea',
    email: 'andrea.quispe@mitropico.edu',
    displayName: 'Andrea Quispe Huamán',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '4to',
    assignedSubjects: 'Geometría, Química, Biología',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_08_lucia',
    email: 'lucia.flores@mitropico.edu',
    displayName: 'Lucía Flores Vega',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '5to',
    assignedSubjects: 'Cálculo Avanzado, Física Cuántica, Filosofía',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    uid: 'std_09_sebastian',
    email: 'sebastian.vargas@mitropico.edu',
    displayName: 'Sebastián Vargas Solís',
    role: 'estudiante',
    status: 'active',
    gradeLevel: '6to',
    assignedSubjects: 'Pre-Universitario, Química Orgánica, Cálculo',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
];

export const INITIAL_TEACHERS: UserProfile[] = [
  {
    uid: 'doc_01_carlos',
    email: 'prof.carlos@mitropico.edu',
    displayName: 'Prof. Carlos Mendoza',
    role: 'docente',
    status: 'active',
    assignedSubjects: 'Matemáticas & Cálculo (3ero a 6to)',
    permissions: {
      canCreateClasses: true,
      canManageAttendance: true,
      canEditGrades: true,
      canExportReports: true,
      canManageUsers: false,
    },
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-15T08:00:00Z',
  },
  {
    uid: 'doc_02_elena',
    email: 'prof.elena@mitropico.edu',
    displayName: 'Dra. Elena Vásquez',
    role: 'docente',
    status: 'active',
    assignedSubjects: 'Física & Química (4to a 6to)',
    permissions: {
      canCreateClasses: true,
      canManageAttendance: true,
      canEditGrades: true,
      canExportReports: true,
      canManageUsers: false,
    },
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-15T08:00:00Z',
  },
  {
    uid: 'doc_03_roberto',
    email: 'prof.roberto@mitropico.edu',
    displayName: 'Prof. Roberto Alarcón',
    role: 'docente',
    status: 'active',
    assignedSubjects: 'Lenguaje & Literatura (1ero a 3ero)',
    permissions: {
      canCreateClasses: true,
      canManageAttendance: true,
      canEditGrades: true,
      canExportReports: true,
      canManageUsers: false,
    },
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-15T08:00:00Z',
  },
];

export const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_welcome_mitropico',
    title: '¡Bienvenidos a Academia Virtual Mi Trópico!',
    content: 'Las clases virtuales en tiempo real están activas para todos los grados de 1ero a 6to. Para unirse a cualquier clase en vivo, basta con presionar el botón "Unirse a Clase" desde el panel de estudiante.',
    priority: 'informativo',
    targetAudience: 'todos',
    authorName: 'Dirección General Mi Trópico',
    authorEmail: 'victer1789@gmail.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann_meet_recordatorio',
    title: 'Puntualidad en Google Meet y Asistencia Automática',
    content: 'Al ingresar a su clase por Google Meet, la asistencia se registra de forma automática como Presente o Tardanza según el horario estipulado.',
    priority: 'urgente',
    targetAudience: 'estudiantes',
    authorName: 'Coordinación Académica',
    authorEmail: 'victer1789@gmail.com',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const SAMPLE_CLASSES: VirtualClass[] = [
  {
    id: 'cls_live_5to',
    title: 'Cálculo Multivariable y Ecuaciones Diferenciales',
    description: 'Sesión intensiva en Google Meet sobre integrales dobles y cálculo vectorial para 5to grado.',
    subject: 'Matemáticas',
    gradeLevel: '5to',
    teacherId: 'doc_01_carlos',
    teacherName: 'Prof. Carlos Mendoza',
    teacherEmail: 'prof.carlos@mitropico.edu',
    meetUrl: 'https://meet.google.com/mit-trop-ico',
    meetSpaceName: 'spaces/mit-trop-ico',
    scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    status: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cls_upcoming_3ero',
    title: 'Leyes del Movimiento y Dinámica de Newton',
    description: 'Taller de problemas prácticos con diagramas de cuerpo libre y aceleración.',
    subject: 'Física Elemental',
    gradeLevel: '3ero',
    teacherId: 'doc_02_elena',
    teacherName: 'Dra. Elena Vásquez',
    teacherEmail: 'prof.elena@mitropico.edu',
    meetUrl: 'https://meet.google.com/fis-clase-3er',
    meetSpaceName: 'spaces/fis-clase-3er',
    scheduledAt: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cls_upcoming_1ero',
    title: 'Técnicas de Comprensión Lectora & Oratoria',
    description: 'Estrategias de análisis crítico de textos narrativos y argumentativos.',
    subject: 'Lenguaje y Literatura',
    gradeLevel: '1ero',
    teacherId: 'doc_03_roberto',
    teacherName: 'Prof. Roberto Alarcón',
    teacherEmail: 'prof.roberto@mitropico.edu',
    meetUrl: 'https://meet.google.com/len-read-1er',
    meetSpaceName: 'spaces/len-read-1er',
    scheduledAt: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cls_upcoming_6to',
    title: 'Química Orgánica: Hidrocarburos y Grupos Funcionales',
    description: 'Preparación pre-universitaria intensiva con nomenclatura IUPAC y reacciones.',
    subject: 'Química',
    gradeLevel: '6to',
    teacherId: 'doc_02_elena',
    teacherName: 'Dra. Elena Vásquez',
    teacherEmail: 'prof.elena@mitropico.edu',
    meetUrl: 'https://meet.google.com/qui-pre-6to',
    meetSpaceName: 'spaces/qui-pre-6to',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cls_past_4to',
    title: 'Geometría del Espacio: Poliedros y Cuerpos Redondos',
    description: 'Cálculo de áreas laterales, volúmenes y teoremas de Euler.',
    subject: 'Geometría',
    gradeLevel: '4to',
    teacherId: 'doc_01_carlos',
    teacherName: 'Prof. Carlos Mendoza',
    teacherEmail: 'prof.carlos@mitropico.edu',
    meetUrl: 'https://meet.google.com/geo-esp-4to',
    meetSpaceName: 'spaces/geo-esp-4to',
    scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 75,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_live_lucia',
    classId: 'cls_live_5to',
    studentId: 'std_08_lucia',
    studentName: 'Lucía Flores Vega',
    studentEmail: 'lucia.flores@mitropico.edu',
    gradeLevel: '5to',
    joinedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'present',
    deviceType: 'Computadora de Escritorio',
    notes: 'Conectada puntualmente con cámara activa',
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_REPORTS: MonthlyAcademicReport[] = [
  {
    id: 'rep_2026-10_lucia',
    monthYear: '2026-10',
    studentId: 'std_08_lucia',
    studentName: 'Lucía Flores Vega',
    studentEmail: 'lucia.flores@mitropico.edu',
    gradeLevel: '5to',
    teacherId: 'doc_01_carlos',
    teacherName: 'Prof. Carlos Mendoza',
    subject: 'Matemáticas',
    attendanceRate: 95,
    classesTotal: 20,
    classesAttended: 19,
    classesLate: 1,
    classesAbsent: 1,
    grade: 19,
    feedback: 'Excelente participación en resolución de ejercicios de cálculo avanzado.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rep_2026-10_mateo',
    monthYear: '2026-10',
    studentId: 'std_01_mateo',
    studentName: 'Mateo Fernández Castillo',
    studentEmail: 'mateo.fernandez@mitropico.edu',
    gradeLevel: '1ero',
    teacherId: 'doc_03_roberto',
    teacherName: 'Prof. Roberto Alarcón',
    subject: 'Lenguaje y Literatura',
    attendanceRate: 85,
    classesTotal: 18,
    classesAttended: 15,
    classesLate: 3,
    classesAbsent: 3,
    grade: 16,
    feedback: 'Buen desempeño en redacción, reforzar puntualidad en las sesiones de Meet.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rep_2026-10_valeria',
    monthYear: '2026-10',
    studentId: 'std_05_valeria',
    studentName: 'Valeria Gómez Rivas',
    studentEmail: 'valeria.gomez@mitropico.edu',
    gradeLevel: '3ero',
    teacherId: 'doc_02_elena',
    teacherName: 'Dra. Elena Vásquez',
    subject: 'Física Elemental',
    attendanceRate: 100,
    classesTotal: 16,
    classesAttended: 16,
    classesLate: 0,
    classesAbsent: 0,
    grade: 20,
    feedback: 'Desempeño sobresaliente y asistencia perfecta durante todo el mes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rep_2026-10_sebastian',
    monthYear: '2026-10',
    studentId: 'std_09_sebastian',
    studentName: 'Sebastián Vargas Solís',
    studentEmail: 'sebastian.vargas@mitropico.edu',
    gradeLevel: '6to',
    teacherId: 'doc_02_elena',
    teacherName: 'Dra. Elena Vásquez',
    subject: 'Química',
    attendanceRate: 75,
    classesTotal: 20,
    classesAttended: 15,
    classesLate: 4,
    classesAbsent: 5,
    grade: 14,
    feedback: 'Alerta por inasistencias en clases matutinas. Requiere asesoría académica.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function checkAndSeedInitialData(currentUserEmail?: string, currentUid?: string) {
  try {
    const sentinelRef = doc(db, 'system', 'mitropico_v2');
    const sentinelSnap = await getDoc(sentinelRef);

    if (sentinelSnap.exists()) {
      return;
    }

    // Seed students
    for (const student of INITIAL_STUDENTS) {
      await setDoc(doc(db, 'users', student.uid), student);
    }

    // Seed teachers
    for (const teacher of INITIAL_TEACHERS) {
      await setDoc(doc(db, 'users', teacher.uid), teacher);
    }

    // Seed sample classes
    for (const cls of SAMPLE_CLASSES) {
      const classToSave = {
        ...cls,
        teacherId: cls.id === 'cls_live_5to' && currentUid ? currentUid : cls.teacherId,
        teacherEmail: cls.id === 'cls_live_5to' && currentUserEmail ? currentUserEmail : cls.teacherEmail,
      };
      await setDoc(doc(db, 'classes', cls.id), classToSave);
    }

    // Seed sample attendance for the live class
    for (const att of SAMPLE_ATTENDANCE) {
      await setDoc(doc(db, 'attendance', att.id), att);
    }

    // Seed sample monthly academic reports
    for (const rep of SAMPLE_REPORTS) {
      await setDoc(doc(db, 'reports', rep.id), rep);
    }

    // Seed announcements
    for (const ann of SAMPLE_ANNOUNCEMENTS) {
      await setDoc(doc(db, 'announcements', ann.id), ann);
    }

    // Set sentinel
    await setDoc(sentinelRef, { initializedAt: new Date().toISOString(), version: 'mitropico_v2' });
  } catch (err) {
    console.warn('Seed operation note:', err);
  }
}
