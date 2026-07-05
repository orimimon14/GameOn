import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';

// Client half of user bootstrap (MIGRATION_PLAN §2.2): create users/{uid}
// with client-writable keys only — Security Rules reject anything else.
// The onUserCreated trigger (API_CONTRACT §5.9) fills server-owned defaults
// and creates users/{uid}/private/account. Retry-safe: skips when the doc exists.
export const ensureUserDocument = async (user: User): Promise<'created' | 'exists'> => {
  const { db } = getFirebase();
  const userRef = doc(db, 'users', user.uid);

  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) return 'exists';

  const fallbackName = user.email?.split('@')[0]?.trim() || 'גיימר';
  const displayName = user.displayName?.trim() || fallbackName;

  await setDoc(userRef, { displayName });
  return 'created';
};
