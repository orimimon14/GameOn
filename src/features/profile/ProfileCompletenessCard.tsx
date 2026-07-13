import React from 'react';
import { useTranslation } from 'react-i18next';

import { computeProfileCompleteness, type CompletenessItem } from './profileCompleteness';

import type { UserDocument, UserGameDocument } from '@/shared/models';

// Nudges users toward a swipe-worthy profile: progress bar + what's missing.
// Disappears entirely at 100% — a finished profile earns a clean page.
const ITEM_KEYS: Record<CompletenessItem, string> = {
  photo: 'profile.completeness.photo',
  bio: 'profile.completeness.bio',
  gallery: 'profile.completeness.gallery',
  games: 'profile.completeness.games',
  rank: 'profile.completeness.rank',
};

interface ProfileCompletenessCardProps {
  userDoc: UserDocument;
  games: UserGameDocument[] | null;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  userDoc,
  games,
}) => {
  const { t } = useTranslation();
  if (games === null) return null; // games still loading — avoid a flash
  const { percent, missing } = computeProfileCompleteness(userDoc, games);
  if (missing.length === 0) return null;

  return (
    <div className="bg-surface/60 rounded-3xl border border-primary/30 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-primary font-black text-xl">{percent}%</span>
        <h2 className="text-text font-black italic uppercase text-end">
          {t('profile.completeness.title')}
        </h2>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-4" dir="ltr">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-premium transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-text-muted text-sm text-end mb-2">{t('profile.completeness.subtitle')}</p>
      <ul className="flex flex-col gap-1.5">
        {missing.map((item) => (
          <li key={item} className="flex items-center justify-end gap-2 text-sm font-bold text-text">
            <span>{t(ITEM_KEYS[item])}</span>
            <i className="fa-regular fa-circle text-text-muted text-xs"></i>
          </li>
        ))}
      </ul>
    </div>
  );
};
