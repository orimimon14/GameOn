import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { loadDeck, loadMyActiveGameIds, submitSwipe } from './discoveryApi';
import { MatchCelebration } from './MatchCelebration';

import { useLabels } from '@/shared/labels';
import type { PublicProfileDocument } from '@/shared/models';
import { useUiStore } from '@/shared/store/uiStore';
import { useUserStore } from '@/shared/store/userStore';

// P3-T04 — the real discovery deck: publicProfiles query + submitSwipe callable.
type DeckStatus = 'loading' | 'ready' | 'no-game' | 'error';

const isCallableError = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === `functions/${code}`;

export const SwipeView: React.FC = () => {
  const { t } = useTranslation();
  const labels = useLabels();
  const navigate = useNavigate();

  const uid = useUserStore((s) => s.userDoc?.uid);
  const selectedGame = useUiStore((s) => s.selectedGame);

  const [status, setStatus] = useState<DeckStatus>('loading');
  const [gameId, setGameId] = useState<string | null>(null);
  const [deck, setDeck] = useState<PublicProfileDocument[]>([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [swipeError, setSwipeError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [matchedWith, setMatchedWith] = useState<PublicProfileDocument | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const load = async () => {
      try {
        // Deck game: the picker selection, else the user's first active game.
        const resolvedGameId = selectedGame ?? (await loadMyActiveGameIds(uid))[0] ?? null;
        if (cancelled) return;
        if (!resolvedGameId) {
          setStatus('no-game');
          return;
        }
        const cards = await loadDeck(uid, resolvedGameId);
        if (cancelled) return;
        setGameId(resolvedGameId);
        setDeck(cards);
        setIndex(0);
        setSwipeError(false);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [uid, selectedGame, reloadToken]);

  const refreshDeck = useCallback(() => {
    setStatus('loading');
    setReloadToken((token) => token + 1);
  }, []);

  const currentProfile = deck[index];

  const handleSwipe = async (direction: 'like' | 'skip') => {
    if (pending || !currentProfile || !gameId) return;
    setPending(true);
    setSwipeError(false);
    try {
      const outcome = await submitSwipe({
        targetUid: currentProfile.uid,
        gameId,
        direction,
      });
      setIndex((prev) => prev + 1);
      if (outcome.result === 'matched') {
        setMatchedWith(currentProfile);
      }
    } catch (error) {
      if (isCallableError(error, 'resource-exhausted')) {
        setLimitReached(true);
      } else {
        setSwipeError(true);
      }
    } finally {
      setPending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full relative z-10">
        <div
          role="status"
          aria-label={t('discovery.loading')}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (status === 'no-game') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-gamepad text-7xl mb-6 text-primary"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('discovery.noGame')}</h3>
        <p className="font-bold dark:text-text-muted text-gray-500 mb-6">{t('discovery.noGameHint')}</p>
        <button
          onClick={() => navigate('/games')}
          className="px-8 py-3 bg-primary text-white rounded-full font-black uppercase tracking-wide hover:scale-105 transition-all active:scale-95 shadow-glow"
        >
          {t('discovery.chooseGame')}
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-triangle-exclamation text-7xl mb-6 text-danger"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('discovery.error')}</h3>
        <button
          onClick={refreshDeck}
          className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
        >
          {t('discovery.refresh')}
        </button>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-hourglass-end text-7xl mb-6 text-primary"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('discovery.limitTitle')}</h3>
        <p className="font-bold dark:text-text-muted text-gray-500 mb-6">{t('discovery.limitHint')}</p>
        <button
          onClick={() => navigate('/subscriptions')}
          className="px-8 py-3 bg-primary text-white rounded-full font-black uppercase tracking-wide hover:scale-105 transition-all active:scale-95 shadow-glow"
        >
          Pro
        </button>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-70 relative z-10">
        <i className="fa-solid fa-ghost text-7xl mb-6 dark:text-white text-text-inverse"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('discovery.empty')}</h3>
        <p className="font-bold dark:text-text-muted text-gray-500 mb-6">{t('discovery.emptyHint')}</p>
        <button
          onClick={refreshDeck}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
        >
          {t('discovery.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
      {matchedWith && (
        <MatchCelebration
          name={matchedWith.displayName}
          imageUrl={matchedWith.profileImageUrl}
          onOpenChat={() => navigate('/chat')}
          onKeepSwiping={() => setMatchedWith(null)}
        />
      )}

      <div className="relative w-full max-w-md aspect-[3/4.5] rounded-[40px] overflow-hidden shadow-2xl border-2 dark:border-white/10 border-gray-200 group bg-surface/20 backdrop-blur-md">
        {currentProfile.profileImageUrl ? (
          <img
            src={currentProfile.profileImageUrl}
            alt={currentProfile.displayName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/60 via-surface to-background flex items-center justify-center">
            <span className="text-8xl font-black text-white/80">{currentProfile.displayName.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('discovery.skillLevel')}</span>
              <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-yellow-400 text-[8px]"></i>
                <span>{labels.skillLevel[currentProfile.skillLevel]}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('discovery.rank')}</span>
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[13px] font-black text-primary uppercase tracking-tighter flex items-center gap-2 shadow-glow">
                <i className="fa-solid fa-ranking-star"></i>
                <span>{currentProfile.primaryRank ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
            {currentProfile.displayName}, {currentProfile.age}
          </h2>
          <p className="text-white/80 font-bold mb-6 line-clamp-2">{currentProfile.bio}</p>

          <div className="flex flex-wrap gap-2 justify-end mb-8">
            {currentProfile.platforms.map((platform) => (
              <span
                key={platform}
                className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase italic border border-white/10"
              >
                {labels.platform[platform]}
              </span>
            ))}
          </div>

          {swipeError && (
            <p role="alert" className="text-danger font-bold text-sm mb-4 text-center">
              {t('discovery.swipeError')}
            </p>
          )}

          <div className="flex justify-between gap-4">
            <button
              onClick={() => void handleSwipe('skip')}
              disabled={pending}
              aria-label="skip"
              className="flex-1 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-2xl hover:bg-danger hover:text-white transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <button
              onClick={() => void handleSwipe('like')}
              disabled={pending}
              aria-label="like"
              className="flex-1 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl hover:scale-105 transition-all active:scale-95 shadow-glow disabled:opacity-50"
            >
              <i className="fa-solid fa-check"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
