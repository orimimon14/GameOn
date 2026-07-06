import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Recorded video messages (ADR-041, Pro-only) — capture up to 60s from the
// camera with MediaRecorder and hand the blob back for upload.
const MAX_DURATION_MS = 60_000;

type RecorderStatus = 'starting' | 'recording' | 'uploading' | 'error';

interface VideoMessageRecorderProps {
  onSend: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export const VideoMessageRecorder: React.FC<VideoMessageRecorderProps> = ({ onSend, onClose }) => {
  const { t } = useTranslation();
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<RecorderStatus>('starting');

  const stopAndSend = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setStatus('uploading');
      try {
        await onSend(new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' }));
        onClose();
      } catch {
        setStatus('error');
      }
    };
    recorder.stop();
  };

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (previewRef.current) previewRef.current.srcObject = stream;

        const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.start();
        setStatus('recording');
        setTimeout(() => {
          if (recorderRef.current?.state === 'recording') stopAndSend();
        }, MAX_DURATION_MS);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void start();
    return () => {
      cancelled = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-label={t('chat.videoMessage.title')}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md">
        <video
          ref={previewRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[3/4] object-cover rounded-3xl border-2 border-primary/40 shadow-glow bg-black"
        />

        {status === 'error' && (
          <p role="alert" className="text-danger font-bold text-sm mt-4 text-center">
            {t('chat.videoMessage.error')}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mt-6">
          {status === 'recording' && (
            <button
              onClick={stopAndSend}
              aria-label={t('chat.videoMessage.stopSend')}
              className="px-8 h-14 rounded-full bg-primary text-white font-black uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-glow"
            >
              <span className="w-3 h-3 rounded-sm bg-white animate-pulse"></span>
              {t('chat.videoMessage.stopSend')}
            </button>
          )}
          {status === 'uploading' && (
            <div className="flex items-center gap-3 text-white font-bold">
              <div
                role="status"
                aria-label={t('chat.videoMessage.uploading')}
                className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"
              />
              {t('chat.videoMessage.uploading')}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label={t('chat.videoMessage.cancel')}
            className="px-6 h-14 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
          >
            {t('chat.videoMessage.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
