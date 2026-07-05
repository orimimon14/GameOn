/// <reference types="vitest/config" />
import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
