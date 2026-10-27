import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAabnUrLoFp5NqN4w1gjy-tVyfoO3IKiQ4",
  authDomain: "tropicov1.firebaseapp.com",
  projectId: "tropicov1",
  storageBucket: "tropicov1.firebasestorage.app",
  messagingSenderId: "254792023095",
  appId: "1:254792023095:web:0597017879b42154f613b2"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };
