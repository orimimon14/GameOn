/// <reference types="vitest/config" />
import path from 'path';

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Stamped into the bundle AND written to /version.json — the client compares
// the two to detect a newer deploy and self-refresh (stale installed PWAs).
const buildId = String(Date.now());

const emitVersionJson = (): Plugin => ({
  name: 'emit-version-json',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId }),
    });
  },
});

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      define: {
        __BUILD_ID__: JSON.stringify(buildId),
      },
      plugins: [react(), emitVersionJson()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        // Rules tests need the Firestore emulator — they run via `npm run test:rules` only.
        exclude: ['**/node_modules/**', '**/dist/**', 'tests/rules/**'],
      },
    };
});
