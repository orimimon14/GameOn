import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MyProfilePage } from './MyProfilePage';
import { loadMyGames, updateMyProfile } from './profileApi';

import { useAuthStore } from '@/features/auth/authStore';
import type { UserDocument, UserGameDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';


vi.mock('./profileApi', () => ({
  updateMyProfile: vi.fn().mockResolvedValue(undefined),
  updateMyPreferredLocale: vi.fn(),
  loadMyGames: vi.fn(),
}));

const testUser = { uid: 'u1' } as unknown as User;

const userDoc = {
  uid: 'u1',
  displayName: 'תומר',
  email: 'tomer@test.com',
  age: 28,
  bio: 'טריהארד ולורנט',
  skillLevel: 'elite',
  platforms: ['pc'],
  coins: 250,
  isPro: false,
  onboardingCompleted: true,
} as unknown as UserDocument;

const games = [
  { gameId: 'valorant', name: 'Valorant', rank: 'Immortal', lookingFor: 'ranked_climb', isActive: true },
] as unknown as UserGameDocument[];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <MyProfilePage />
    </MemoryRouter>,
  );

describe('MyProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loadMyGames as Mock).mockResolvedValue(games);
    useAuthStore.setState({ user: testUser, status: 'authenticated' });
    useUserStore.setState({ userDoc, status: 'ready' });
  });

  it('renders canonical profile data with Hebrew labels', async () => {
    renderPage();

    expect(screen.getByText('תומר')).toBeInTheDocument();
    expect(screen.getByText('טריהארד ולורנט')).toBeInTheDocument();
    expect(screen.getByText('עילית')).toBeInTheDocument(); // skillLevel label
    expect(screen.getByText('250')).toBeInTheDocument(); // coins
    expect(await screen.findByText('Valorant')).toBeInTheDocument();
    expect(screen.getByText('Immortal')).toBeInTheDocument();
  });

  it('saves edited client-writable fields through profileApi', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /עריכת פרופיל/ }));
    fireEvent.change(screen.getByLabelText('קצת עליך'), { target: { value: 'ביו מעודכן' } });
    fireEvent.click(screen.getByRole('button', { name: 'שמירה' }));

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1));
    expect(updateMyProfile).toHaveBeenCalledWith('u1', {
      displayName: 'תומר',
      age: 28,
      bio: 'ביו מעודכן',
      skillLevel: 'elite',
      platforms: ['pc'],
    });
  });

  it('blocks under-age edits with a Hebrew error (ADR-013)', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /עריכת פרופיל/ }));
    fireEvent.change(screen.getByLabelText('גיל'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'שמירה' }));

    expect(await screen.findByText('הגיל המינימלי הוא 16')).toBeInTheDocument();
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('cancel exits edit mode without saving', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /עריכת פרופיל/ }));
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));

    expect(screen.getByText('טריהארד ולורנט')).toBeInTheDocument();
    expect(updateMyProfile).not.toHaveBeenCalled();
  });
});
