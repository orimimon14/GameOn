import React from 'react';
import { useTranslation } from 'react-i18next';

import { useLabels } from '@/shared/labels';
import type { PublicProfileDocument } from '@/shared/models';

// P3-T04 — top-of-card HUD: skill level + current rank.
interface SwipeHudProps {
  profile: PublicProfileDocument;
}

export const SwipeHud: React.FC<SwipeHudProps> = ({ profile }) => {
  const { t } = useTranslation();
  const labels = useLabels();

  return (
    <div className="absolute top-0 left-0 right-0 z-20 p-4">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('discovery.skillLevel')}</span>
          <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-1.5">
            <i className="fa-solid fa-trophy text-yellow-400 text-[8px]"></i>
            <span>{labels.skillLevel[profile.skillLevel]}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('discovery.rank')}</span>
          <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[13px] font-black text-primary uppercase tracking-tighter flex items-center gap-2 shadow-glow">
            <i className="fa-solid fa-ranking-star"></i>
            <span>{profile.primaryRank ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
