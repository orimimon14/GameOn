import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { assertAiQuota, auditAiRequest, generateJson } from '../services/geminiProxy';

// API_CONTRACT §3.6 — squad/strategy advice through the server-side Gemini proxy.
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const inputSchema = z.object({
  gameId: z.string().trim().min(1).max(50),
  gameName: z.string().trim().min(1).max(100),
  rank: z.string().trim().max(50).optional(),
  playstyle: z.string().trim().max(200).optional(),
  squadContext: z.string().trim().max(500).optional(),
});

const outputSchema = z.object({
  strategyName: z.string(),
  summary: z.string(),
  roles: z.array(z.object({ role: z.string(), description: z.string() })).optional(),
  tips: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});

const SYSTEM_PROMPT = `אתה מאמן גיימינג באפליקציית Swish & Game.
תפקידך: לתת עצות סקוואד ואסטרטגיה קצרות ופרקטיות למשחק המבוקש.
ענה בעברית בלבד. בלי עצות רמאות/צ'יטים/ניצול באגים. בלי תוכן פוגעני.
החזר JSON בלבד במבנה: {"strategyName": string, "summary": string, "roles": [{"role": string, "description": string}], "tips": string[], "warnings": string[]}`;

export const sendAISquadAdvice = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'auth required');

  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_argument');
  const { gameName, rank, playstyle, squadContext } = parsed.data;

  await assertAiQuota(uid, 'squad_advice');

  const userPrompt = `משחק: ${gameName}
${rank ? `דירוג: ${rank}` : ''}
${playstyle ? `סגנון משחק: ${playstyle}` : ''}
${squadContext ? `הקשר הסקוואד: ${squadContext}` : ''}

תן אסטרטגיה מומלצת, חלוקת תפקידים וטיפים מעשיים.`;

  try {
    const raw = await generateJson(geminiApiKey.value(), SYSTEM_PROMPT, userPrompt);
    const result = outputSchema.parse(raw);
    await auditAiRequest(uid, 'squad_advice', 'completed');
    return result;
  } catch (error) {
    await auditAiRequest(uid, 'squad_advice', 'failed');
    throw error;
  }
});
