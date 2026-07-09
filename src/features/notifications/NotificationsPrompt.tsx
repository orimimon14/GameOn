import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pushPermissionState, registerPushDevice, unlockAudio } from './pushApi';

import { useUserStore } from '@/shared/store/userStore';

// Browsers only grant Notification permission from a user gesture, so we ask
// with an in-app banner instead of on page load (which mobile browsers block).
// The same tap unlocks the audio context used for the incoming-call ring.
export const NotificationsPrompt: React.FC = () => {
  const { t } = useTranslation();
  const uid = useUserStore((s) => s.userDoc?.uid);
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'dismissed'>('idle');

  if (!uid || state === 'done' || state === 'dismissed') return null;
  if (pushPermissionState() !== 'default') return null;

  const enable = async () => {
    setState('working');
    unlockAudio();
    try {
      await registerPushDevice(uid);
    } finally {
      setState('done');
    }
  };

  return (
    <div className="fixed bottom-[76px] md:bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-surface/95 backdrop-blur-xl border border-primary/40 rounded-3xl p-4 shadow-glow flex items-center gap-3">
        <button
          onClick={() => setState('dismissed')}
          aria-label={t('notifications.dismiss')}
          className="text-text-muted hover:text-white shrink-0"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <p className="flex-1 text-sm font-bold dark:text-white text-text-inverse text-right">
          {t('notifications.promptText')}
        </p>
        <button
          onClick={() => void enable()}
          disabled={state === 'working'}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-glow hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <i className="fa-solid fa-bell"></i>
          {t('notifications.enable')}
        </button>
      </div>
    </div>
  );
};
