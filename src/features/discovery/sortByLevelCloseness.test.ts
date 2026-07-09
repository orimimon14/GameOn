import { describe, expect, it } from 'vitest';

import { sortByLevelCloseness } from './discoveryApi';

import type { PublicProfileDocument } from '@/shared/models';

const profile = (uid: string, skillLevel: string) =>
  ({ uid, skillLevel }) as unknown as PublicProfileDocument;

// The matching promise: players closest to MY level come first.
describe('sortByLevelCloseness', () => {
  it('puts my exact level first, then adjacent levels', () => {
    const deck = [
      profile('a', 'beginner'),
      profile('b', 'elite'),
      profile('c', 'pro'),
      profile('d', 'intermediate'),
    ];
    const sorted = sortByLevelCloseness(deck, 'pro');
    expect(sorted.map((p) => p.uid)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('keeps original order between equal distances (stable)', () => {
    const deck = [profile('x', 'beginner'), profile('y', 'elite'), profile('z', 'pro')];
    const sorted = sortByLevelCloseness(deck, 'intermediate');
    expect(sorted.map((p) => p.uid)).toEqual(['x', 'z', 'y']);
  });

  it('returns the deck untouched without my skill', () => {
    const deck = [profile('a', 'elite'), profile('b', 'beginner')];
    expect(sortByLevelCloseness(deck, undefined).map((p) => p.uid)).toEqual(['a', 'b']);
  });
});
