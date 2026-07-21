import { z } from 'zod';

import { PLATFORMS, PLAY_TIMES, SKILL_LEVELS } from '@/shared/enums';

// Client-writable profile basics (DATA_MODEL §4.1) — shared by onboarding and
// profile editing. Messages are i18n keys so validation stays bilingual (ADR-035).
export const profileBasicsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'onboarding.errors.displayName')
    .max(30, 'onboarding.errors.displayName'),
  age: z
    .number('onboarding.errors.age')
    .int('onboarding.errors.age')
    .min(16, 'onboarding.errors.age')
    .max(120, 'onboarding.errors.age'),
  bio: z.string().max(300, 'onboarding.errors.bio'),
  skillLevel: z.enum(SKILL_LEVELS),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'onboarding.errors.platforms'),
  playTimes: z.array(z.enum(PLAY_TIMES)).max(5).optional(), // ADR-045 — optional
});

export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>;
