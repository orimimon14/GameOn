import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  UserCredential,
} from 'firebase/auth';

import { getFirebase } from '@/config/firebase';

export const signUpWithEmail = (email: string, password: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(getFirebase().auth, email, password);

export const signInWithEmail = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(getFirebase().auth, email, password);

export const signInWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(getFirebase().auth, new GoogleAuthProvider());

export const signOutUser = (): Promise<void> => signOut(getFirebase().auth);

// Raw Firebase errors never reach the UI (CONVENTIONS §11) — map to i18n keys.
const AUTH_ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'auth.errors.invalidEmail',
  'auth/weak-password': 'auth.errors.weakPassword',
  'auth/email-already-in-use': 'auth.errors.emailInUse',
  'auth/invalid-credential': 'auth.errors.invalidCredentials',
  'auth/wrong-password': 'auth.errors.invalidCredentials',
  'auth/user-not-found': 'auth.errors.invalidCredentials',
  'auth/popup-closed-by-user': 'auth.errors.popupClosed',
  'auth/cancelled-popup-request': 'auth.errors.popupClosed',
  'auth/network-request-failed': 'auth.errors.network',
  'auth/too-many-requests': 'auth.errors.tooManyRequests',
};

export const mapAuthErrorToI18nKey = (error: unknown): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  return AUTH_ERROR_KEYS[code] ?? 'auth.errors.generic';
};
