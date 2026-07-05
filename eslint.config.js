import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'functions/lib/**'] },
  js.configs.recommended,
  {
    files: ['scripts/**/*.mjs', '**/*.config.{js,ts}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', fetch: 'readonly' },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      // CONVENTIONS §3: no `any` without documented justification.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // CONVENTIONS §3: import order. Warn during migration; tightened in P1-T04 restructure.
      'import/order': ['warn', { 'newlines-between': 'always' }],
    },
  },
  {
    // CONVENTIONS: feature code uses named exports and strict import order (P1-T04).
    files: ['src/**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-default-export': 'error',
      'import/order': ['error', { 'newlines-between': 'always' }],
    },
  },
  prettier,
);
