import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { loadDeck, loadMyActiveGameIds, submitSwipe } from './discoveryApi';
import { SwipeView } from './SwipeView';

import type { PublicProfileDocument } from '@/shared/models';
import { useUiStore } from '@/shared/store/uiStore';
import { useUserStore } from '@/shared/store/userStore';

vi.mock('./discoveryApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./discoveryApi')>()),
  loadDeck: vi.fn(),
  loadMyActiveGameIds: vi.fn(),
  submitSwipe: vi.fn(),
}));

const profile = (uid: string, displayName: string): PublicProfileDocument =>
  ({
    uid,
    displayName,
    age: 24,
    bio: `ביו של ${displayName}`,
    skillLevel: 'pro',
    platforms: ['pc'],
    isPro: false,
    verifiedBadge: false,
    gameIds: ['valorant'],
    primaryRank: 'Gold II',
    isDiscoverable: true,
    isSuspended: false,
    isDeleted: false,
  }) as unknown as PublicProfileDocument;

const renderView = () =>
  render(
    <MemoryRouter initialEntries={['/discover']}>
      <SwipeView />
    </MemoryRouter>,
  );

describe('SwipeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ userDoc: { uid: 'me' } as never, status: 'ready' });
    useUiStore.setState({ selectedGame: 'valorant' });
    (loadDeck as Mock).mockResolvedValue([profile('u2', 'יעל'), profile('u3', 'אורן')]);
    (submitSwipe as Mock).mockResolvedValue({ result: 'liked', swipeId: 'u2_valorant' });
  });

  it('renders the top deck card from publicProfiles', async () => {
    renderView();

    expect(await screen.findByText('יעל, 24')).toBeInTheDocument();
    expect(screen.getByText('ביו של יעל')).toBeInTheDocument();
    expect(screen.getByText('Gold II')).toBeInTheDocument();
    expect(loadDeck).toHaveBeenCalledWith('me', 'valorant');
    expect(loadMyActiveGameIds).not.toHaveBeenCalled();
  });

  it('falls back to my first active game when no game is selected', async () => {
    useUiStore.setState({ selectedGame: null });
    (loadMyActiveGameIds as Mock).mockResolvedValue(['warzone']);

    renderView();

    await waitFor(() => expect(loadDeck).toHaveBeenCalledWith('me', 'warzone'));
  });

  it('sends a like through the submitSwipe callable and advances the deck', async () => {
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'like' }));

    await waitFor(() =>
      expect(submitSwipe).toHaveBeenCalledWith({
        targetUid: 'u2',
        gameId: 'valorant',
        direction: 'like',
      }),
    );
    expect(await screen.findByText('אורן, 24')).toBeInTheDocument();
  });

  it('shows the match celebration when the swipe returns matched', async () => {
    (submitSwipe as Mock).mockResolvedValue({
      result: 'matched',
      swipeId: 'u2_valorant',
      matchId: 'me_u2_valorant',
      chatId: 'me_u2_valorant',
    });

    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'like' }));

    expect(await screen.findByRole('dialog', { name: 'יש מאץ׳!' })).toBeInTheDocument();
    expect(screen.getByText('אתה ו-יעל אהבתם אחד את השני')).toBeInTheDocument();
  });

  it('shows the daily limit screen on resource-exhausted', async () => {
    (submitSwipe as Mock).mockRejectedValue({ code: 'functions/resource-exhausted' });

    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'like' }));

    expect(await screen.findByText('נגמרו ההחלקות להיום')).toBeInTheDocument();
  });

  it('shows the empty state when the deck runs out', async () => {
    (loadDeck as Mock).mockResolvedValue([]);

    renderView();

    expect(await screen.findByText('אין יותר שחקנים כרגע')).toBeInTheDocument();
  });

  it('prompts to pick a game when the user has none', async () => {
    useUiStore.setState({ selectedGame: null });
    (loadMyActiveGameIds as Mock).mockResolvedValue([]);

    renderView();

    expect(await screen.findByText('בחר משחק כדי להתחיל')).toBeInTheDocument();
    expect(loadDeck).not.toHaveBeenCalled();
  });
});
