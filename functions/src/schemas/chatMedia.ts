import { z } from 'zod';

// Server-side validation for sendChatMediaMessage (API_CONTRACT §3.4).
export const APPROVED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const APPROVED_VIDEO_MIME_TYPES = ['video/webm', 'video/mp4'] as const;

export const DEFAULT_MEDIA_MAX_BYTES = 25 * 1024 * 1024;

export const sendChatMediaMessageSchema = z.object({
  chatId: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  fileMimeType: z.enum([...APPROVED_IMAGE_MIME_TYPES, ...APPROVED_VIDEO_MIME_TYPES]),
  fileSizeBytes: z.number().int().positive(),
  clientMessageId: z.string().trim().min(1).max(128).optional(),
});

export type SendChatMediaMessageInput = z.infer<typeof sendChatMediaMessageSchema>;
