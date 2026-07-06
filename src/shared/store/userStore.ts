import { doc, onSnapshot } from 'firebase/firestore';
import { create } from 'zustand';

import { getFirebase } from '@/config/firebase';
import type { UserDocument } from '@/shared/models';

// Live subscription to the signed-in user's users/{uid} document.
// Started/stopped by the auth listener; consumed by guards and screens.
export type UserDocStatus = 'idle' | 'loading' | 'ready';

interface UserDocState {
  userDoc: UserDocument | null;
  status: UserDocStatus;
}

export const useUserStore = create<UserDocState>()(() => ({
  userDoc: null,
  status: 'idle',
}));

let unsubscribe: (() => void) | null = null;

export const startUserDocListener = (uid: string): void => {
  stopUserDocListener();
  useUserStore.setState({ userDoc: null, status: 'loading' });
  const { db } = getFirebase();
  unsubscribe = onSnapshot(doc(db, 'users', uid), (snapshot) => {
    useUserStore.setState({
      userDoc: snapshot.exists() ? (snapshot.data() as UserDocument) : null,
      status: 'ready',
    });
  });
};

export const stopUserDocListener = (): void => {
  unsubscribe?.();
  unsubscribe = null;
  useUserStore.setState({ userDoc: null, status: 'idle' });
};
