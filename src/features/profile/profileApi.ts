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
// Phone photos are often 8-15MB — resize to ≤1080px JPEG before upload so
// the 5MB Storage rule never bites and profiles load fast.
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1080;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('compress_failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad_image'));
    };
    img.src = url;
  });

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const { storage, db } = getFirebase();
  const compressed = await compressImage(file);
  const path = `profileImages/${uid}/${Date.now()}.jpg`;
  await uploadBytes(storageRef(storage, path), compressed, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef(storage, path));
  // profileImageUrl is client-writable; updatedAt is server-owned (rules) so we don't touch it.
  await updateDoc(doc(db, 'users', uid), { profileImageUrl: url });
  return url;
};
