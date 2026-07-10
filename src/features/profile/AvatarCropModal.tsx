import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Circular avatar cropper: drag to position, slider/wheel to zoom — the
// circle shows exactly what the profile photo will be. Output is a square
// 1080px JPEG blob (already compressed, uploaded as-is by the caller).
interface AvatarCropModalProps {
  file: File;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void>;
  // Some phones hand over formats the browser cannot decode (e.g. HEIC on
  // Android) — the caller falls back to the direct upload path.
  onDecodeError: () => void;
}

const VIEW = 288; // crop viewport size in px
const OUT = 1080; // output square size

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  file,
  onCancel,
  onSave,
  onDecodeError,
}) => {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Deliberately never revoked: eager revocation breaks under StrictMode's
  // double-mount, and one leaked object URL per picked photo is negligible
  // (freed on page unload).
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // scale=1 means the image exactly covers the viewport on its short side.
  const baseScale = natural ? VIEW / Math.min(natural.w, natural.h) : 1;
  const scale = baseScale * zoom;
  const width = (natural?.w ?? 0) * scale;
  const height = (natural?.h ?? 0) * scale;

  const clamp = (x: number, y: number, w = width, h = height) => ({
    x: Math.min(0, Math.max(VIEW - w, x)),
    y: Math.min(0, Math.max(VIEW - h, y)),
  });

  const onImageLoad = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return onDecodeError();
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    // center the image
    const s = (VIEW / Math.min(img.naturalWidth, img.naturalHeight)) * 1;
    setPos({ x: (VIEW - img.naturalWidth * s) / 2, y: (VIEW - img.naturalHeight * s) / 2 });
  };

  const setZoomKeepingCenter = (nextZoom: number) => {
    if (!natural) return;
    const prevScale = scale;
    const nextScale = baseScale * nextZoom;
    // keep the viewport center pointing at the same image spot
    const cx = (VIEW / 2 - pos.x) / prevScale;
    const cy = (VIEW / 2 - pos.y) / prevScale;
    const next = clamp(
      VIEW / 2 - cx * nextScale,
      VIEW / 2 - cy * nextScale,
      natural.w * nextScale,
      natural.h * nextScale,
    );
    setZoom(nextZoom);
    setPos(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setPos(clamp(drag.baseX + (e.clientX - drag.startX), drag.baseY + (e.clientY - drag.startY)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !natural || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(img, -pos.x / scale, -pos.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (!blob) throw new Error('crop_failed');
      await onSave(blob);
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={t('profile.crop.title')}
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="bg-background border border-white/10 rounded-[28px] p-6 w-full max-w-sm flex flex-col items-center gap-4 shadow-2xl">
        <h2 className="text-lg font-black italic uppercase text-text text-center">
          {t('profile.crop.title')}
        </h2>
        <p className="text-text-muted text-sm text-center -mt-2">{t('profile.crop.hint')}</p>

        <div
          className="relative overflow-hidden rounded-2xl bg-black touch-none cursor-move select-none"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => setZoomKeepingCenter(Math.min(3, Math.max(1, zoom - e.deltaY * 0.002)))}
        >
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={onImageLoad}
            onError={onDecodeError}
            className="absolute top-0 left-0 max-w-none pointer-events-none"
            style={{ width: width || undefined, height: height || undefined, transform: `translate(${pos.x}px, ${pos.y}px)` }}
          />
          {/* circular mask — everything outside the circle is dimmed */}
          <div
            className="absolute rounded-full pointer-events-none border-2 border-white/80"
            style={{ inset: 0, boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)' }}
          />
        </div>

        <div className="w-full flex items-center gap-3" dir="ltr">
          <i className="fa-solid fa-magnifying-glass-minus text-text-muted text-sm"></i>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label={t('profile.crop.zoom')}
            onChange={(e) => setZoomKeepingCenter(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <i className="fa-solid fa-magnifying-glass-plus text-text-muted text-sm"></i>
        </div>

        {saveError && (
          <p role="alert" className="text-danger font-bold text-sm">{t('profile.crop.error')}</p>
        )}

        <div className="w-full flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-3 rounded-2xl font-bold bg-surface border border-white/10 text-text hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            {t('profile.cancel')}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !natural}
            className="flex-1 py-3 rounded-2xl font-black italic uppercase bg-primary text-white shadow-glow-primary hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {saving ? t('profile.saving') : t('profile.crop.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
