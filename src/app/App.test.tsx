import { render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

import { useAuthStore } from '@/features/auth/authStore';

// Stub the real auth listener: in CI there is no .env.local, so the unconfigured
// path would force the store to 'unauthenticated' and override test state.
vi.mock('@/features/auth/authStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authStore')>();
  return { ...actual, initAuthListener: vi.fn() };
});

const testUser = { uid: 'test-uid' } as unknown as User;

const renderApp = (initialPath = '/discover') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: testUser, status: 'authenticated' });
  });

  it('renders the main navigation in Hebrew for authenticated users', () => {
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

  it('renders the login page on /login for signed-out users', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    renderApp('/login');

    expect(screen.getByRole('button', { name: 'התחבר' })).toBeInTheDocument();
  });
});
