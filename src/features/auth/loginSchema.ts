import { z } from 'zod';

// Messages are i18n keys — rendered through t() so validation stays bilingual (ADR-035).
export const loginSchema = z.object({
  email: z.email('auth.errors.invalidEmail'),
  password: z.string().min(6, 'auth.errors.weakPassword'),
});

export type LoginInput = z.infer<typeof loginSchema>;
