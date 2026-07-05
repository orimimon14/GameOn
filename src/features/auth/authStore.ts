import { onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';

import { getFirebase, isFirebaseConfigured } from '@/config/firebase';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

export const useAuthStore = create<AuthState>()(() => ({
  user: null,
  status: 'loading',
}));

let listenerStarted = false;

// Single app-wide auth listener (called once from App). Firestore user bootstrap runs in P2-T03.
export const initAuthListener = (): void => {
  if (listenerStarted) return;
  listenerStarted = true;

  if (!isFirebaseConfigured) {
    // No Firebase config (tests / misconfigured env) — treat as signed out.
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    return;
  }

  const { auth } = getFirebase();
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, status: user ? 'authenticated' : 'unauthenticated' });
  });
};
