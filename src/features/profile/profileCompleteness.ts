import type { UserDocument, UserGameDocument } from '@/shared/models';

// Profile completeness — the checklist that makes profiles worth swiping on.
// Five equally-weighted, Basic-achievable items; 100% hides the meter.
export type CompletenessItem = 'photo' | 'bio' | 'gallery' | 'games' | 'rank';

export interface ProfileCompleteness {
  percent: number;
  missing: CompletenessItem[];
}

export const computeProfileCompleteness = (
  userDoc: Pick<UserDocument, 'profileImageUrl' | 'bio' | 'galleryMedia'>,
  games: Pick<UserGameDocument, 'rank'>[],
): ProfileCompleteness => {
  const checks: Array<[CompletenessItem, boolean]> = [
    ['photo', Boolean(userDoc.profileImageUrl)],
    ['bio', (userDoc.bio ?? '').trim().length >= 10],
    ['gallery', (userDoc.galleryMedia ?? []).length >= 1],
    ['games', games.length >= 2],
    ['rank', games.some((game) => (game.rank ?? '').trim().length > 0)],
  ];
  const missing = checks.filter(([, done]) => !done).map(([item]) => item);
  return {
    percent: Math.round(((checks.length - missing.length) / checks.length) * 100),
    missing,
  };
};
