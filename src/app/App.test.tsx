import { render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

import { useAuthStore } from '@/features/auth/authStore';
import type { UserDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';


// Stub the real auth listener: in CI there is no .env.local, so the unconfigured
// path would force the store to 'unauthenticated' and override test state.
vi.mock('@/features/auth/authStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authStore')>();
  return { ...actual, initAuthListener: vi.fn() };
});

// Onboarding data fetching goes to Firebase — not available in unit tests.
vi.mock('@/features/onboarding/onboardingApi', () => ({
  completeOnboarding: vi.fn(),
  loadGameCatalog: vi.fn().mockResolvedValue([]),
}));

const testUser = { uid: 'test-uid' } as unknown as User;
const completedDoc = { onboardingCompleted: true } as UserDocument;
const incompleteDoc = { onboardingCompleted: false } as UserDocument;

const renderApp = (initialPath = '/discover') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: testUser, status: 'authenticated' });
    useUserStore.setState({ userDoc: completedDoc, status: 'ready' });
  });

  it('renders the main navigation in Hebrew for onboarded users', () => {
    renderApp();

    expect(screen.getAllByText('משחקים').length).toBeGreaterThan(0);
    expect(screen.getAllByText('חנות').length).toBeGreaterThan(0);
    expect(screen.getAllByText('הגדרות').length).toBeGreaterThan(0);
  });

  it('redirects unknown routes to discover', () => {
    renderApp('/no-such-route');

    expect(screen.getAllByText('התאמות חדשות').length).toBeGreaterThan(0);
  });

  it('redirects unauthenticated users from the shell to the login page', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    renderApp('/discover');

    expect(screen.getByText('המשך עם Google')).toBeInTheDocument();
    expect(screen.queryByText('התאמות חדשות')).not.toBeInTheDocument();
  });

  it('redirects authenticated users without onboarding to the wizard', () => {
    useUserStore.setState({ userDoc: incompleteDoc, status: 'ready' });
    renderApp('/discover');

    expect(screen.getByText('מי אתה?')).toBeInTheDocument();
    expect(screen.queryByText('התאמות חדשות')).not.toBeInTheDocument();
  });

  it('renders the login page on /login for signed-out users', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    renderApp('/login');

    expect(screen.getByRole('button', { name: 'התחבר' })).toBeInTheDocument();
  });
});
