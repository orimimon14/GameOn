import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, Functions, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage';

// Client Firebase config — public VITE_* values only (ENVIRONMENTS §5). Never put secrets here.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let emulatorsConnected = false;

export const getFirebaseApp = (): FirebaseApp => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Copy .env.example to .env.local and fill the VITE_FIREBASE_* values.');
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
};

const connectEmulatorsOnce = (
  auth: Auth,
  db: Firestore,
  storage: FirebaseStorage,
  functions: Functions,
) => {
  if (emulatorsConnected || !useEmulators) return;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  emulatorsConnected = true;
};

export const getFirebase = () => {
  const firebaseApp = getFirebaseApp();
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  const functions = getFunctions(firebaseApp);
  connectEmulatorsOnce(auth, db, storage, functions);

  // Emulator-only test hook so browser-driven QA can create/sign in accounts
  // (the UI itself is Google-only). Never active against the cloud project.
  if (import.meta.env.DEV && useEmulators) {
    void import('firebase/auth').then((authMod) => {
      (window as unknown as Record<string, unknown>).__swishTestAuth = {
        auth,
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
      };
    });
  }

  return { app: firebaseApp, auth, db, storage, functions };
};
