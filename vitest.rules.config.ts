import { defineConfig } from 'vitest/config';

// Security Rules tests — run only via `npm run test:rules`, which boots the
// Firestore emulator around this suite (firebase emulators:exec).
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    hookTimeout: 30000,
    testTimeout: 15000,
  },
});
