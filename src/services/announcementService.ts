import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Announcement } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

export const createAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt'>
): Promise<string> => {
  const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);

  const payload: Announcement = {
    ...announcement,
    id,
    createdAt: new Date().toISOString(),
  };

  if (!auth.currentUser) {
    return id;
  }

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ANNOUNCEMENTS_COLLECTION}/${id}`);
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  if (!auth.currentUser) {
    return;
  }
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ANNOUNCEMENTS_COLLECTION}/${id}`);
    throw error;
  }
};

export const subscribeToAnnouncements = (
  callback: (announcements: Announcement[]) => void
) => {
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Announcement);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      console.warn('Announcements subscription note:', error);
      callback([]);
    }
  );
};
