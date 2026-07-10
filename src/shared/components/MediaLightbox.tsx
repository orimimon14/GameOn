import React from 'react';
import { useTranslation } from 'react-i18next';

// Fullscreen media viewer — opened by tapping any gallery/chat media.
// Videos play with native controls (which include the OS fullscreen button);
// images render full-size with pinch/scroll zoom left to the browser.
interface MediaLightboxProps {
  type: 'image' | 'video';
  url: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ type, url, onClose }) => {
  const { t } = useTranslation();

  return (
    <div
      role="dialog"
      aria-label={t('media.viewer')}
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {type === 'video' ? (
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={url}
          alt=""
          className="w-full h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <button
        onClick={onClose}
        aria-label={t('media.close')}
        className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors flex items-center justify-center"
      >
        <i className="fa-solid fa-xmark text-xl"></i>
      </button>
    </div>
  );
};
