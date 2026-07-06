import React from 'react';
import { useTranslation } from 'react-i18next';

import type { SwipeDirection } from '@/shared/enums';

// P3-T04 — skip/like actions. Rendered once, outside the animated card, so
// the buttons never duplicate while an exit animation is in flight.
interface SwipeActionsProps {
  disabled: boolean;
  showError: boolean;
  onSwipe: (direction: SwipeDirection) => void;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({ disabled, showError, onSwipe }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md">
      {showError && (
        <p role="alert" className="text-danger font-bold text-sm mb-4 text-center">
          {t('discovery.swipeError')}
        </p>
      )}

      <div className="flex justify-between gap-4">
        <button
          onClick={() => onSwipe('skip')}
          disabled={disabled}
          aria-label="skip"
          className="flex-1 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-2xl hover:bg-danger hover:text-white transition-all active:scale-95 shadow-lg disabled:opacity-50"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <button
          onClick={() => onSwipe('like')}
          disabled={disabled}
          aria-label="like"
          className="flex-1 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl hover:scale-105 transition-all active:scale-95 shadow-glow disabled:opacity-50"
        >
          <i className="fa-solid fa-check"></i>
        </button>
      </div>
    </div>
  );
};
