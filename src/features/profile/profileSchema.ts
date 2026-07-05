import { z } from 'zod';

// Zod at trust boundaries (CONVENTIONS). Minimum age 16 per ADR-013.
// Bio max length is a placeholder until ADR-031 is decided.
export const profileEditSchema = z.object({
  name: z.string().trim().min(2, 'שם חייב להכיל לפחות 2 תווים').max(30, 'שם ארוך מדי'),
  age: z
    .number()
    .int('גיל חייב להיות מספר שלם')
    .min(16, 'הגיל המינימלי הוא 16')
    .max(120, 'גיל לא תקין'),
  bio: z.string().max(300, 'התיאור ארוך מדי (עד 300 תווים)'),
});

export type ProfileEditInput = z.infer<typeof profileEditSchema>;
