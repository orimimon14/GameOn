import type { CapacitorConfig } from '@capacitor/cli';

// ADR-036 / STORE_COMPLIANCE — native shells wrap the built web app (dist).
// The backend stays the same Firebase project; nothing forks per platform.
const config: CapacitorConfig = {
  appId: 'com.swishgame.app',
  appName: 'Swish & Game',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
