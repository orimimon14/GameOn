import { describe, expect, it } from 'vitest';

import { userGameInputSchema, userProfileInputSchema } from './userSchemas';

const validProfile = {
  displayName: 'אורן',
  age: 22,
  bio: 'גיימר תחרותי',
  skillLevel: 'pro',
  platforms: ['pc', 'playstation_5'],
  isDiscoverable: true,
};

describe('userProfileInputSchema (DATA_MODEL §4.1 client-writable)', () => {
  it('accepts a valid profile', () => {
    expect(userProfileInputSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects under-age users (ADR-013: minimum 16)', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, age: 15 }).success).toBe(false);
  });

  it('rejects a non-canonical skillLevel (TC-ONB-006)', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, skillLevel: 'expert' }).success).toBe(false);
  });

  it('rejects a Hebrew enum value (English data rule)', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, skillLevel: 'מקצוען' }).success).toBe(false);
  });

  it('rejects an empty platforms list', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, platforms: [] }).success).toBe(false);
  });

  it('rejects an unknown platform value', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, platforms: ['ps5'] }).success).toBe(false);
  });

  it('rejects a bio over 300 characters', () => {
    expect(userProfileInputSchema.safeParse({ ...validProfile, bio: 'א'.repeat(301) }).success).toBe(false);
  });
});

const validGame = {
  gameId: 'valorant',
  rank: 'Platinum IV',
  lookingFor: 'ranked_climb',
  isActive: true,
};

describe('userGameInputSchema (DATA_MODEL §4.4 client-writable)', () => {
  it('accepts a valid game entry', () => {
    expect(userGameInputSchema.safeParse(validGame).success).toBe(true);
  });

  it('accepts optional voicePreference from the canonical enum', () => {
    expect(userGameInputSchema.safeParse({ ...validGame, voicePreference: 'preferred' }).success).toBe(true);
  });

  it('rejects an empty gameId', () => {
    expect(userGameInputSchema.safeParse({ ...validGame, gameId: '' }).success).toBe(false);
  });

  it('rejects a non-canonical lookingFor', () => {
    expect(userGameInputSchema.safeParse({ ...validGame, lookingFor: 'chill' }).success).toBe(false);
  });

  it('rejects a rank over 50 characters', () => {
    expect(userGameInputSchema.safeParse({ ...validGame, rank: 'x'.repeat(51) }).success).toBe(false);
  });
});
