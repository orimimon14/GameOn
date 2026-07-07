import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { assertAiQuota, auditAiRequest, generateJson } from '../services/geminiProxy';

// API_CONTRACT §3.5 — AI profile review through the server-side Gemini proxy.
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const inputSchema = z.object({
  bio: z.string().trim().max(300),
  games: z
    .array(
      z.object({
        gameId: z.string().trim().min(1),
        name: z.string().trim().min(1).max(100),
        rank: z.string().trim().max(50),
        lookingFor: z.string().trim().max(30),
        lookingForText: z.string().trim().max(120).optional(),
      }),
    )
    .min(1)
    .max(10),
  skillLevel: z.enum(['beginner', 'intermediate', 'pro', 'elite']),
});

const outputSchema = z.object({
  summary: z.string(),
  suggestedBio: z.string().optional(),
  improvements: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});

const SYSTEM_PROMPT = `אתה יועץ פרופילים באפליקציית Swish & Game — אפליקציה למציאת שותפים למשחקי וידאו.
תפקידך: לשפר פרופילים של גיימרים כדי שיקבלו יותר התאמות.
ענה בעברית בלבד. אל תמציא עובדות על המשתמש. אל תכלול תוכן פוגעני.
החזר JSON בלבד במבנה: {"summary": string, "suggestedBio": string, "improvements": string[], "warnings": string[]}`;

export const sendAIProfileReview = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'auth required');

  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_argument');
  const { bio, games, skillLevel } = parsed.data;

  await assertAiQuota(uid, 'profile_review');

  const userPrompt = `ביו נוכחי: "${bio || '(ריק)'}"
רמת מיומנות: ${skillLevel}
משחקים: ${games.map((g) => `${g.name} (דירוג: ${g.rank}, מחפש: ${g.lookingForText ?? g.lookingFor})`).join('; ')}

נתח את הפרופיל והצע שיפורים קצרים וקונקרטיים.`;

  try {
    const raw = await generateJson(geminiApiKey.value(), SYSTEM_PROMPT, userPrompt);
    const result = outputSchema.parse(raw);
    await auditAiRequest(uid, 'profile_review', 'completed');
    return result;
  } catch (error) {
    await auditAiRequest(uid, 'profile_review', 'failed');
    throw error;
  }
});
