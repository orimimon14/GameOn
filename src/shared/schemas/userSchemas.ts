import { z } from 'zod';

import { LOOKING_FOR, PLATFORMS, SKILL_LEVELS, VOICE_PREFERENCES } from '@/shared/enums';

// Zod at trust boundaries (CONVENTIONS §3) — validates the client-writable
// fields of users/{uid} and users/{uid}/games/{gameId} per DATA_MODEL §4.1/§4.4.
// Length limits marked TBD follow open ADRs (ADR-031 bio); min age 16 per ADR-013.

export const userProfileInputSchema = z.object({
  displayName: z.string().trim().min(2, 'שם חייב להכיל לפחות 2 תווים').max(30, 'שם ארוך מדי'),
  age: z
    .number()
    .int('גיל חייב להיות מספר שלם')
    .min(16, 'הגיל המינימלי הוא 16')
    .max(120, 'גיל לא תקין'),
  bio: z.string().max(300, 'התיאור ארוך מדי (עד 300 תווים)'),
  skillLevel: z.enum(SKILL_LEVELS),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'יש לבחור לפחות פלטפורמה אחת'),
  isDiscoverable: z.boolean(),
  preferredLocale: z.enum(['he', 'en']).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileInputSchema>;

export const userGameInputSchema = z.object({
  gameId: z.string().trim().min(1, 'יש לבחור משחק'),
  rank: z.string().trim().min(1, 'יש להזין דירוג').max(50, 'דירוג ארוך מדי'),
  lookingFor: z.enum(LOOKING_FOR),
  lookingForText: z.string().max(120, 'טקסט ארוך מדי').optional(),
  voicePreference: z.enum(VOICE_PREFERENCES).optional(),
  isActive: z.boolean(),
});

export type UserGameInput = z.infer<typeof userGameInputSchema>;
