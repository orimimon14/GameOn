import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CallOverlay } from './CallOverlay';
import {
  answerCall,
  declineCall,
  startCall,
  subscribeIncomingCalls,
  type ActiveCall,
} from './callService';
import {
  loadChatPartnerProfiles,
  resolveMediaUrl,
  sendTextMessage,
  sendVideoMessage,
  subscribeMessages,
  subscribeMyChats,
} from './chatApi';
import { VideoMessageRecorder } from './VideoMessageRecorder';

import type { CallType } from '@/shared/enums';
import type { CallDocument, ChatDocument, MessageDocument, PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// P4-T01/02/03 + ADR-041 proposal — real-time chat between matched users:
// chat list + messages via Firestore subscriptions, text send under rules,
// and live voice/video calls over WebRTC (callService).
type ChatStatus = 'loading' | 'ready' | 'error';

const MediaBubble: React.FC<{ message: MessageDocument }> = ({ message }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const resolve = message.filePath
      ? resolveMediaUrl(message.filePath).catch(() => message.fileUrl ?? null)
      : Promise.resolve(message.fileUrl ?? null);
    void resolve.then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [message.filePath, message.fileUrl]);

  if (!url) {
    return <div className="w-48 h-32 rounded-xl bg-white/10 animate-pulse" />;
  }
  return message.type === 'video' ? (
    <video src={url} controls playsInline className="rounded-xl max-h-72 w-full bg-black" />
  ) : (
    <img src={url} alt="" className="rounded-xl max-h-72 w-full object-cover" />
  );
};

const formatTime = (message: MessageDocument): string =>
  message.createdAt
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

export const ChatView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uid = useUserStore((s) => s.userDoc?.uid);
  const isPro = useUserStore((s) => s.userDoc?.isPro === true);

  const [status, setStatus] = useState<ChatStatus>('loading');
  const [chats, setChats] = useState<ChatDocument[]>([]);
  const [partners, setPartners] = useState<Record<string, PublicProfileDocument>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);

  const [recording, setRecording] = useState(false);
  const [showProUpsell, setShowProUpsell] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallDocument | null>(null);
  const [callError, setCallError] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeMyChats(
      uid,
      (nextChats) => {
        setChats(nextChats);
        setStatus('ready');
        void loadChatPartnerProfiles(uid, nextChats).then((profiles) =>
          setPartners((prev) => ({ ...prev, ...profiles })),
        );
      },
      () => setStatus('error'),
    );
  }, [uid]);

  useEffect(() => {
    if (!selectedChatId) return;
    return subscribeMessages(selectedChatId, setMessages, () => setSendError(true));
  }, [selectedChatId]);

  const openChat = useCallback((chatId: string | null) => {
    setMessages([]);
    setSelectedChatId(chatId);
  }, []);

  useEffect(() => {
    if (!uid || activeCall) return;
    return subscribeIncomingCalls(uid, setIncomingCall);
  }, [uid, activeCall]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, selectedChatId]);

  const partnerOf = useCallback(
    (chat: ChatDocument): PublicProfileDocument | undefined =>
      partners[chat.participants.find((p) => p !== uid) ?? ''],
    [partners, uid],
  );

  const selectedChat = chats.find((c) => c.chatId === selectedChatId) ?? null;
  const selectedPartner = selectedChat ? partnerOf(selectedChat) : undefined;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedChatId || !uid) return;
    setSendError(false);
    setDraft('');
    try {
      await sendTextMessage(selectedChatId, uid, text);
    } catch {
      setSendError(true);
      setDraft(text);
    }
  };

  const handleVideoMessageClick = () => {
    if (isPro) {
      setRecording(true);
    } else {
      setShowProUpsell(true);
    }
  };

  const handleStartCall = async (type: CallType) => {
    if (!selectedChat || !uid || activeCall) return;
    setCallError(false);
    const calleeUid = selectedChat.participants.find((p) => p !== uid);
    if (!calleeUid) return;
    try {
      const call = await startCall(selectedChat.chatId, uid, calleeUid, type, () =>
        setActiveCall(null),
      );
      setActiveCall(call);
    } catch {
      setCallError(true);
    }
  };

  const handleAnswer = async () => {
    if (!incomingCall) return;
    setCallError(false);
    try {
      const call = await answerCall(incomingCall, () => setActiveCall(null));
      setIncomingCall(null);
      setActiveCall(call);
    } catch {
      setCallError(true);
      setIncomingCall(null);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    try {
      await declineCall(incomingCall);
    } finally {
      setIncomingCall(null);
    }
  };

  const handleHangUp = async () => {
    if (!activeCall) return;
    try {
      await activeCall.hangUp();
    } finally {
      setActiveCall(null);
    }
  };

  const incomingPartnerName = incomingCall
    ? Object.values(partners).find((p) => p.uid === incomingCall.callerUid)?.displayName ??
      t('chat.call.unknownCaller')
    : '';

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full relative z-10">
        <div
          role="status"
          aria-label={t('chat.loading')}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 relative z-10">
        <i className="fa-solid fa-triangle-exclamation text-7xl mb-6 text-danger"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">{t('chat.error')}</h3>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-transparent relative z-10">
      {recording && selectedChatId && uid && (
        <VideoMessageRecorder
          onSend={(blob) => sendVideoMessage(selectedChatId, uid, blob)}
          onClose={() => setRecording(false)}
        />
      )}

      {activeCall && (
        <CallOverlay
          call={activeCall}
          partnerName={selectedPartner?.displayName ?? ''}
          onHangUp={() => void handleHangUp()}
        />
      )}

      {incomingCall && !activeCall && (
        <div
          role="dialog"
          aria-label={t('chat.call.incomingTitle')}
          className="fixed top-6 inset-x-0 z-50 flex justify-center px-6"
        >
          <div className="w-full max-w-md bg-surface/95 backdrop-blur-xl border border-primary/40 rounded-3xl p-5 shadow-glow flex items-center gap-4">
            <div className="flex-1 text-right">
              <h4 className="text-white font-black text-lg">{incomingPartnerName}</h4>
              <p className="text-text-muted text-sm font-bold">
                {t(incomingCall.type === 'video' ? 'chat.call.incomingVideo' : 'chat.call.incomingVoice')}
              </p>
            </div>
            <button
              onClick={() => void handleAnswer()}
              aria-label={t('chat.call.accept')}
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-lg hover:scale-105 transition-all"
            >
              <i className="fa-solid fa-phone"></i>
            </button>
            <button
              onClick={() => void handleDecline()}
              aria-label={t('chat.call.decline')}
              className="w-12 h-12 rounded-full bg-danger text-white flex items-center justify-center text-lg hover:scale-105 transition-all"
            >
              <i className="fa-solid fa-phone-slash"></i>
            </button>
          </div>
        </div>
      )}

      {/* Conversation panel */}
      <div
        className={`flex-1 flex flex-col h-full dark:bg-background/40 bg-white/40 backdrop-blur-md border-l dark:border-white/5 border-gray-200 transition-all ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}
      >
        {selectedChat ? (
          <>
            <div className="h-20 flex items-center px-6 border-b dark:border-white/5 border-gray-200 shrink-0">
              <button
                onClick={() => openChat(null)}
                aria-label={t('chat.back')}
                className="md:hidden ml-4 dark:text-white text-text-inverse"
              >
                <i className="fa-solid fa-arrow-right text-xl"></i>
              </button>
              <div className="flex items-center gap-4 text-right flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-glow bg-primary/30 flex items-center justify-center">
                  {selectedPartner?.profileImageUrl ? (
                    <img
                      src={selectedPartner.profileImageUrl}
                      className="w-full h-full object-cover"
                      alt={selectedPartner.displayName}
                    />
                  ) : (
                    <span className="text-white font-black text-lg">
                      {selectedPartner?.displayName.charAt(0) ?? '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold dark:text-white text-text-inverse text-lg">
                    {selectedPartner?.displayName ?? ''}
                  </h3>
                  <span className="text-xs text-text-muted font-bold">{selectedChat.gameName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleStartCall('voice')}
                  disabled={!!activeCall}
                  aria-label={t('chat.call.startVoice')}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button
                  onClick={() => void handleStartCall('video')}
                  disabled={!!activeCall}
                  aria-label={t('chat.call.startVideo')}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <i className="fa-solid fa-video"></i>
                </button>
              </div>
            </div>

            {callError && (
              <p role="alert" className="text-danger font-bold text-sm py-2 text-center">
                {t('chat.call.error')}
              </p>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((message) => {
                const isMe = message.senderId === uid;
                return (
                  <div key={message.messageId} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-lg ${
                        isMe
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'dark:bg-surface/80 bg-white text-text-inverse rounded-tl-none border dark:border-white/5 border-gray-100'
                      }`}
                    >
                      {message.type === 'video' || message.type === 'image' ? (
                        <MediaBubble message={message} />
                      ) : (
                        <p className="text-base leading-relaxed text-right">{message.text}</p>
                      )}
                      <div className="text-[10px] mt-1 opacity-60 text-left">{formatTime(message)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t dark:border-white/5 border-gray-200 bg-transparent shrink-0">
              {sendError && (
                <p role="alert" className="text-danger font-bold text-sm mb-2 text-center">
                  {t('chat.sendError')}
                </p>
              )}
              {showProUpsell && (
                <div role="alert" className="mb-2 flex items-center justify-between gap-3 bg-yellow-400/10 border border-yellow-400/40 rounded-2xl px-4 py-3">
                  <p className="text-sm font-bold dark:text-white text-text-inverse text-right flex-1">
                    {t('chat.videoMessage.proOnly')}
                  </p>
                  <button
                    onClick={() => navigate('/subscriptions')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-black uppercase whitespace-nowrap"
                  >
                    {t('chat.videoMessage.upgrade')}
                  </button>
                  <button
                    onClick={() => setShowProUpsell(false)}
                    aria-label={t('chat.videoMessage.dismiss')}
                    className="text-text-muted hover:text-white"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex gap-3"
              >
                <button
                  type="button"
                  onClick={handleVideoMessageClick}
                  aria-label={t('chat.videoMessage.record')}
                  className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all relative"
                >
                  <i className="fa-solid fa-video text-lg"></i>
                  {!isPro && (
                    <span className="absolute -top-1 -left-1 text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black px-1.5 py-0.5 rounded-full uppercase">
                      Pro
                    </span>
                  )}
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('chat.inputPlaceholder')}
                  maxLength={2000}
                  className="flex-1 dark:bg-black/20 bg-white/50 border dark:border-white/10 border-gray-200 rounded-2xl px-5 py-3 dark:text-white text-text-inverse focus:outline-none focus:border-primary transition-all text-right shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label={t('chat.send')}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    draft.trim() ? 'bg-primary text-white shadow-glow' : 'bg-gray-400/20 text-gray-400'
                  }`}
                >
                  <i className="fa-solid fa-paper-plane text-lg"></i>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
            <i className="fa-solid fa-comments text-7xl mb-6"></i>
            <h3 className="text-2xl font-bold">{t('chat.pickChat')}</h3>
          </div>
        )}
      </div>

      {/* Chat list */}
      <div
        className={`w-full md:w-96 flex flex-col h-full dark:bg-surface/20 bg-white/20 backdrop-blur-md ${selectedChatId ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="p-6 h-20 border-b dark:border-white/5 border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-black italic uppercase dark:text-white text-text-inverse">
            {t('chat.listTitle')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {chats.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p>{t('chat.empty')}</p>
            </div>
          ) : (
            chats.map((chat) => {
              const partner = partnerOf(chat);
              const isSelected = selectedChatId === chat.chatId;
              return (
                <button
                  key={chat.chatId}
                  onClick={() => openChat(chat.chatId)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-lg'
                      : 'hover:bg-white/10 dark:text-white text-text-inverse'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-primary/30 flex items-center justify-center">
                    {partner?.profileImageUrl ? (
                      <img
                        src={partner.profileImageUrl}
                        className="w-full h-full object-cover"
                        alt={partner.displayName}
                      />
                    ) : (
                      <span className="text-white font-black text-lg">
                        {partner?.displayName.charAt(0) ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold truncate text-base">{partner?.displayName ?? ''}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                        {chat.gameName}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                      {chat.lastMessage ?? t('chat.startTalking')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
