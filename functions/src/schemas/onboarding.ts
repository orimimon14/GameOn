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

export const PLAY_TIMES = ['morning', 'afternoon', 'evening', 'night', 'weekends'] as const;

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

const onboardingGameSchema = z.object({
  gameId: z.string().trim().min(1),
  rank: z.string().trim().max(50).optional(), // optional since multi-game (ADR-043)
  lookingFor: z.enum(LOOKING_FOR),
  lookingForText: z.string().max(120).optional(),
  voicePreference: z.enum(VOICE_PREFERENCES).optional(),
});

// ADR-043 — onboarding accepts multiple games. `game` (singular) is the
// legacy pre-ADR-043 payload, normalized into `games` for old bundles.
export const completeOnboardingSchema = z
  .object({
    profile: z.object({
      displayName: z.string().trim().min(2).max(30),
      age: z.number().int().min(16).max(120), // ADR-013
      bio: z.string().max(300),
      skillLevel: z.enum(SKILL_LEVELS),
      platforms: z.array(z.enum(PLATFORMS)).min(1).max(10),
      playTimes: z.array(z.enum(PLAY_TIMES)).max(5).optional(), // ADR-045
    }),
    games: z.array(onboardingGameSchema).min(1).max(10).optional(),
    game: onboardingGameSchema.optional(),
  })
  .transform((data) => ({
    profile: data.profile,
    games: data.games ?? (data.game ? [data.game] : []),
  }))
  .refine((data) => data.games.length >= 1 && data.games.length <= 10, {
    message: 'between 1 and 10 games required',
  });

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
