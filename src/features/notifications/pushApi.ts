import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';

import { getFirebase } from '@/config/firebase';

// Web push (FCM): after sign-in we ask for permission, register the service
// worker and save the device token under users/{uid}/devices/{token} (rules:
// owner-managed). The VAPID public key is public web config (ENVIRONMENTS §5).
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export const registerPushDevice = async (uid: string): Promise<void> => {
  if (!vapidKey || import.meta.env.VITE_USE_EMULATORS === 'true') return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  // The permission request must be the FIRST await inside the user gesture —
  // browsers drop the "user activation" after slow work like SW registration.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  if (!(await isSupported().catch(() => false))) return;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(getFirebase().app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return;

  const { db } = getFirebase();
  await setDoc(doc(db, 'users', uid, 'devices', token), {
    token,
    platform: 'web',
    updatedAt: serverTimestamp(),
  });
};

const DISABLED_FLAG = 'swish_push_disabled';

export const isPushLocallyDisabled = (): boolean => localStorage.getItem(DISABLED_FLAG) === '1';

export const setPushLocallyDisabled = (disabled: boolean): void => {
  if (disabled) localStorage.setItem(DISABLED_FLAG, '1');
  else localStorage.removeItem(DISABLED_FLAG);
};

export const disablePushDevice = async (uid: string): Promise<void> => {
  setPushLocallyDisabled(true);
  try {
    if (!vapidKey || !(await isSupported().catch(() => false))) return;
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) return;
    const messaging = getMessaging(getFirebase().app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      const { db } = getFirebase();
      await deleteDoc(doc(db, 'users', uid, 'devices', token));
    }
  } catch {
    // best effort — the flag alone stops re-registration
  }
};

export const pushPermissionState = (): 'unsupported' | NotificationPermission => {
  if (!vapidKey || import.meta.env.VITE_USE_EMULATORS === 'true') return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission;
};

// Browsers only allow audio after a user gesture — we keep one AudioContext
// unlocked from the enable-notifications tap (or any first tap).
let sharedCtx: AudioContext | null = null;

export const unlockAudio = (): void => {
  try {
    sharedCtx = sharedCtx ?? new AudioContext();
    void sharedCtx.resume();
  } catch {
    sharedCtx = null;
  }
};

// Foreground pushes: ring for incoming calls, notify otherwise.
let ringAudio: { stop: () => void } | null = null;

const startRing = (): void => {
  stopRing();
  const ctx = sharedCtx ?? new AudioContext();
  void ctx.resume();
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;
  osc.connect(gain);
  // Classic ring cadence: 1s on, 1s off.
  const interval = setInterval(() => {
    gain.gain.value = gain.gain.value > 0 ? 0 : 0.15;
  }, 1000);
  osc.start();
  const timeout = setTimeout(() => stopRing(), 30_000);
  ringAudio = {
    stop: () => {
      clearInterval(interval);
      clearTimeout(timeout);
      osc.stop();
      if (ctx !== sharedCtx) void ctx.close();
    },
  };
};

export const stopRing = (): void => {
  ringAudio?.stop();
  ringAudio = null;
};

export const listenForegroundPush = (onCallRing: () => void): (() => void) => {
  if (!vapidKey || import.meta.env.VITE_USE_EMULATORS === 'true') return () => undefined;
  let unsubscribe: (() => void) | null = null;
  void isSupported()
    .then((supported) => {
      if (!supported) return;
      const messaging = getMessaging(getFirebase().app);
      unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
        if (payload.data?.kind === 'call') {
          startRing();
          onCallRing();
        }
      });
    })
    .catch(() => undefined);
  return () => unsubscribe?.();
};
