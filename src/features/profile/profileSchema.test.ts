import { describe, expect, it } from 'vitest';

import { profileEditSchema } from './profileSchema';

describe('profileEditSchema', () => {
  it('accepts a valid profile', () => {
    const result = profileEditSchema.safeParse({ name: 'אורן', age: 22, bio: 'גיימר תחרותי' });
    expect(result.success).toBe(true);
  });

  it('rejects under-age users (ADR-013: minimum 16)', () => {
    const result = profileEditSchema.safeParse({ name: 'אורן', age: 15, bio: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = profileEditSchema.safeParse({ name: '', age: 22, bio: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a bio over 300 characters', () => {
    const result = profileEditSchema.safeParse({ name: 'אורן', age: 22, bio: 'א'.repeat(301) });
    expect(result.success).toBe(false);
  });
});
