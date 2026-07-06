import { z } from 'zod';

// Server-side validation for submitSwipe (API_CONTRACT §3.1).
export const SWIPE_DIRECTIONS = ['like', 'skip'] as const;

export const submitSwipeSchema = z.object({
  targetUid: z.string().trim().min(1),
  gameId: z.string().trim().min(1),
  direction: z.enum(SWIPE_DIRECTIONS),
});

export type SubmitSwipeInput = z.infer<typeof submitSwipeSchema>;
