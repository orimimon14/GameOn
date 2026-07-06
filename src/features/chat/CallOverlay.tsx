import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ActiveCall } from './callService';

// ADR-041 proposal — full-screen in-call UI: remote video (or voice avatar),
// local preview, mute / camera / hang-up controls.
interface CallOverlayProps {
  call: ActiveCall;
  partnerName: string;
  onHangUp: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ call, partnerName, onHangUp }) => {
  const { t } = useTranslation();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(call.type === 'voice');

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = call.localStream;
    if (remoteRef.current) remoteRef.current.srcObject = call.remoteStream;
  }, [call]);

  const toggleMute = () => {
    call.localStream.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    call.localStream.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });
    setCameraOff((prev) => !prev);
  };

  return (
    <div role="dialog" aria-label={t('chat.call.inCall')} className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />

        <div className="absolute top-6 inset-x-0 text-center">
          <h3 className="text-white text-2xl font-black italic uppercase drop-shadow-lg">{partnerName}</h3>
          <p className="text-white/60 text-sm font-bold">
            {t(call.type === 'video' ? 'chat.call.videoCall' : 'chat.call.voiceCall')}
          </p>
        </div>

        {call.type === 'video' && (
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-6 left-6 w-32 aspect-[3/4] object-cover rounded-2xl border-2 border-white/20 shadow-2xl"
          />
        )}
      </div>

      <div className="p-6 flex items-center justify-center gap-4 bg-black/80">
        <button
          onClick={toggleMute}
          aria-label={t(muted ? 'chat.call.unmute' : 'chat.call.mute')}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
            muted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <i className={`fa-solid ${muted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>

        {call.type === 'video' && (
          <button
            onClick={toggleCamera}
            aria-label={t(cameraOff ? 'chat.call.cameraOn' : 'chat.call.cameraOff')}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
              cameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <i className={`fa-solid ${cameraOff ? 'fa-video-slash' : 'fa-video'}`}></i>
          </button>
        )}

        <button
          onClick={onHangUp}
          aria-label={t('chat.call.hangUp')}
          className="w-16 h-16 rounded-full bg-danger text-white flex items-center justify-center text-2xl hover:scale-105 transition-all shadow-lg"
        >
          <i className="fa-solid fa-phone-slash"></i>
        </button>
      </div>
    </div>
  );
};
