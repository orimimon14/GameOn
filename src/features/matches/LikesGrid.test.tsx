import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { loadLikesYou } from './likesApi';
import { LikesGrid } from './LikesGrid';

import { submitSwipe } from '@/features/discovery/discoveryApi';
import type { PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

vi.mock('./likesApi', () => ({
  loadLikesYou: vi.fn(),
}));

vi.mock('@/features/discovery/discoveryApi', () => ({
  submitSwipe: vi.fn(),
}));

const profile = (uid: string, displayName: string): PublicProfileDocument =>
  ({
    uid,
    displayName,
    age: 25,
    bio: `ביו של ${displayName}`,
    skillLevel: 'beginner',
    platforms: ['pc'],
    isPro: false,
    verifiedBadge: false,
    gameIds: ['minecraft'],
    isDiscoverable: true,
    isSuspended: false,
    isDeleted: false,
  }) as unknown as PublicProfileDocument;

const renderView = () =>
  render(
    <MemoryRouter initialEntries={['/likes']}>
      <LikesGrid />
    </MemoryRouter>,
  );

describe('LikesGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ userDoc: { uid: 'me' } as never, status: 'ready' });
    (loadLikesYou as Mock).mockResolvedValue([
      { profile: profile('u2', 'יעל'), gameId: 'minecraft' },
    ]);
    (submitSwipe as Mock).mockResolvedValue({ result: 'liked', swipeId: 'me_minecraft' });
  });

  it('renders inbound likes from likesApi', async () => {
    renderView();
    expect(await screen.findByText('יעל, 25')).toBeInTheDocument();
    expect(loadLikesYou).toHaveBeenCalledWith('me');
  });

  it('shows the empty state when there are no likes', async () => {
    (loadLikesYou as Mock).mockResolvedValue([]);
    renderView();
    expect(await screen.findByText('עדיין אין הזמנות — תמשיך להחליק!')).toBeInTheDocument();
  });

  it('like-back calls submitSwipe with the inbound like gameId and removes the card', async () => {
    renderView();
    await screen.findByText('יעל, 25');
    fireEvent.click(screen.getByRole('button', { name: 'בואו נשחק!' }));
    await waitFor(() =>
      expect(submitSwipe).toHaveBeenCalledWith({
        targetUid: 'u2',
        gameId: 'minecraft',
        direction: 'like',
      }),
    );
    await waitFor(() => expect(screen.queryByText('יעל, 25')).not.toBeInTheDocument());
  });

  it('shows the match celebration when like-back returns matched', async () => {
    (submitSwipe as Mock).mockResolvedValue({
      result: 'matched',
      swipeId: 'me_minecraft',
      matchId: 'm1',
      chatId: 'm1',
    });
    renderView();
    await screen.findByText('יעל, 25');
    fireEvent.click(screen.getByRole('button', { name: 'בואו נשחק!' }));
    expect(await screen.findByRole('dialog', { name: 'SQUAD UP!' })).toBeInTheDocument();
  });

  it('shows an error alert when like-back fails', async () => {
    (submitSwipe as Mock).mockRejectedValue(new Error('boom'));
    renderView();
    await screen.findByText('יעל, 25');
    fireEvent.click(screen.getByRole('button', { name: 'בואו נשחק!' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('הלייק לא נשלח — נסה שוב');
    expect(screen.getByText('יעל, 25')).toBeInTheDocument();
  });

  it('drops the card with an unavailable message on failed-precondition', async () => {
    (submitSwipe as Mock).mockRejectedValue({ code: 'functions/failed-precondition' });
    renderView();
    await screen.findByText('יעל, 25');
    fireEvent.click(screen.getByRole('button', { name: 'בואו נשחק!' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('הלייק הזה כבר לא זמין');
    expect(screen.queryByText('יעל, 25')).not.toBeInTheDocument();
  });

  it('shows the error state when loading fails', async () => {
    (loadLikesYou as Mock).mockRejectedValue(new Error('boom'));
    renderView();
    expect(await screen.findByText('טעינת הלייקים נכשלה — נסה לרענן')).toBeInTheDocument();
  });
});
