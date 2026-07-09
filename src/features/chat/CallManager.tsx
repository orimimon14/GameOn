import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CallOverlay } from './CallOverlay';
import { answerCall, declineCall, subscribeIncomingCalls } from './callService';
import { useCallStore } from './callStore';

import { getFirebase } from '@/config/firebase';
import { stopRing } from '@/features/notifications/pushApi';
import type { CallDocument, PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// App-level call host: the active-call overlay and the incoming-call banner
// live here (mounted in the app shell), so navigating between screens never
// tears a live call down.
export const CallManager: React.FC = () => {
  const { t } = useTranslation();
  const uid = useUserStore((s) => s.userDoc?.uid);
  const activeCall = useCallStore((s) => s.activeCall);
  const partnerName = useCallStore((s) => s.partnerName);
  const setActiveCall = useCallStore((s) => s.setActiveCall);

  const [incomingCall, setIncomingCall] = useState<CallDocument | null>(null);
  const [callerName, setCallerName] = useState('');

  useEffect(() => {
    if (!uid || activeCall) return;
    return subscribeIncomingCalls(uid, setIncomingCall);
  }, [uid, activeCall]);

  useEffect(() => {
    let cancelled = false;
    if (!incomingCall) return;
    const { db } = getFirebase();
    void getDoc(doc(db, 'publicProfiles', incomingCall.callerUid))
      .then((snap) => {
        if (!cancelled) {
          setCallerName((snap.data() as PublicProfileDocument | undefined)?.displayName ?? '');
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [incomingCall]);

  const handleAnswer = async () => {
    if (!incomingCall) return;
    stopRing();
    try {
      const call = await answerCall(incomingCall, () => setActiveCall(null));
      setIncomingCall(null);
      setActiveCall(call, callerName);
    } catch {
      setIncomingCall(null);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    stopRing();
    try {
      await declineCall(incomingCall);
    } finally {
      setIncomingCall(null);
      setCallerName('');
    }
  };

  const handleHangUp = async () => {
    if (!activeCall) return;
    try {
      await activeCall.hangUp();
    } finally {
      setActiveCall(null);
    }
  };

  return (
    <>
      {activeCall && (
        <CallOverlay call={activeCall} partnerName={partnerName} onHangUp={() => void handleHangUp()} />
      )}

      {incomingCall && !activeCall && (
        <div
          role="dialog"
          aria-label={t('chat.call.incomingTitle')}
          className="fixed top-6 inset-x-0 z-50 flex justify-center px-6"
        >
          <div className="w-full max-w-md bg-surface/95 backdrop-blur-xl border border-primary/40 rounded-3xl p-5 shadow-glow flex items-center gap-4">
            <div className="flex-1 text-right">
              <h4 className="text-white font-black text-lg">{callerName || t('chat.call.unknownCaller')}</h4>
              <p className="text-text-muted text-sm font-bold">
                {t(incomingCall.type === 'video' ? 'chat.call.incomingVideo' : 'chat.call.incomingVoice')}
              </p>
            </div>
            <button
              onClick={() => void handleAnswer()}
              aria-label={t('chat.call.accept')}
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-lg hover:scale-105 transition-all"
            >
              <i className="fa-solid fa-phone"></i>
            </button>
            <button
              onClick={() => void handleDecline()}
              aria-label={t('chat.call.decline')}
              className="w-12 h-12 rounded-full bg-danger text-white flex items-center justify-center text-lg hover:scale-105 transition-all"
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
