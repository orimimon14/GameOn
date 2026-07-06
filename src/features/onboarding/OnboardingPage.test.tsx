import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { completeOnboarding, loadGameCatalog } from './onboardingApi';
import { OnboardingPage } from './OnboardingPage';

import type { GameCatalogDocument, UserDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';


vi.mock('./onboardingApi', () => ({
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
  loadGameCatalog: vi.fn(),
}));

const CATALOG = [
  { gameId: 'valorant', name: 'Valorant', slug: 'valorant', isActive: true, isFeatured: true, supportedRanks: ['Gold', 'Platinum'] },
  { gameId: 'fifa', name: 'EA FC 26', slug: 'fifa', isActive: true, isFeatured: false },
] as unknown as GameCatalogDocument[];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <OnboardingPage />
    </MemoryRouter>,
  );

const fillBasics = () => {
  fireEvent.change(screen.getByLabelText('שם תצוגה'), { target: { value: 'אורן' } });
  fireEvent.change(screen.getByLabelText('גיל'), { target: { value: '22' } });
  fireEvent.change(screen.getByLabelText('קצת עליך'), { target: { value: 'גיימר תחרותי' } });
  fireEvent.click(screen.getByRole('button', { name: 'PC' }));
};

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loadGameCatalog as Mock).mockResolvedValue(CATALOG);
    useUserStore.setState({ userDoc: { onboardingCompleted: false } as UserDocument, status: 'ready' });
  });

  it('renders step 1 in Hebrew', () => {
    renderPage();
    expect(screen.getByText('מי אתה?')).toBeInTheDocument();
    expect(screen.getByLabelText('שם תצוגה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'מקצוען' })).toBeInTheDocument();
  });

  it('blocks under-age users with a Hebrew error (ADR-013)', async () => {
    renderPage();
    fillBasics();
    fireEvent.change(screen.getByLabelText('גיל'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));

    expect(await screen.findByText('הגיל המינימלי הוא 16')).toBeInTheDocument();
    expect(screen.queryByText('באיזה משחק נתחיל?')).not.toBeInTheDocument();
  });

  it('advances to step 2 and lists the game catalog', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));

    expect(await screen.findByText('באיזה משחק נתחיל?')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Valorant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EA FC 26' })).toBeInTheDocument();
  });

  it('submits the full canonical payload on finish', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Valorant' }));
    fireEvent.change(screen.getByLabelText('הדירוג שלך'), { target: { value: 'Platinum' } });
    fireEvent.click(screen.getByRole('button', { name: 'סיום ויציאה לדרך!' }));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(completeOnboarding).toHaveBeenCalledWith({
      profile: {
        displayName: 'אורן',
        age: 22,
        bio: 'גיימר תחרותי',
        skillLevel: 'intermediate',
        platforms: ['pc'],
      },
      game: { gameId: 'valorant', rank: 'Platinum', lookingFor: 'casual' },
    });
  });

  it('requires picking a game before finishing', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    await screen.findByText('באיזה משחק נתחיל?');
    fireEvent.click(screen.getByRole('button', { name: 'סיום ויציאה לדרך!' }));

    expect(await screen.findByText('יש לבחור משחק')).toBeInTheDocument();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });
});
