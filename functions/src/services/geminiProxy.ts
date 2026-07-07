import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

// AI_INTEGRATION §2-3 — server-side Gemini proxy shared by the AI callables.
// Model id and limits live server-side only (system/config.ai); the client
// never sees provider details. Every request is audited in aiRequests
// (DATA_MODEL §4.15) and counted against the caller's daily usage doc.
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

export interface AiCallerGate {
  uid: string;
  isPro: boolean;
}

export const assertAiQuota = async (
  uid: string,
  requestType: string,
): Promise<AiCallerGate> => {
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10);
  const [userSnap, configSnap, usageSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc('system/config').get(),
    db.doc(`users/${uid}/usage/${today}`).get(),
  ]);

  const user = userSnap.data();
  if (!user) throw new HttpsError('not-found', 'not_found');
  if (user.isSuspended === true || user.isDeleted === true) {
    throw new HttpsError('failed-precondition', 'failed_precondition');
  }
  const isPro = user.isPro === true && ['trialing', 'active'].includes(user.subscriptionStatus);

  const limits = configSnap.data()?.limits ?? {};
  const dailyLimit: number = isPro
    ? (limits.aiProfileReviewDailyLimitPro ?? 20)
    : (limits.aiProfileReviewDailyLimitBasic ?? 3);
  const used: number = usageSnap.data()?.aiRequestCount ?? 0;
  if (used >= dailyLimit) {
    throw new HttpsError('resource-exhausted', 'resource_exhausted');
  }

  await db.doc(`users/${uid}/usage/${today}`).set(
    { date: today, aiRequestCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  void requestType;
  return { uid, isPro };
};

export const auditAiRequest = async (
  uid: string,
  requestType: string,
  status: 'completed' | 'failed',
): Promise<void> => {
  const db = getFirestore();
  await db.collection('aiRequests').add({
    uid,
    requestType,
    status,
    createdAt: FieldValue.serverTimestamp(),
  });
};

// Calls Gemini in JSON mode and returns the parsed object.
export const generateJson = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<unknown> => {
  const db = getFirestore();
  const configSnap = await db.doc('system/config').get();
  const ai = configSnap.data()?.ai ?? {};
  const model: string = ai.model ?? DEFAULT_MODEL;
  const maxOutputTokens: number = ai.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const timeoutMs: number = ai.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );

  if (response.status === 429) {
    throw new HttpsError('resource-exhausted', 'ai_unavailable');
  }
  if (!response.ok) {
    throw new HttpsError('internal', 'internal');
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new HttpsError('internal', 'internal');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpsError('internal', 'internal');
  }
};
