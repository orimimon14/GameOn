import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// One-time how-it-works overlay for the first visit to the deck. Local flag —
// worst case after a reinstall the user sees three tips again for 5 seconds.
const TIPS_SEEN_KEY = 'swish_discover_tips_seen';

export const shouldShowFirstRunTips = (): boolean => {
  try {
    return localStorage.getItem(TIPS_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
};

const TIPS = [
  { icon: 'fa-heart', color: 'text-green-400', key: 'like' },
  { icon: 'fa-xmark', color: 'text-red-400', key: 'skip' },
  { icon: 'fa-filter', color: 'text-premium', key: 'filter' },
  { icon: 'fa-comments', color: 'text-primary', key: 'match' },
] as const;

export const FirstRunTips: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(shouldShowFirstRunTips);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(TIPS_SEEN_KEY, '1');
    } catch {
      // storage unavailable — the overlay simply won't persist its dismissal
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" role="dialog" aria-label={t('discovery.tips.title')}>
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-7 text-center animate-pop">
        <div className="text-5xl mb-3">🎮</div>
        <h2 className="text-2xl font-black italic uppercase dark:text-white text-text-inverse mb-1">
          {t('discovery.tips.title')}
        </h2>
        <p className="text-text-muted text-sm font-bold mb-6">{t('discovery.tips.subtitle')}</p>
        <div className="flex flex-col gap-4 text-right mb-7">
          {TIPS.map(({ icon, color, key }) => (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
                <i className={`fa-solid ${icon}`}></i>
              </div>
              <p className="dark:text-gray-200 text-text-inverse font-bold text-sm leading-snug">
                {t(`discovery.tips.${key}`)}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={dismiss}
          className="w-full py-3.5 bg-primary text-white rounded-full font-black uppercase italic tracking-wide hover:scale-[1.02] transition-all active:scale-95 shadow-glow"
        >
          {t('discovery.tips.cta')}
        </button>
      </div>
    </div>
  );
};
