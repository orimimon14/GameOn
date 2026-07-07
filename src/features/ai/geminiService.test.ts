import { describe, expect, it, vi } from 'vitest';

import { generateSquadStrategy } from './geminiService';

// The client AI service is a thin proxy to the sendAISquadAdvice callable —
// it must never talk to a provider directly (AI_INTEGRATION §2).
const callableMock = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: () => callableMock,
}));

vi.mock('@/config/firebase', () => ({
  getFirebase: () => ({ functions: {} }),
}));

describe('geminiService (server proxy client)', () => {
  it('passes the request to the sendAISquadAdvice callable and returns its data', async () => {
    callableMock.mockResolvedValue({
      data: {
        strategyName: 'לחץ מתמשך',
        summary: 'שליטה במרכז המפה',
        roles: [{ role: 'מחפה', description: 'צלף מרחוק' }],
        tips: ['תקשורת קולית'],
      },
    });

    const result = await generateSquadStrategy('warzone', 'Warzone', 'אגרסיבי', 'Gold');

    expect(callableMock).toHaveBeenCalledWith({
      gameId: 'warzone',
      gameName: 'Warzone',
      playstyle: 'אגרסיבי',
      rank: 'Gold',
    });
    expect(result.strategyName).toBe('לחץ מתמשך');
    expect(result.tips).toEqual(['תקשורת קולית']);
  });
});
