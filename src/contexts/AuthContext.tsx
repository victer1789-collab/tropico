import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole, GradeLevel } from '../types';
import { handleFirestoreError, OperationType } from '../services/firestoreErrors';

interface OnboardingData {
  role: UserRole;
  gradeLevel?: string;
  teacherGrades?: string[];
  assignedSubjects?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: (onboarding?: OnboardingData) => Promise<void>;
  loginAsDemo: (role: UserRole, gradeLevel?: string, subject?: string, teacherGrades?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory access token cache (NEVER stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const ADMIN_EMAIL = 'victer1789@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('estudiante');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize or create user profile in Firestore
  const syncUserProfile = async (
    firebaseUser: User,
    onboarding?: OnboardingData
  ): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isSystemAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const existingData = snap.data() as UserProfile;
        // If system admin, guarantee admin role
        if (isSystemAdmin && existingData.role !== 'admin') {
          const updated: UserProfile = {
            ...existingData,
            role: 'admin',
            updatedAt: new Date().toISOString(),
          };
          await updateDoc(userDocRef, { role: 'admin', updatedAt: updated.updatedAt });
          try {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: firebaseUser.email,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Admin record sync note:', e);
          }
          return updated;
        }

        // If user came with fresh onboarding choices
        if (onboarding && (onboarding.role !== existingData.role || onboarding.gradeLevel !== existingData.gradeLevel || onboarding.teacherGrades !== existingData.teacherGrades)) {
          const updated: UserProfile = {
            ...existingData,
            role: onboarding.role,
            gradeLevel: onboarding.gradeLevel || existingData.gradeLevel,
            teacherGrades: onboarding.teacherGrades || existingData.teacherGrades,
            assignedSubjects: onboarding.assignedSubjects || existingData.assignedSubjects,
            updatedAt: new Date().toISOString(),
          };
          await updateDoc(userDocRef, {
            role: updated.role,
            gradeLevel: updated.gradeLevel || null,
            teacherGrades: updated.teacherGrades || null,
            assignedSubjects: updated.assignedSubjects || null,
            updatedAt: updated.updatedAt,
          });
          return updated;
        }

        return existingData;
      } else {
        // Brand new profile
        const targetRole: UserRole = isSystemAdmin
          ? 'admin'
          : onboarding?.role || 'estudiante';

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario Mi Trópico',
          photoURL: firebaseUser.photoURL || '',
          role: targetRole,
          status: 'active',
          gradeLevel: targetRole === 'estudiante' ? onboarding?.gradeLevel || '5to' : undefined,
          teacherGrades: targetRole === 'docente' ? onboarding?.teacherGrades || ['3ro', '4to', '5to'] : undefined,
          assignedSubjects:
            targetRole === 'docente'
              ? onboarding?.assignedSubjects || 'Matemáticas'
              : 'Todas las materias',
          permissions: {
            canCreateClasses: targetRole !== 'estudiante',
            canManageAttendance: true,
            canEditGrades: targetRole !== 'estudiante',
            canExportReports: true,
            canManageUsers: isSystemAdmin || targetRole === 'admin',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);

        if (isSystemAdmin || targetRole === 'admin') {
          try {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: firebaseUser.email,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Admin record sync note:', e);
          }
        }
        return newProfile;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
          setActiveRole(profile.role);
          setAccessToken(cachedAccessToken);
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        // If not in demo mode
        if (!userProfile?.uid.startsWith('demo_')) {
          cachedAccessToken = null;
          setAccessToken(null);
          setUserProfile(null);
          setActiveRole('estudiante');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (onboarding?: OnboardingData) => {
    try {
      isSigningIn = true;
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(cachedAccessToken);
      }
      if (result.user) {
        const profile = await syncUserProfile(result.user, onboarding);
        setUserProfile(profile);
        setActiveRole(profile.role);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  };

  // Instant demo login as fictive user for testing
  const loginAsDemo = async (role: UserRole, gradeLevel?: string, subject?: string, teacherGrades?: string[]) => {
    const mockUid = `demo_${role}_${Date.now()}`;
    const mockEmail =
      role === 'admin'
        ? 'admin@mitropico.edu'
        : role === 'docente'
        ? 'prof.carlos@mitropico.edu'
        : 'lucia.flores@mitropico.edu';
    const mockName =
      role === 'admin'
        ? 'Dirección General Mi Trópico'
        : role === 'docente'
        ? `Prof. Carlos Mendoza (${subject || 'Matemáticas'})`
        : `Lucía Flores (${gradeLevel || '5to'} Grado)`;

    const demoProfile: UserProfile = {
      uid: mockUid,
      email: mockEmail,
      displayName: mockName,
      role,
      status: 'active',
      gradeLevel: role === 'estudiante' ? gradeLevel || '5to' : undefined,
      teacherGrades: role === 'docente' ? teacherGrades || ['3ro', '4to', '5to', '6to'] : undefined,
      assignedSubjects: role === 'docente' ? subject || 'Matemáticas' : 'Todas',
      permissions: {
        canCreateClasses: role !== 'estudiante',
        canManageAttendance: true,
        canEditGrades: role !== 'estudiante',
        canExportReports: true,
        canManageUsers: role === 'admin',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(demoProfile);
    setActiveRole(role);
  };

  const logout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    cachedAccessToken = null;
    setAccessToken(null);
    setUser(null);
    setUserProfile(null);
    setActiveRole('estudiante');
  };

  const refreshUserProfile = async () => {
    if (user) {
      const p = await syncUserProfile(user);
      setUserProfile(p);
    }
  };

  const updateProfileRole = async (targetUid: string, newRole: UserRole) => {
    const userDocRef = doc(db, 'users', targetUid);
    try {
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      if (targetUid === user?.uid || targetUid === userProfile?.uid) {
        setActiveRole(newRole);
        setUserProfile((prev) => (prev ? { ...prev, role: newRole } : null));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    try {
      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.warn('Update user profile data note:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        activeRole,
        setActiveRole,
        accessToken,
        loading,
        loginWithGoogle,
        loginAsDemo,
        logout,
        updateProfileRole,
        updateUserProfileData,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const getCachedAccessToken = () => cachedAccessToken;
