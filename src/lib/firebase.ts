import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const FIRESTORE_DATABASE_ID = 'ai-studio-subscriptionguar-17e73052-5710-4f57-a6de-6c7cda673e8a';

// Initialize Firebase App
export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Auth Instance
export const auth = getAuth(app);

// Firestore Instance with specific databaseId
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

// Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Authentication helper functions
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google sign-in failed:', error);
    throw error;
  }
}

export async function signInDemoUser() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error('Anonymous sign in failed:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export { onAuthStateChanged };
export type { User };
