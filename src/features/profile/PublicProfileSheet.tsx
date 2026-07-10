import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loadGameCatalog } from '@/shared/api/gameCatalog';
import { useLabels } from '@/shared/labels';
import type { GameCatalogDocument, PublicProfileDocument } from '@/shared/models';

// Full-profile sheet for ANOTHER player — opened from the deck, likes grid
// and chat. Renders only public read-model data (publicProfiles): media
// gallery, bio, level, platforms and games (rank is known for the primary
// game only — per-game details are private).
interface PublicProfileSheetProps {
  profile: PublicProfileDocument;
  onClose: () => void;
}

// Module-level cache: the catalog is static per session and the sheet opens often.
let catalogCache: GameCatalogDocument[] | null = null;

export const PublicProfileSheet: React.FC<PublicProfileSheetProps> = ({ profile, onClose }) => {
  const { t } = useTranslation();
  const labels = useLabels();
  const [catalog, setCatalog] = useState<GameCatalogDocument[]>(catalogCache ?? []);

  useEffect(() => {
    if (catalogCache) return;
    let cancelled = false;
    loadGameCatalog().then(
      (games) => {
        catalogCache = games;
        if (!cancelled) setCatalog(games);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const media = [
    ...(profile.profileImageUrl
      ? [{ id: 'main', type: 'image' as const, url: profile.profileImageUrl }]
      : []),
    ...(profile.galleryMedia ?? []),
  ];

  const gameName = (gameId: string) => catalog.find((g) => g.gameId === gameId)?.name ?? gameId;

  return (
    <div
      role="dialog"
      aria-label={profile.displayName}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] bg-background border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* media strip */}
        <div className="relative">
          {media.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar" dir="ltr">
              {media.map((item) => (
                <div key={item.id} className="w-full shrink-0 snap-center aspect-[4/5] bg-black">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[4/5] bg-gradient-to-br from-primary/60 via-surface to-background flex items-center justify-center">
              <span className="text-8xl font-black text-white/80">{profile.displayName.charAt(0)}</span>
            </div>
          )}
          {media.length > 1 && (
            <p className="absolute bottom-3 inset-x-0 text-center text-white/90 text-[11px] font-bold pointer-events-none drop-shadow">
              <i className="fa-solid fa-images me-1.5"></i>
              {t('publicProfile.swipeMedia', { count: media.length })}
            </p>
          )}
          <button
            onClick={onClose}
            aria-label={t('publicProfile.close')}
            className="absolute top-4 end-4 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 text-end">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-text flex items-center justify-end gap-2">
              {profile.verifiedBadge && (
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center shrink-0" title="Pro">
                  <i className="fa-solid fa-check"></i>
                </span>
              )}
              <span>
                {profile.displayName}, {profile.age}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2 justify-end mt-3">
              <span className="px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase">
                <i className="fa-solid fa-trophy me-1.5 text-yellow-400"></i>
                {labels.skillLevel[profile.skillLevel]}
              </span>
              {profile.platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-text-muted text-xs font-bold"
                >
                  {labels.platform[platform]}
                </span>
              ))}
            </div>
          </div>

          {profile.bio && <p className="text-text-muted leading-relaxed">{profile.bio}</p>}

          {profile.gameIds.length > 0 && (
            <div>
              <h3 className="text-lg font-black italic uppercase text-text mb-2">
                {t('publicProfile.games')}
              </h3>
              <div className="flex flex-col gap-2">
                {profile.gameIds.map((gameId) => (
                  <div
                    key={gameId}
                    className="bg-surface/60 rounded-2xl border border-white/10 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    {gameId === profile.primaryGameId && profile.primaryRank ? (
                      <span className="px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-black shrink-0">
                        {profile.primaryRank}
                      </span>
                    ) : (
                      <span />
                    )}
                    <p className="text-text font-bold">{gameName(gameId)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
