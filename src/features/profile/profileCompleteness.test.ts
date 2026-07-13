import { describe, expect, it } from 'vitest';

import { computeProfileCompleteness } from './profileCompleteness';

import type { GalleryMediaItem, UserDocument, UserGameDocument } from '@/shared/models';

const doc = (over: Partial<UserDocument>) => over as UserDocument;
const game = (rank: string) => ({ rank }) as UserGameDocument;
const media = [{ id: '1', type: 'image', url: 'u', filePath: 'p' }] as GalleryMediaItem[];

describe('computeProfileCompleteness', () => {
  it('scores 0% for an empty profile', () => {
    const result = computeProfileCompleteness(doc({}), []);
    expect(result.percent).toBe(0);
    expect(result.missing).toEqual(['photo', 'bio', 'gallery', 'games', 'rank']);
  });

  it('scores 100% for a full profile', () => {
    const result = computeProfileCompleteness(
      doc({ profileImageUrl: 'x', bio: 'אוהב לשחק ולנצח', galleryMedia: media }),
      [game('Gold'), game('')],
    );
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it('requires a real bio, two games and one rank', () => {
    const result = computeProfileCompleteness(
      doc({ profileImageUrl: 'x', bio: 'קצר', galleryMedia: media }),
      [game('')],
    );
    expect(result.percent).toBe(40);
    expect(result.missing).toEqual(['bio', 'games', 'rank']);
  });
});
