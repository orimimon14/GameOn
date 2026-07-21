import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// ADR-046 — pick a time for a game-session proposal: two one-tap presets
// (tonight / tomorrow night at 21:00) or a custom date-time.
const at2100 = (daysFromNow: number): number => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(21, 0, 0, 0);
  return date.getTime();
};

// datetime-local wants a LOCAL "YYYY-MM-DDTHH:mm" string
const toLocalInputValue = (ms: number): string => {
  const d = new Date(ms - new Date().getTimezoneOffset() * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

interface ScheduleGameSheetProps {
  onSend: (sessionAtMs: number) => Promise<void>;
  onClose: () => void;
}

export const ScheduleGameSheet: React.FC<ScheduleGameSheetProps> = ({ onSend, onClose }) => {
  const { t } = useTranslation();
  const [customValue, setCustomValue] = useState(() => toLocalInputValue(at2100(0)));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const send = async (sessionAtMs: number) => {
    if (sending) return;
    setSending(true);
    setError(false);
    try {
      await onSend(sessionAtMs);
      onClose();
    } catch {
      setError(true);
      setSending(false);
    }
  };

  // lazy init — clock reads are impure in render (react-compiler)
  const [{ tonight, tonightPassed }] = useState(() => {
    const tonightMs = at2100(0);
    return { tonight: tonightMs, tonightPassed: tonightMs - Date.now() < 10 * 60 * 1000 };
  });

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      role="dialog"
      aria-label={t('chat.session.sheetTitle')}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-surface border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(24px+var(--safe-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black italic uppercase dark:text-white text-text-inverse mb-1 text-center">
          🗓️ {t('chat.session.sheetTitle')}
        </h3>
        <p className="text-text-muted text-sm font-bold text-center mb-6">{t('chat.session.sheetHint')}</p>

        <div className="flex flex-col gap-3">
          {!tonightPassed && (
            <button
              onClick={() => void send(tonight)}
              disabled={sending}
              className="w-full py-3.5 rounded-2xl bg-primary/15 border border-primary/40 text-primary font-black hover:bg-primary/25 transition-colors disabled:opacity-50"
            >
              {t('chat.session.tonight')}
            </button>
          )}
          <button
            onClick={() => void send(at2100(1))}
            disabled={sending}
            className="w-full py-3.5 rounded-2xl bg-primary/15 border border-primary/40 text-primary font-black hover:bg-primary/25 transition-colors disabled:opacity-50"
          >
            {t('chat.session.tomorrow')}
          </button>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="datetime-local"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 min-w-0 bg-background border border-white/10 rounded-xl px-3 py-3 text-text font-bold"
              dir="ltr"
              aria-label={t('chat.session.customLabel')}
            />
            <button
              onClick={() => {
                const ms = new Date(customValue).getTime();
                if (Number.isFinite(ms)) void send(ms);
              }}
              disabled={sending}
              className="shrink-0 px-5 py-3 rounded-xl bg-primary text-white font-black uppercase italic disabled:opacity-50"
            >
              {sending ? '…' : t('chat.session.send')}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-danger text-sm font-bold text-center">
              {t('chat.session.sendError')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
