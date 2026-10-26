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
import { db, auth } from '../firebase';
import { AttendanceRecord, AttendanceStatus, VirtualClass, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';

const ATTENDANCE_COLLECTION = 'attendance';

export function subscribeToClassAttendance(
  classId: string,
  onAttendanceChange: (records: AttendanceRecord[]) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  try {
    const q = query(collection(db, ATTENDANCE_COLLECTION), where('classId', '==', classId));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as AttendanceRecord);
        });
        onAttendanceChange(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ATTENDANCE_COLLECTION);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ATTENDANCE_COLLECTION);
  }
}

export function subscribeToAllAttendance(onAttendanceChange: (records: AttendanceRecord[]) => void) {
  if (!auth.currentUser) {
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, ATTENDANCE_COLLECTION),
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as AttendanceRecord);
        });
        onAttendanceChange(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ATTENDANCE_COLLECTION);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ATTENDANCE_COLLECTION);
  }
}

export async function registerClassEntry(
  classObj: VirtualClass,
  userProfile: UserProfile
): Promise<AttendanceRecord> {
  const attendanceId = `att_${classObj.id}_${userProfile.uid}`;
  const docRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);

  // If unauthenticated or in fictive demo mode, return local attendance record
  if (!auth.currentUser || userProfile.uid.startsWith('demo_')) {
    const record: AttendanceRecord = {
      id: attendanceId,
      classId: classObj.id,
      studentId: userProfile.uid,
      studentName: userProfile.displayName || 'Estudiante',
      studentEmail: userProfile.email,
      joinedAt: new Date().toISOString(),
      status: 'present',
      deviceType: 'Dispositivo Demo',
      updatedAt: new Date().toISOString(),
    };
    return record;
  }

  try {
    const existingSnap = await getDocs(
      query(
        collection(db, ATTENDANCE_COLLECTION),
        where('classId', '==', classObj.id),
        where('studentId', '==', userProfile.uid)
      )
    );

    const now = new Date();
    const classStartTime = new Date(classObj.scheduledAt);
    const diffMinutes = (now.getTime() - classStartTime.getTime()) / (1000 * 60);

    // If joined more than 10 minutes after scheduled start, marked as 'late'
    const status: AttendanceStatus = diffMinutes > 10 ? 'late' : 'present';

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    const deviceType = isMobile ? 'Dispositivo Móvil' : 'Computadora de Escritorio';

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const data = existingDoc.data() as AttendanceRecord;
      return data;
    }

    const record: AttendanceRecord = {
      id: attendanceId,
      classId: classObj.id,
      studentId: userProfile.uid,
      studentName: userProfile.displayName || 'Estudiante',
      studentEmail: userProfile.email,
      joinedAt: now.toISOString(),
      status,
      deviceType,
      updatedAt: now.toISOString(),
    };

    await setDoc(docRef, record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTENDANCE_COLLECTION}/${attendanceId}`);
  }
}

export async function updateAttendanceStatus(
  recordId: string,
  newStatus: AttendanceStatus,
  notes?: string
): Promise<void> {
  try {
    const docRef = doc(db, ATTENDANCE_COLLECTION, recordId);
    await updateDoc(docRef, {
      status: newStatus,
      notes: notes || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ATTENDANCE_COLLECTION}/${recordId}`);
  }
}

export function exportAttendanceCSV(records: AttendanceRecord[], classTitle: string) {
  const headers = ['Estudiante', 'Email', 'Estado', 'Hora de Entrada', 'Dispositivo', 'Notas'];
  const statusLabels: Record<AttendanceStatus, string> = {
    present: 'Presente',
    late: 'Tardanza',
    absent: 'Ausente',
    excused: 'Justificado',
  };

  const rows = records.map((r) => [
    `"${r.studentName}"`,
    `"${r.studentEmail}"`,
    `"${statusLabels[r.status] || r.status}"`,
    `"${r.joinedAt ? new Date(r.joinedAt).toLocaleString() : 'N/A'}"`,
    `"${r.deviceType || 'N/A'}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Asistencia_${classTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
