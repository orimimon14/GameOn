import { describe, expect, it } from 'vitest';

import { mapAuthErrorToI18nKey } from './authService';

describe('mapAuthErrorToI18nKey (no raw Firebase errors in UI)', () => {
  it.each([
    ['auth/invalid-email', 'auth.errors.invalidEmail'],
    ['auth/weak-password', 'auth.errors.weakPassword'],
    ['auth/email-already-in-use', 'auth.errors.emailInUse'],
    ['auth/invalid-credential', 'auth.errors.invalidCredentials'],
    ['auth/wrong-password', 'auth.errors.invalidCredentials'],
    ['auth/user-not-found', 'auth.errors.invalidCredentials'],
    ['auth/popup-closed-by-user', 'auth.errors.popupClosed'],
    ['auth/network-request-failed', 'auth.errors.network'],
    ['auth/too-many-requests', 'auth.errors.tooManyRequests'],
  ])('maps %s to %s', (code, expectedKey) => {
    expect(mapAuthErrorToI18nKey({ code })).toBe(expectedKey);
  });

  it('falls back to a generic key for unknown codes', () => {
    expect(mapAuthErrorToI18nKey({ code: 'auth/whatever-new' })).toBe('auth.errors.generic');
  });

  it('falls back to a generic key for non-Firebase errors', () => {
    expect(mapAuthErrorToI18nKey(new Error('boom'))).toBe('auth.errors.generic');
    expect(mapAuthErrorToI18nKey(undefined)).toBe('auth.errors.generic');
  });
});
