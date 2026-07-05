import { describe, expect, it } from 'vitest';

import { generateSquadStrategy } from './geminiService';

describe('geminiService (safe stub)', () => {
  it('returns a disabled-AI strategy without calling any external API', async () => {
    const result = await generateSquadStrategy('שחקן תחרותי');

    expect(result.strategyName).toBe('AI מושבת זמנית');
    expect(result.roles).toEqual([]);
    expect(result.tips).toEqual([]);
    expect(result.description).toContain('מושבתות זמנית');
  });
});
