import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

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


// Profile photo: upload to the rules-gated path (profileImages/{uid} — owner,
// image MIME, ≤5MB) and point users.profileImageUrl at it (client-writable;
// publicProfiles resyncs via the onUserProfileUpdated trigger).
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const { storage, db } = getFirebase();
  const path = `profileImages/${uid}/${Date.now()}.${file.type.includes('png') ? 'png' : 'jpg'}`;
  await uploadBytes(storageRef(storage, path), file, { contentType: file.type });
  const url = await getDownloadURL(storageRef(storage, path));
  // profileImageUrl is client-writable; updatedAt is server-owned (rules) so we don't touch it.
  await updateDoc(doc(db, 'users', uid), { profileImageUrl: url });
  return url;
};
