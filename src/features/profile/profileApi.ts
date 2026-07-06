import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

import { getFirebase } from '@/config/firebase';
import type { UserGameDocument } from '@/shared/models';
import type { ProfileBasicsInput } from '@/shared/schemas/profileForm';

// Direct Firestore access for the OWN profile — Security Rules restrict the
// update to userClientWritableKeys; the onUserProfileUpdated trigger resyncs
// publicProfiles automatically (API_CONTRACT §5.1).
export const updateMyProfile = async (uid: string, input: ProfileBasicsInput): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'users', uid), { ...input });
};

export const updateMyPreferredLocale = async (uid: string, locale: 'he' | 'en'): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'users', uid), { preferredLocale: locale });
};

export const loadMyGames = async (uid: string): Promise<UserGameDocument[]> => {
  const { db } = getFirebase();
  const snapshot = await getDocs(collection(db, 'users', uid, 'games'));
  return snapshot.docs.map((d) => d.data() as UserGameDocument);
};
