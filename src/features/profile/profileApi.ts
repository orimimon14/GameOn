import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/config/firebase';
import { compressOrOriginal } from '@/shared/api/imageCompression';
import type { GalleryMediaItem, UserGameDocument } from '@/shared/models';
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
  return snapshot.docs
    .map((d) => ({ ...(d.data() as UserGameDocument), gameId: d.id }))
    .filter((g) => g.isActive !== false);
};

// ADR-043 — add/remove games after onboarding, straight through the rules
// (create allows only userGameClientWritableKeys; the catalog must contain
// the game; onUserGameUpdated resyncs publicProfiles.gameIds).
export const addGameToProfile = async (
  uid: string,
  gameId: string,
  details: { rank?: string; lookingFor: string; voicePreference?: string },
): Promise<void> => {
  const { db } = getFirebase();
  await setDoc(doc(db, 'users', uid, 'games', gameId), {
    rank: details.rank ?? '',
    lookingFor: details.lookingFor,
    ...(details.voicePreference ? { voicePreference: details.voicePreference } : {}),
    isActive: true,
  });
};

export const removeGameFromProfile = async (uid: string, gameId: string): Promise<void> => {
  const { db } = getFirebase();
  await updateDoc(doc(db, 'users', uid, 'games', gameId), { isActive: false });
};


// Profile photo: upload to the rules-gated path (profileImages/{uid} — owner,
// image MIME, ≤5MB) and point users.profileImageUrl at it (client-writable;
// publicProfiles resyncs via the onUserProfileUpdated trigger).
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const { blob, contentType, ext } = await compressOrOriginal(file, 5 * 1024 * 1024);
  return uploadAvatarBlob(uid, blob, contentType, ext);
};

// Cropped avatars arrive as a ready square JPEG from AvatarCropModal.
export const uploadCroppedProfilePhoto = (uid: string, blob: Blob): Promise<string> =>
  uploadAvatarBlob(uid, blob, 'image/jpeg', 'jpg');

const uploadAvatarBlob = async (
  uid: string,
  blob: Blob,
  contentType: string,
  ext: string,
): Promise<string> => {
  const { storage, db } = getFirebase();
  const path = `profileImages/${uid}/${Date.now()}.${ext}`;
  await uploadBytes(storageRef(storage, path), blob, { contentType });
  const url = await getDownloadURL(storageRef(storage, path));
  // profileImageUrl is client-writable; updatedAt is server-owned (rules) so we don't touch it.
  await updateDoc(doc(db, 'users', uid), { profileImageUrl: url });
  return url;
};

// ADR-042 — profile media gallery. Files go to profileMedia/{uid} (Storage
// rules: images for all, video Pro-only); the items array lives on
// users.galleryMedia (Firestore rules cap it at 3 for Basic / 9 for Pro) and
// publicProfiles resyncs via the onUserProfileUpdated trigger.
export const GALLERY_MAX_BASIC = 3;
export const GALLERY_MAX_PRO = 9;
export const GALLERY_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const GALLERY_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];

export type GalleryRejection = 'full' | 'video_pro_only' | 'video_too_big' | 'bad_type';

export const galleryRejection = (
  file: Pick<File, 'type' | 'size'>,
  currentCount: number,
  isPro: boolean,
): GalleryRejection | null => {
  if (currentCount >= (isPro ? GALLERY_MAX_PRO : GALLERY_MAX_BASIC)) return 'full';
  if (!file.type || file.type.startsWith('image/')) return null;
  const videoType = file.type.split(';')[0];
  if (!GALLERY_VIDEO_TYPES.includes(videoType)) return 'bad_type';
  if (!isPro) return 'video_pro_only';
  if (file.size > GALLERY_VIDEO_MAX_BYTES) return 'video_too_big';
  return null;
};

// Cropped gallery photos arrive as a ready square JPEG from the crop modal.
export const uploadCroppedGalleryPhoto = async (
  uid: string,
  blob: Blob,
  existing: GalleryMediaItem[],
): Promise<GalleryMediaItem> => {
  const { storage, db } = getFirebase();
  const id = `${Date.now()}`;
  const filePath = `profileMedia/${uid}/${id}.jpg`;
  await uploadBytes(storageRef(storage, filePath), blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef(storage, filePath));
  const item: GalleryMediaItem = { id, type: 'image', url, filePath };
  await updateDoc(doc(db, 'users', uid), { galleryMedia: [...existing, item] });
  return item;
};

export const uploadGalleryMedia = async (
  uid: string,
  file: File,
  existing: GalleryMediaItem[],
): Promise<GalleryMediaItem> => {
  const { storage, db } = getFirebase();
  const isImage = !file.type || file.type.startsWith('image/');
  const id = `${Date.now()}`;
  // MediaRecorder-style types can carry ";codecs=" — rules expect bare MIME.
  const image = isImage ? await compressOrOriginal(file, 10 * 1024 * 1024) : null;
  const blob = image ? image.blob : file;
  const contentType = image ? image.contentType : file.type.split(';')[0];
  const ext = image ? image.ext : (contentType.split('/')[1] ?? 'mp4');
  const filePath = `profileMedia/${uid}/${id}.${ext}`;
  await uploadBytes(storageRef(storage, filePath), blob, { contentType });
  const url = await getDownloadURL(storageRef(storage, filePath));
  const item: GalleryMediaItem = { id, type: isImage ? 'image' : 'video', url, filePath };
  await updateDoc(doc(db, 'users', uid), { galleryMedia: [...existing, item] });
  return item;
};

export const removeGalleryMedia = async (
  uid: string,
  item: GalleryMediaItem,
  existing: GalleryMediaItem[],
): Promise<void> => {
  const { storage, db } = getFirebase();
  await updateDoc(doc(db, 'users', uid), {
    galleryMedia: existing.filter((m) => m.id !== item.id),
  });
  // Best-effort Storage cleanup — the doc update is the source of truth.
  await deleteObject(storageRef(storage, item.filePath)).catch(() => undefined);
};
