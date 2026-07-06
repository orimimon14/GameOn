import { z } from 'zod';

// Server-side validation for completeOnboarding (API_CONTRACT §3.15).
// Canonical enum values mirror DATA_MODEL §3 / src/shared/enums.ts — keep in sync.
export const SKILL_LEVELS = ['beginner', 'intermediate', 'pro', 'elite'] as const;

export const PLATFORMS = [
  'pc',
  'playstation_5',
  'playstation_4',
  'xbox_series_x',
  'xbox_one',
  'nintendo_switch',
  'mobile',
  'vr',
  'arcade',
  'other',
] as const;

export const LOOKING_FOR = [
  'duo',
  'squad',
  'ranked_climb',
  'casual',
  'voice_chat',
  'no_voice_chat',
  'custom',
] as const;

export const VOICE_PREFERENCES = ['required', 'preferred', 'no_voice', 'flexible'] as const;

export const completeOnboardingSchema = z.object({
  profile: z.object({
    displayName: z.string().trim().min(2).max(30),
    age: z.number().int().min(16).max(120), // ADR-013
    bio: z.string().max(300),
    skillLevel: z.enum(SKILL_LEVELS),
    platforms: z.array(z.enum(PLATFORMS)).min(1).max(10),
  }),
  game: z.object({
    gameId: z.string().trim().min(1),
    rank: z.string().trim().min(1).max(50),
    lookingFor: z.enum(LOOKING_FOR),
    lookingForText: z.string().max(120).optional(),
    voicePreference: z.enum(VOICE_PREFERENCES).optional(),
  }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
