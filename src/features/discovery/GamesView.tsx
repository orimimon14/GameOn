import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loadMyGames } from '@/features/profile/profileApi';
import { loadGameCatalog, loadGamePlayerCounts, suggestGame } from '@/shared/api/gameCatalog';
import type { GameCatalogDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// Game picker backed by the real gameCatalog collection (ADR-019).
// Selecting a game sets the discovery deck filter (uiStore.selectedGame = gameId).
interface GamesViewProps {
  onSelectGame: (gameId: string) => void;
}

const CARD_GRADIENTS = [
  'from-orange-600/70',
  'from-blue-700/70',
  'from-green-700/70',
  'from-red-700/70',
  'from-indigo-700/70',
  'from-sky-800/70',
];

export const GamesView: React.FC<GamesViewProps> = ({ onSelectGame }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameCatalogDocument[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const uid = useUserStore((s) => s.userDoc?.uid);
  // Live player count per game + the user's own games pinned first.
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [myGameIds, setMyGameIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  // ADR-043 — "can't find your game?" submits a real suggestion.
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestState, setSuggestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onSuggest = async () => {
    const name = suggestion.trim();
    if (!name || !uid || suggestState === 'sending') return;
    setSuggestState('sending');
    try {
      await suggestGame(uid, name);
      setSuggestState('sent');
      setSuggestion('');
    } catch {
      setSuggestState('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadGameCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setGames(catalog);
        setStatus('ready');
        void loadGamePlayerCounts(catalog.map((g) => g.gameId)).then((counts) => {
          if (!cancelled) setPlayerCounts(counts);
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void loadMyGames(uid).then(
      (mine) => !cancelled && setMyGameIds(new Set(mine.map((g) => g.gameId))),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Order: your games → featured → most players → name; search filters by name.
  const visibleGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const mineDiff = Number(myGameIds.has(b.gameId)) - Number(myGameIds.has(a.gameId));
        if (mineDiff) return mineDiff;
        const featuredDiff = Number(b.isFeatured) - Number(a.isFeatured);
        if (featuredDiff) return featuredDiff;
        const countDiff = (playerCounts[b.gameId] ?? 0) - (playerCounts[a.gameId] ?? 0);
        if (countDiff) return countDiff;
        return a.name.localeCompare(b.name);
      });
  }, [games, search, myGameIds, playerCounts]);

  return (
    <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
      <div className="text-right mb-8">
        <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter mb-2">{t('games.title')}</h2>
        <p className="dark:text-text-muted text-gray-500 font-bold">{t('games.subtitle')}</p>
      </div>

      <div className="relative mb-8">
        <i className="fa-solid fa-magnifying-glass absolute start-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"></i>
        <input
          aria-label={t('games.search')}
          placeholder={t('games.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface/80 backdrop-blur border border-white/10 rounded-full ps-12 pe-5 py-4 text-text font-bold focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-24">
          <div
            role="status"
            aria-label={t('games.loading')}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
          />
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-24">
          <p className="text-danger font-bold">{t('games.error')}</p>
        </div>
      )}

      {status === 'ready' && visibleGames.length === 0 && (
        <div className="text-center py-16 opacity-60">
          <i className="fa-solid fa-ghost text-5xl mb-4 text-text-muted"></i>
          <p className="dark:text-white text-text-inverse font-bold">{t('games.noResults')}</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {visibleGames.map((game, index) => {
            const count = playerCounts[game.gameId] ?? 0;
            const isMine = myGameIds.has(game.gameId);
            return (
              <button
                key={game.gameId}
                onClick={() => onSelectGame(game.gameId)}
                className="group relative h-40 sm:h-64 rounded-3xl sm:rounded-[32px] overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 shadow-2xl active:scale-95"
              >
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt={game.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} via-surface to-background`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10"></div>

                <div className="absolute top-2.5 start-2.5 flex flex-col items-start gap-1.5">
                  {isMine && (
                    <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase italic shadow-glow">
                      <i className="fa-solid fa-gamepad me-1"></i>
                      {t('games.yourGame')}
                    </span>
                  )}
                  {!isMine && game.isFeatured && (
                    <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-amber-400 text-[10px] font-black uppercase italic">
                      🔥 {t('games.hot')}
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-end text-right">
                  <h3 className="text-base sm:text-2xl font-black text-white italic uppercase drop-shadow-lg leading-tight">{game.name}</h3>
                  {count > 0 && (
                    <p className="text-white/80 text-[11px] sm:text-sm font-bold mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 me-1.5 align-middle"></span>
                      {t('games.playersCount', { count })}
                    </p>
                  )}

                  <div className="mt-3 hidden sm:flex items-center justify-end gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-xs font-bold text-primary uppercase italic">{t('games.showPlayers')}</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-glow">
                      <i className="fa-solid fa-arrow-left text-[10px]"></i>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-16 bg-white/5 border border-dashed border-white/10 rounded-[32px] p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-plus text-2xl text-text-muted"></i>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('games.missingTitle')}</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">{t('games.missingHint')}</p>
        {suggestState === 'sent' ? (
          <p className="mt-6 text-green-400 font-bold">
            <i className="fa-solid fa-check me-2"></i>
            {t('games.suggestSent')}
          </p>
        ) : suggestOpen ? (
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center items-center">
            <input
              aria-label={t('games.suggestPlaceholder')}
              placeholder={t('games.suggestPlaceholder')}
              value={suggestion}
              maxLength={60}
              onChange={(e) => setSuggestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void onSuggest()}
              className="w-full sm:w-72 bg-surface border border-white/10 rounded-full px-5 py-3 text-text focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <button
              onClick={() => void onSuggest()}
              disabled={!suggestion.trim() || suggestState === 'sending'}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {suggestState === 'sending' ? '…' : t('games.suggestSend')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSuggestOpen(true)}
            className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
          >
            {t('games.suggest')}
          </button>
        )}
        {suggestState === 'error' && (
          <p role="alert" className="mt-3 text-danger text-sm font-bold">{t('games.suggestError')}</p>
        )}
      </div>
    </div>
  );
};
