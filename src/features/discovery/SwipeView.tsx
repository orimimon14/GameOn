import { AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { loadDeck, loadMyActiveGameIds, submitSwipe } from './discoveryApi';
import { MatchCelebration } from './MatchCelebration';
import { SwipeActions } from './SwipeActions';
import { SwipeCard } from './SwipeCard';

import type { SwipeDirection } from '@/shared/enums';
import type { PublicProfileDocument } from '@/shared/models';
import { useUiStore } from '@/shared/store/uiStore';
import { useUserStore } from '@/shared/store/userStore';

// P3-T04 — the real discovery deck: publicProfiles query + submitSwipe
// callable, rendered as SwipeCard/SwipeHud/SwipeActions with Framer Motion.
type DeckStatus = 'loading' | 'ready' | 'no-game' | 'error';

const isCallableError = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === `functions/${code}`;

export const SwipeView: React.FC = () => {
  const { t } = useTranslation();
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
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);

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

  const handleSwipe = async (direction: SwipeDirection) => {
    if (pending || !currentProfile || !gameId) return;
    setPending(true);
    setSwipeError(false);
    setExitDirection(direction);
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
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6 relative z-10">
      {matchedWith && (
        <MatchCelebration
          name={matchedWith.displayName}
          imageUrl={matchedWith.profileImageUrl}
          onOpenChat={() => navigate('/chat')}
          onKeepSwiping={() => setMatchedWith(null)}
        />
      )}

      <div className="relative w-full max-w-md aspect-[3/4.5] flex-shrink min-h-0">
        <AnimatePresence initial={false}>
          <SwipeCard
            key={currentProfile.uid}
            profile={currentProfile}
            exitDirection={exitDirection}
            disabled={pending}
            onSwipe={(direction) => void handleSwipe(direction)}
          />
        </AnimatePresence>
      </div>

      <SwipeActions
        disabled={pending}
        showError={swipeError}
        onSwipe={(direction) => void handleSwipe(direction)}
      />
    </div>
  );
};
