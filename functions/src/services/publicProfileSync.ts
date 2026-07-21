import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// Rebuilds publicProfiles/{uid} from users/{uid} + active games (DATA_MODEL §4.3).
// Server-owned read model: never copies private fields (email, moderation, payment).
// Shared by completeOnboarding, syncPublicProfile and the user/game triggers.
export const syncPublicProfileForUser = async (uid: string): Promise<boolean> => {
  const db = getFirestore();

  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data();
  if (!user) return false;

  const gamesSnap = await db
    .collection(`users/${uid}/games`)
    .where('isActive', '==', true)
    .get();
  const gameIds = gamesSnap.docs.map((d) => d.id);
  const primaryDoc = gamesSnap.docs[0];
  const primary = primaryDoc?.data();

  const isPro = user.isPro === true;

  const publicProfile: Record<string, unknown> = {
    uid,
    displayName: user.displayName ?? '',
    age: user.age ?? 0,
    bio: user.bio ?? '',
    skillLevel: user.skillLevel ?? 'beginner',
    platforms: user.platforms ?? [],
    playTimes: user.playTimes ?? [], // ADR-045 — when they usually play
    isPro,
    verifiedBadge: isPro, // ADR-025: verifiedBadge == Pro member
    gameIds,
    isDiscoverable: user.isDiscoverable !== false,
    isSuspended: user.isSuspended === true,
    isDeleted: user.isDeleted === true,
    updatedAt: FieldValue.serverTimestamp(),
    lastActiveAt: user.lastActiveAt ?? FieldValue.serverTimestamp(),
  };

  if (user.profileImageUrl) publicProfile.profileImageUrl = user.profileImageUrl;
  if (user.bannerImageUrl) publicProfile.bannerImageUrl = user.bannerImageUrl;
  // ADR-042 — mirror the media gallery, sanitized to the contract shape.
  if (Array.isArray(user.galleryMedia)) {
    publicProfile.galleryMedia = user.galleryMedia
      .filter(
        (m: Record<string, unknown>) =>
          m &&
          (m.type === 'image' || m.type === 'video') &&
          typeof m.url === 'string' &&
          typeof m.id === 'string',
      )
      .slice(0, 9)
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        filePath: typeof m.filePath === 'string' ? m.filePath : '',
      }));
  }
  if (user.avatarBorderItemId) publicProfile.avatarBorderItemId = user.avatarBorderItemId;
  if (user.globalBackgroundItemId) publicProfile.globalBackgroundItemId = user.globalBackgroundItemId;
  if (primaryDoc && primary) {
    publicProfile.primaryGameId = primaryDoc.id;
    publicProfile.primaryRank = primary.rank ?? '';
  }

  const publicRef = db.doc(`publicProfiles/${uid}`);
  const existing = await publicRef.get();
  if (!existing.exists) publicProfile.createdAt = FieldValue.serverTimestamp();

  await publicRef.set(publicProfile, { merge: true });
  return true;
};
