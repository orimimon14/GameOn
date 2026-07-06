import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loadGameCatalog } from '@/shared/api/gameCatalog';
import type { GameCatalogDocument } from '@/shared/models';

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

  useEffect(() => {
    let cancelled = false;
    loadGameCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setGames(catalog);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
      <div className="text-right mb-12">
        <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter mb-2">{t('games.title')}</h2>
        <p className="dark:text-text-muted text-gray-500 font-bold">{t('games.subtitle')}</p>
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

      {status === 'ready' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <button
              key={game.gameId}
              onClick={() => onSelectGame(game.gameId)}
              className="group relative h-64 rounded-[32px] overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 shadow-2xl active:scale-95"
            >
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} via-surface to-background`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

              <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
                <h3 className="text-2xl font-black text-white italic uppercase drop-shadow-lg">{game.name}</h3>

                <div className="mt-4 flex items-center justify-end gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-bold text-primary uppercase italic">{t('games.showPlayers')}</span>
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-glow">
                    <i className="fa-solid fa-arrow-left text-[10px]"></i>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-16 bg-white/5 border border-dashed border-white/10 rounded-[32px] p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-plus text-2xl text-text-muted"></i>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('games.missingTitle')}</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">{t('games.missingHint')}</p>
        <button className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all">
          {t('games.suggest')}
        </button>
      </div>
    </div>
  );
};
