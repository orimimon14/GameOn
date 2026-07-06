import React from 'react';
import { useTranslation } from 'react-i18next';

// P3-T05 — full-screen overlay shown when submitSwipe returns "matched".
interface MatchCelebrationProps {
  name: string;
  imageUrl?: string;
  onOpenChat: () => void;
  onKeepSwiping: () => void;
}

export const MatchCelebration: React.FC<MatchCelebrationProps> = ({
  name,
  imageUrl,
  onOpenChat,
  onKeepSwiping,
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="dialog"
      aria-label={t('discovery.match.title')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
    >
      <div className="w-full max-w-sm text-center bg-surface/60 border border-primary/40 rounded-[40px] p-10 shadow-glow animate-[pulse_1.5s_ease-in-out_1]">
        <div className="text-6xl mb-4">🎉</div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary shadow-glow"
          />
        )}
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
          {t('discovery.match.title')}
        </h2>
        <p className="text-text-muted font-bold mb-8">{t('discovery.match.subtitle', { name })}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onOpenChat}
            className="h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-wide hover:scale-105 transition-all active:scale-95 shadow-glow"
          >
            {t('discovery.match.openChat')}
          </button>
          <button
            onClick={onKeepSwiping}
            className="h-14 rounded-2xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all active:scale-95"
          >
            {t('discovery.match.keepSwiping')}
          </button>
        </div>
      </div>
    </div>
  );
};
