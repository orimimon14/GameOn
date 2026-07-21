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

const isoYearsAgo = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - 1); // safely past the birthday
  return d.toISOString().slice(0, 10);
};

const fillBasics = () => {
  fireEvent.change(screen.getByLabelText('שם תצוגה'), { target: { value: 'אורן' } });
  fireEvent.change(screen.getByLabelText('תאריך לידה'), { target: { value: isoYearsAgo(22) } });
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
    fireEvent.change(screen.getByLabelText('תאריך לידה'), { target: { value: isoYearsAgo(15) } });
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));

    expect(await screen.findByText('הגיל המינימלי הוא 16')).toBeInTheDocument();
    expect(screen.queryByText('באיזה משחק נתחיל?')).not.toBeInTheDocument();
  });

  it('advances to step 2 and lists the game catalog', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));

    expect(await screen.findByText('באילו משחקים נתחיל?')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Valorant/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EA FC 26/ })).toBeInTheDocument();
  });

  it('submits multiple games in the canonical payload on finish (ADR-043)', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    fireEvent.click(await screen.findByRole('button', { name: /Valorant/ }));
    fireEvent.click(screen.getByRole('button', { name: /EA FC 26/ }));
    fireEvent.change(screen.getByLabelText('הדירוג שלך — Valorant'), { target: { value: 'Platinum' } });
    fireEvent.click(screen.getByRole('button', { name: 'סיום ויציאה לדרך!' }));

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(1));
    expect(completeOnboarding).toHaveBeenCalledWith({
      profile: {
        displayName: 'אורן',
        age: 22,
        bio: 'גיימר תחרותי',
        skillLevel: 'intermediate',
        platforms: ['pc'],
        playTimes: [],
      },
      games: [
        { gameId: 'valorant', rank: 'Platinum', lookingFor: 'casual' },
        { gameId: 'fifa', lookingFor: 'casual' },
      ],
    });
  });

  it('requires picking a game before finishing', async () => {
    renderPage();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'המשך' }));
    await screen.findByText('באילו משחקים נתחיל?');
    fireEvent.click(screen.getByRole('button', { name: 'סיום ויציאה לדרך!' }));

    expect(await screen.findByText('יש לבחור משחק')).toBeInTheDocument();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });
});
