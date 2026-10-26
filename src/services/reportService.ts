import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MonthlyAcademicReport, VirtualClass, AttendanceRecord, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';

const REPORTS_COLLECTION = 'reports';

export function subscribeToReports(
  monthYear: string,
  onReportsChange: (reports: MonthlyAcademicReport[]) => void
) {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where('monthYear', '==', monthYear));
    return onSnapshot(
      q,
      (snapshot) => {
        const reports: MonthlyAcademicReport[] = [];
        snapshot.forEach((docSnap) => {
          reports.push(docSnap.data() as MonthlyAcademicReport);
        });
        onReportsChange(reports);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, REPORTS_COLLECTION);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, REPORTS_COLLECTION);
  }
}

export async function upsertReportGrade(
  reportId: string,
  grade: number,
  feedback?: string
): Promise<void> {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, {
      grade,
      feedback: feedback || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function generateMonthlyReports(
  monthYear: string,
  allStudents: UserProfile[],
  allClasses: VirtualClass[],
  allAttendance: AttendanceRecord[],
  teacherId: string,
  teacherName: string
): Promise<MonthlyAcademicReport[]> {
  const generated: MonthlyAcademicReport[] = [];

  // Filter classes belonging to this monthYear (YYYY-MM)
  const monthClasses = allClasses.filter((c) => c.scheduledAt.startsWith(monthYear));
  const totalMonthClasses = monthClasses.length;

  for (const student of allStudents) {
    if (student.role !== 'estudiante') continue;

    const studentAttendance = allAttendance.filter(
      (a) => a.studentId === student.uid && monthClasses.some((c) => c.id === a.classId)
    );

    const attendedCount = studentAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const lateCount = studentAttendance.filter((a) => a.status === 'late').length;
    const absentCount = Math.max(0, totalMonthClasses - attendedCount);

    const attendanceRate = totalMonthClasses > 0 ? Math.round((attendedCount / totalMonthClasses) * 100) : 100;

    // Academic grade based on attendance rate and participation (scaled 0-20)
    // Default grade based on attendance rate (e.g. 90% attendance ~ 17/20)
    const baselineGrade = Math.min(20, Math.max(0, Math.round((attendanceRate / 100) * 18 + 2)));

    const reportId = `rep_${monthYear}_${student.uid}`;
    const reportData: MonthlyAcademicReport = {
      id: reportId,
      monthYear,
      studentId: student.uid,
      studentName: student.displayName,
      studentEmail: student.email,
      gradeLevel: student.gradeLevel || '5to',
      teacherId,
      teacherName,
      subject: student.assignedSubjects || 'Ciencias & Tecnología',
      attendanceRate,
      classesTotal: totalMonthClasses,
      classesAttended: attendedCount,
      classesLate: lateCount,
      classesAbsent: absentCount,
      grade: baselineGrade,
      feedback:
        attendanceRate >= 85
          ? 'Excelente desempeño y constancia en las clases virtuales.'
          : attendanceRate >= 65
          ? 'Buen desempeño, se recomienda mayor puntualidad al ingresar.'
          : 'Requiere seguimiento por inasistencias acumuladas.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, REPORTS_COLLECTION, reportId), reportData);
      generated.push(reportData);
    } catch (err) {
      console.warn('Error saving individual report record:', err);
    }
  }

  return generated;
}

export function exportReportsCSV(reports: MonthlyAcademicReport[], monthYear: string) {
  const headers = [
    'Estudiante',
    'Email',
    'Asignatura',
    'Mes',
    'Total Clases',
    'Asistencias',
    'Tardanzas',
    'Inasistencias',
    '% Asistencia',
    'Nota Final (0-20)',
    'Observaciones',
  ];

  const rows = reports.map((r) => [
    `"${r.studentName}"`,
    `"${r.studentEmail}"`,
    `"${r.subject}"`,
    `"${r.monthYear}"`,
    r.classesTotal,
    r.classesAttended,
    r.classesLate,
    r.classesAbsent,
    `"${r.attendanceRate}%"`,
    r.grade,
    `"${(r.feedback || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Reporte_Desempeño_${monthYear}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
