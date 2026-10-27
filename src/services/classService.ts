import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { VirtualClass, ClassStatus } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';

const CLASSES_COLLECTION = 'classes';

export function subscribeToClasses(
  onClassesChange: (classes: VirtualClass[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, CLASSES_COLLECTION), orderBy('scheduledAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const classes: VirtualClass[] = [];
        snapshot.forEach((docSnap) => {
          classes.push(docSnap.data() as VirtualClass);
        });
        onClassesChange(classes);
      },
      (error) => {
        console.warn('Classes listener notice:', error);
        onError?.(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CLASSES_COLLECTION);
  }
}

export async function createClass(classData: Omit<VirtualClass, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fullClass: VirtualClass = {
    ...classData,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, CLASSES_COLLECTION, newId), fullClass);
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${CLASSES_COLLECTION}/${newId}`);
    return newId;
  }
}

export async function updateClassStatus(classId: string, status: ClassStatus): Promise<void> {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CLASSES_COLLECTION}/${classId}`);
  }
}

export async function deleteClass(classId: string): Promise<void> {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CLASSES_COLLECTION}/${classId}`);
  }
}

export async function getAllClassesOnce(): Promise<VirtualClass[]> {
  try {
    const snap = await getDocs(collection(db, CLASSES_COLLECTION));
    const items: VirtualClass[] = [];
    snap.forEach((d) => items.push(d.data() as VirtualClass));
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CLASSES_COLLECTION);
  }
}
