import type { User } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ensureUserDocument } from './userBootstrap';

// vi.mock calls are hoisted above the imports by vitest.
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'user-ref'),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  getFirebase: () => ({ db: {} }),
  isFirebaseConfigured: true,
}));

const makeUser = (overrides: Partial<Pick<User, 'displayName' | 'email'>> = {}): User =>
  ({ uid: 'user-1', displayName: 'אורן', email: 'oren@test.com', ...overrides }) as unknown as User;

describe('ensureUserDocument (P2-T03, retry-safe bootstrap)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a minimal client-writable doc when none exists', async () => {
    (getDoc as Mock).mockResolvedValueOnce({ exists: () => false });

    const result = await ensureUserDocument(makeUser());

    expect(result).toBe('created');
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith('user-ref', { displayName: 'אורן' });
  });

  it('falls back to the email prefix when there is no display name', async () => {
    (getDoc as Mock).mockResolvedValueOnce({ exists: () => false });

    await ensureUserDocument(makeUser({ displayName: null }));

    expect(setDoc).toHaveBeenCalledWith('user-ref', { displayName: 'oren' });
  });

  it('is idempotent — skips creation when the doc already exists', async () => {
    (getDoc as Mock).mockResolvedValueOnce({ exists: () => true });

    const result = await ensureUserDocument(makeUser());

    expect(result).toBe('exists');
    expect(setDoc).not.toHaveBeenCalled();
  });
});
