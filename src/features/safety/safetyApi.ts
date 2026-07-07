import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/config/firebase';

// P8 — safety actions. Blocking is backend-authoritative (API_CONTRACT §3.8:
// block doc + match/chat deactivation in one batch); reports are created
// directly under the Security Rules contract (SECURITY isValidReportCreate).
export type ReportReason =
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'scam_spam'
  | 'underage_concern'
  | 'cheating_exploits'
  | 'fake_profile'
  | 'other';

export interface BlockResult {
  success: true;
  blockedUid: string;
  affectedMatchIds: string[];
  affectedChatIds: string[];
}

export const blockUser = async (blockedUid: string, reason?: string): Promise<BlockResult> => {
  const { functions } = getFirebase();
  const response = await httpsCallable<{ blockedUid: string; reason?: string }, BlockResult>(
    functions,
    'blockUser',
  )({ blockedUid, ...(reason ? { reason } : {}) });
  return response.data;
};

export const createReport = async (
  reporterUid: string,
  reportedUid: string,
  reason: ReportReason,
  context: { chatId?: string; description?: string } = {},
): Promise<void> => {
  const { db } = getFirebase();
  await addDoc(collection(db, 'reports'), {
    reporterUid,
    reportedUid,
    source: context.chatId ? 'chat' : 'profile',
    ...(context.chatId ? { chatId: context.chatId } : {}),
    ...(context.description ? { description: context.description } : {}),
    reason,
    status: 'open',
    createdAt: serverTimestamp(),
  });
};
