import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { submitSwipe } from '@/features/discovery/discoveryApi';
import { MatchCelebration } from '@/features/discovery/MatchCelebration';
import { loadLikesYou, type InboundLike } from '@/features/matches/likesApi';
import { PublicProfileSheet } from '@/features/profile/PublicProfileSheet';
import type { PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// P3-T06 (ADR-033) — Likes You, open to all users in MVP. Inbound likes come
// from likesApi; liking back goes through submitSwipe, so a match here is
// backend-confirmed exactly like in the deck.
type LikesStatus = 'loading' | 'ready' | 'error';

const isCallableError = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === `functions/${code}`;

export const LikesGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uid = useUserStore((s) => s.userDoc?.uid);

  const [status, setStatus] = useState<LikesStatus>('loading');
  const [likes, setLikes] = useState<InboundLike[]>([]);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [likeBackError, setLikeBackError] = useState<'generic' | 'unavailable' | null>(null);
  const [matchedWith, setMatchedWith] = useState<PublicProfileDocument | null>(null);
  const [viewingProfile, setViewingProfile] = useState<PublicProfileDocument | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const load = async () => {
      try {
        const inbound = await loadLikesYou(uid);
        if (cancelled) return;
        setLikes(inbound);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [uid, reloadToken]);

  const refresh = useCallback(() => {
    setStatus('loading');
    setLikeBackError(null);
    setReloadToken((token) => token + 1);
  }, []);

  const handleLikeBack = async (like: InboundLike) => {
    if (pendingUid) return;
    setPendingUid(like.profile.uid);
    setLikeBackError(null);
    try {
      const outcome = await submitSwipe({
        targetUid: like.profile.uid,
        gameId: like.gameId,
        direction: 'like',
      });
      setLikes((prev) => prev.filter((entry) => entry.profile.uid !== like.profile.uid));
      if (outcome.result === 'matched') {
        setMatchedWith(like.profile);
      }
    } catch (error) {
      // failed-precondition is permanent for this like (liker no longer plays
      // the game / not discoverable — API_CONTRACT §3.1), so drop the card.
      if (isCallableError(error, 'failed-precondition') || isCallableError(error, 'not-found')) {
        setLikes((prev) => prev.filter((entry) => entry.profile.uid !== like.profile.uid));
        setLikeBackError('unavailable');
      } else {
        setLikeBackError('generic');
      }
    } finally {
      setPendingUid(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full relative z-10">
        <div
          role="status"
          aria-label={t('likes.loading')}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-triangle-exclamation text-7xl mb-6 text-danger"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('likes.error')}</h3>
        <button
          onClick={refresh}
          className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
        >
          {t('likes.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 pt-24 pb-32 overflow-y-auto h-full max-w-6xl mx-auto relative z-10 no-scrollbar">
      {viewingProfile && (
        <PublicProfileSheet profile={viewingProfile} onClose={() => setViewingProfile(null)} />
      )}

      {matchedWith && (
        <MatchCelebration
          name={matchedWith.displayName}
          imageUrl={matchedWith.profileImageUrl}
          onOpenChat={() => navigate('/chat')}
          onKeepSwiping={() => setMatchedWith(null)}
        />
      )}

      <div className="text-right mb-8">
        <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter">
          {t('likes.title')}
        </h2>
        <p className="dark:text-text-muted text-gray-500 font-bold">{t('likes.subtitle')}</p>
      </div>

      {likeBackError && (
        <p role="alert" className="text-danger font-bold text-sm mb-4 text-center">
          {t(likeBackError === 'unavailable' ? 'likes.likeUnavailable' : 'likes.likeBackError')}
        </p>
      )}

      {likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <i className="fa-solid fa-heart-crack text-7xl mb-4"></i>
          <p className="text-xl font-bold italic uppercase">{t('likes.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {likes.map(({ profile, gameId }) => (
            <div
              key={profile.uid}
              className="group relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-soft hover:scale-[1.03] transition-all duration-300 border-2 border-transparent hover:border-primary/40"
            >
              <button
                onClick={() => setViewingProfile(profile)}
                aria-label={profile.displayName}
                className="absolute inset-0 w-full h-full"
              >
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/60 via-surface to-background flex items-center justify-center">
                    <span className="text-6xl font-black text-white/80">{profile.displayName.charAt(0)}</span>
                  </div>
                )}
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

              <div className="absolute inset-0 flex flex-col justify-end p-4 text-right">
                <h3 className="text-white font-black text-xl italic uppercase mb-3 flex items-center justify-end gap-1.5">
                  {profile.verifiedBadge && (
                    <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[8px] flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-check"></i>
                    </span>
                  )}
                  <span>{profile.displayName}, {profile.age}</span>
                </h3>
                <button
                  onClick={() => void handleLikeBack({ profile, gameId })}
                  disabled={pendingUid !== null}
                  aria-label={t('likes.likeBack')}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary text-white text-xs font-black rounded-xl shadow-glow hover:scale-105 transition-transform uppercase italic disabled:opacity-50"
                >
                  <i className="fa-solid fa-heart"></i>
                  {t('likes.likeBack')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
