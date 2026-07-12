import { AnimatePresence } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { loadDeck, loadMyActiveGameIds, sortByLevelCloseness, submitSwipe } from './discoveryApi';
import { MatchCelebration } from './MatchCelebration';
import { SwipeActions } from './SwipeActions';
import { SwipeCard } from './SwipeCard';

import { PublicProfileSheet } from '@/features/profile/PublicProfileSheet';
import { loadGameCatalog, loadGamePlayerCounts } from '@/shared/api/gameCatalog';
import { SKILL_LEVELS, type SkillLevel, type SwipeDirection } from '@/shared/enums';
import { useLabels } from '@/shared/labels';
import type { GameCatalogDocument, PublicProfileDocument } from '@/shared/models';
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
  const labels = useLabels();

  const uid = useUserStore((s) => s.userDoc?.uid);
  const mySkill = useUserStore((s) => s.userDoc?.skillLevel);
  const selectedGame = useUiStore((s) => s.selectedGame);
  const setSelectedGame = useUiStore((s) => s.setSelectedGame);
  // Level filter: 'all' shows everyone sorted by closeness to MY level;
  // a specific level hard-filters the deck.
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'all'>('all');

  const [status, setStatus] = useState<DeckStatus>('loading');
  const [gameId, setGameId] = useState<string | null>(null);
  const [deck, setDeck] = useState<PublicProfileDocument[]>([]);
  const [index, setIndex] = useState(0);
  const [swipeError, setSwipeError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [matchedWith, setMatchedWith] = useState<PublicProfileDocument | null>(null);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [viewingProfile, setViewingProfile] = useState<PublicProfileDocument | null>(null);
  // Empty-deck rescue: games that DO have players right now (small community
  // spreads thin across decks — never leave the user at a dead end).
  const [gameSuggestions, setGameSuggestions] = useState<
    Array<{ game: GameCatalogDocument; count: number }> | null
  >(null);

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
        setDeck(
          sortByLevelCloseness(
            levelFilter === 'all' ? cards : cards.filter((c) => c.skillLevel === levelFilter),
            mySkill,
          ),
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mySkill changes only with the user doc
  }, [uid, selectedGame, reloadToken, levelFilter]);

  const refreshDeck = useCallback(() => {
    setStatus('loading');
    setReloadToken((token) => token + 1);
  }, []);

  const currentProfile = deck[index];

  const deckIsEmpty = status === 'ready' && !currentProfile;
  useEffect(() => {
    if (!deckIsEmpty || gameSuggestions !== null) return;
    let cancelled = false;
    void loadGameCatalog()
      .then(async (catalog) => {
        const counts = await loadGamePlayerCounts(catalog.map((g) => g.gameId));
        if (cancelled) return;
        setGameSuggestions(
          catalog
            .filter((g) => g.gameId !== gameId && (counts[g.gameId] ?? 0) > 0)
            .map((game) => ({ game, count: counts[game.gameId] ?? 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3),
        );
      })
      .catch(() => !cancelled && setGameSuggestions([]));
    return () => {
      cancelled = true;
    };
  }, [deckIsEmpty, gameSuggestions, gameId]);

  const levelChips = (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('discovery.levelFilter')}>
      <button
        onClick={() => setLevelFilter('all')}
        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase italic transition-all ${levelFilter === 'all' ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface/70 text-text-muted border border-white/10 hover:bg-surface-elevated'}`}
      >
        {t('discovery.levelAll')}
      </button>
      {mySkill && (
        <button
          onClick={() => setLevelFilter(mySkill)}
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase italic transition-all ${levelFilter === mySkill ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface/70 text-premium border border-premium/30 hover:bg-surface-elevated'}`}
        >
          ⭐ {t('discovery.levelMine')}
        </button>
      )}
      {SKILL_LEVELS.filter((level) => level !== mySkill).map((level) => (
        <button
          key={level}
          onClick={() => setLevelFilter(level)}
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase italic transition-all ${levelFilter === level ? 'bg-primary text-white shadow-glow-primary' : 'bg-surface/70 text-text-muted border border-white/10 hover:bg-surface-elevated'}`}
        >
          {labels.skillLevel[level]}
        </button>
      ))}
    </div>
  );

  // Optimistic swipe: the card flies away IMMEDIATELY and the backend call
  // runs in the background (it is idempotent server-side). A match pops the
  // celebration when the answer arrives; the daily-limit and error states
  // surface a card or two later — worth it, likes feel instant.
  const handleSwipe = (direction: SwipeDirection) => {
    if (!currentProfile || !gameId) return;
    const swiped = currentProfile;
    setSwipeError(false);
    setExitDirection(direction);
    setIndex((prev) => prev + 1);
    void submitSwipe({ targetUid: swiped.uid, gameId, direction })
      .then((outcome) => {
        if (outcome.result === 'matched') setMatchedWith(swiped);
      })
      .catch((error) => {
        if (isCallableError(error, 'resource-exhausted')) {
          setLimitReached(true);
        } else {
          setSwipeError(true);
        }
      });
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
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <div className="mb-8">{levelChips}</div>
        <div className="opacity-70 flex flex-col items-center">
          <i className="fa-solid fa-ghost text-7xl mb-6 dark:text-white text-text-inverse"></i>
          <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('discovery.empty')}</h3>
          <p className="font-bold dark:text-text-muted text-gray-500 mb-6">
            {levelFilter === 'all' ? t('discovery.emptyHint') : t('discovery.emptyLevelHint')}
          </p>
          <button
            onClick={refreshDeck}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
          >
            {t('discovery.refresh')}
          </button>
        </div>

        {gameSuggestions && gameSuggestions.length > 0 && (
          <div className="mt-10 w-full max-w-md">
            <p className="dark:text-white text-text-inverse font-black italic uppercase text-sm mb-4">
              {t('discovery.tryOtherGames')}
            </p>
            <div className="flex flex-col gap-3">
              {gameSuggestions.map(({ game, count }) => (
                <button
                  key={game.gameId}
                  onClick={() => {
                    setGameSuggestions(null);
                    setSelectedGame(game.gameId);
                  }}
                  className="relative h-20 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-primary transition-all active:scale-95 group"
                >
                  {game.coverUrl ? (
                    <img src={game.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-surface to-background" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/50 to-black/20" />
                  <div className="absolute inset-0 px-5 flex items-center justify-between">
                    <span className="text-white/90 text-xs font-bold">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 me-1.5 align-middle"></span>
                      {t('games.playersCount', { count })}
                    </span>
                    <span className="text-white font-black italic uppercase drop-shadow">{game.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6 pt-20 relative z-10">
      {levelChips}
      {matchedWith && (
        <MatchCelebration
          name={matchedWith.displayName}
          imageUrl={matchedWith.profileImageUrl}
          onOpenChat={() => navigate('/chat')}
          onKeepSwiping={() => setMatchedWith(null)}
        />
      )}

      {viewingProfile && (
        <PublicProfileSheet profile={viewingProfile} onClose={() => setViewingProfile(null)} />
      )}

      <div className="relative w-full max-w-md aspect-[3/4.5] flex-shrink min-h-0">
        <AnimatePresence initial={false}>
          <SwipeCard
            key={currentProfile.uid}
            profile={currentProfile}
            exitDirection={exitDirection}
            disabled={false}
            onSwipe={handleSwipe}
            onOpenProfile={() => setViewingProfile(currentProfile)}
          />
        </AnimatePresence>
      </div>

      <SwipeActions
        disabled={false}
        showError={swipeError}
        onSwipe={handleSwipe}
      />
    </div>
  );
};
