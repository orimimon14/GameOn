import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { startCall } from './callService';
import { useCallStore } from './callStore';
import {
  clearTyping,
  loadChatPartnerProfiles,
  markChatRead,
  signalTyping,
  resolveMediaUrl,
  sendImageMessage,
  sendTextMessage,
  sendVideoMessage,
  subscribeMessages,
  subscribeMyChats,
  unreadCountFor,
} from './chatApi';
import { VideoMessageRecorder } from './VideoMessageRecorder';

import { PublicProfileSheet } from '@/features/profile/PublicProfileSheet';
import { MediaLightbox } from '@/shared/components/MediaLightbox';
import { blockUser, createReport, type ReportReason } from '@/features/safety/safetyApi';
import type { CallType } from '@/shared/enums';
import type { ChatDocument, MessageDocument, PublicProfileDocument } from '@/shared/models';
import { useUserStore } from '@/shared/store/userStore';

// P4-T01/02/03 + ADR-041 proposal — real-time chat between matched users:
// chat list + messages via Firestore subscriptions, text send under rules,
// and live voice/video calls over WebRTC (callService).
type ChatStatus = 'loading' | 'ready' | 'error';

const MediaBubble: React.FC<{ message: MessageDocument }> = ({ message }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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
  const type = message.type === 'video' ? 'video' : 'image';
  return (
    <div className="relative">
      {expanded && <MediaLightbox type={type} url={url} onClose={() => setExpanded(false)} />}
      {type === 'video' ? (
        <video src={url} controls playsInline className="rounded-xl max-h-72 w-full bg-black" />
      ) : (
        <button onClick={() => setExpanded(true)} className="block w-full">
          <img src={url} alt="" className="rounded-xl max-h-72 w-full object-cover" />
        </button>
      )}
      <button
        onClick={() => setExpanded(true)}
        aria-label={t('media.expand')}
        className="absolute top-2 start-2 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-primary transition-colors flex items-center justify-center"
      >
        <i className="fa-solid fa-up-right-and-down-left-from-center text-xs"></i>
      </button>
    </div>
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
  const [reporting, setReporting] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [showProUpsell, setShowProUpsell] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [viewingPartner, setViewingPartner] = useState(false);
  const activeCall = useCallStore((s) => s.activeCall);
  const setActiveCall = useCallStore((s) => s.setActiveCall);
  const [callError, setCallError] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  // Typing signal throttle + freshness ticker for the partner's indicator.
  const lastTypingSentRef = useRef(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!uid) return;
    return subscribeMyChats(
      uid,
      (nextChats) => {
        setChats(nextChats.filter((chat) => chat.isActive !== false));
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

  const openChat = useCallback(
    (chatId: string | null) => {
      setMessages([]);
      setSelectedChatId(chatId);
      if (chatId && uid) void markChatRead(chatId, uid).catch(() => undefined);
    },
    [uid],
  );

  // Messages that arrive while this chat is open are read immediately —
  // the counter increments server-side, so zero it again as it lands.
  useEffect(() => {
    if (!uid || !selectedChatId) return;
    const open = chats.find((c) => c.chatId === selectedChatId);
    if (open && unreadCountFor(open, uid) > 0) {
      void markChatRead(selectedChatId, uid).catch(() => undefined);
    }
  }, [chats, selectedChatId, uid]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, selectedChatId]);

  const partnerOf = useCallback(
    (chat: ChatDocument): PublicProfileDocument | undefined =>
      partners[chat.participants.find((p) => p !== uid) ?? ''],
    [partners, uid],
  );

  const selectedChat = chats.find((c) => c.chatId === selectedChatId) ?? null;
  const selectedPartner = selectedChat ? partnerOf(selectedChat) : undefined;
  // Read receipts: my message is "read" once the partner's lastReadAt
  // (live via the chats subscription) passes its createdAt.
  const partnerUid = selectedChat?.participants.find((participant) => participant !== uid);
  const partnerReadMillis =
    (partnerUid ? selectedChat?.lastReadAt?.[partnerUid] : undefined)?.toMillis?.() ?? 0;
  const partnerTypingMillis =
    (partnerUid ? selectedChat?.typing?.[partnerUid] : undefined)?.toMillis?.() ?? 0;
  const partnerIsTyping = nowTick - partnerTypingMillis < 6000;

  // Tick every 2s while a chat is open so a stale typing stamp expires
  // visually even without new snapshots.
  useEffect(() => {
    if (!selectedChatId) return;
    const interval = setInterval(() => setNowTick(Date.now()), 2000);
    return () => clearInterval(interval);
  }, [selectedChatId]);

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!selectedChatId || !uid) return;
    if (value.trim()) {
      if (Date.now() - lastTypingSentRef.current > 2500) {
        lastTypingSentRef.current = Date.now();
        setNowTick(Date.now());
        void signalTyping(selectedChatId, uid).catch(() => undefined);
      }
    } else {
      lastTypingSentRef.current = 0;
      void clearTyping(selectedChatId, uid).catch(() => undefined);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedChatId || !uid) return;
    setSendError(false);
    setDraft('');
    lastTypingSentRef.current = 0;
    void clearTyping(selectedChatId, uid).catch(() => undefined);
    try {
      await sendTextMessage(selectedChatId, uid, text);
    } catch {
      setSendError(true);
      setDraft(text);
    }
  };

  const handleBlock = async () => {
    const partner = selectedPartner;
    if (!partner || !selectedChatId) return;
    if (!window.confirm(t('chat.safety.blockConfirm', { name: partner.displayName }))) return;
    try {
      await blockUser(partner.uid);
      setSafetyNotice(t('chat.safety.blocked', { name: partner.displayName }));
      openChat(null);
    } catch {
      setSafetyNotice(t('chat.safety.error'));
    }
  };

  const handleReport = async (reason: ReportReason) => {
    const partner = selectedPartner;
    setReporting(false);
    if (!partner || !uid || !selectedChatId) return;
    try {
      await createReport(uid, partner.uid, reason, { chatId: selectedChatId });
      setSafetyNotice(t('chat.safety.reported'));
    } catch {
      setSafetyNotice(t('chat.safety.error'));
    }
  };

  const handleVideoMessageClick = () => {
    if (isPro) {
      setRecording(true);
    } else {
      setShowProUpsell(true);
    }
  };

  // Photo attachment — Pro-only like all chat media (ADR-041).
  const handlePickImage = async (file: File | undefined) => {
    if (!file || !selectedChatId || !uid || sendingImage) return;
    if (file.type && !file.type.startsWith('image/')) return;
    setSendingImage(true);
    setSendError(false);
    try {
      await sendImageMessage(selectedChatId, uid, file);
    } catch {
      setSendError(true);
    } finally {
      setSendingImage(false);
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
      setActiveCall(call, selectedPartner?.displayName ?? '');
    } catch {
      setCallError(true);
    }
  };

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
      {viewingPartner && selectedPartner && (
        <PublicProfileSheet profile={selectedPartner} onClose={() => setViewingPartner(false)} />
      )}

      {recording && selectedChatId && uid && (
        <VideoMessageRecorder
          onSend={(blob) => sendVideoMessage(selectedChatId, uid, blob)}
          onClose={() => setRecording(false)}
        />
      )}

      {reporting && (
        <div
          role="dialog"
          aria-label={t('chat.safety.reportTitle')}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="w-full max-w-sm bg-surface/95 border border-white/10 rounded-3xl p-6 text-right">
            <h3 className="text-white font-black text-xl mb-4">{t('chat.safety.reportTitle')}</h3>
            <div className="flex flex-col gap-2">
              {(['harassment', 'hate_speech', 'sexual_content', 'scam_spam', 'fake_profile', 'other'] as const).map(
                (reason) => (
                  <button
                    key={reason}
                    onClick={() => void handleReport(reason)}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-primary text-white text-sm font-bold transition-all"
                  >
                    {t(`chat.safety.reasons.${reason}`)}
                  </button>
                ),
              )}
              <button
                onClick={() => setReporting(false)}
                className="w-full py-2.5 rounded-xl text-text-muted text-sm font-bold hover:text-white transition-all"
              >
                {t('chat.videoMessage.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation panel */}
      <div
        className={`flex-1 min-w-0 flex flex-col h-full dark:bg-background/40 bg-white/40 backdrop-blur-md border-l dark:border-white/5 border-gray-200 transition-all ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}
      >
        {selectedChat ? (
          <>
            <div className="h-20 flex items-center px-3 sm:px-6 gap-2 border-b dark:border-white/5 border-gray-200 shrink-0">
              <button
                onClick={() => openChat(null)}
                aria-label={t('chat.back')}
                className="md:hidden ml-4 dark:text-white text-text-inverse"
              >
                <i className="fa-solid fa-arrow-right text-xl"></i>
              </button>
              <button
                onClick={() => selectedPartner && setViewingPartner(true)}
                aria-label={selectedPartner?.displayName ?? ''}
                className="flex items-center gap-3 text-right flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full overflow-hidden border-2 border-primary shadow-glow bg-primary/30 flex items-center justify-center">
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
                <div className="min-w-0">
                  <h3 className="font-bold dark:text-white text-text-inverse text-lg truncate">
                    {selectedPartner?.displayName ?? ''}
                  </h3>
                  {partnerIsTyping ? (
                    <span className="text-xs text-green-400 font-bold truncate block animate-pulse">{t('chat.typing')}</span>
                  ) : (
                    <span className="text-xs text-text-muted font-bold truncate block">{selectedChat.gameName}</span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button
                  onClick={() => setReporting(true)}
                  aria-label={t('chat.safety.report')}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-yellow-500 text-white flex items-center justify-center transition-all"
                >
                  <i className="fa-solid fa-flag"></i>
                </button>
                <button
                  onClick={() => void handleBlock()}
                  aria-label={t('chat.safety.block')}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-danger text-white flex items-center justify-center transition-all"
                >
                  <i className="fa-solid fa-ban"></i>
                </button>
                <button
                  onClick={() => void handleStartCall('voice')}
                  disabled={!!activeCall}
                  aria-label={t('chat.call.startVoice')}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button
                  onClick={() => void handleStartCall('video')}
                  disabled={!!activeCall}
                  aria-label={t('chat.call.startVideo')}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <i className="fa-solid fa-video"></i>
                </button>
              </div>
            </div>

            {safetyNotice && (
              <p role="status" className="text-yellow-400 font-bold text-sm py-2 text-center">
                {safetyNotice}
              </p>
            )}
            {callError && (
              <p role="alert" className="text-danger font-bold text-sm py-2 text-center">
                {t('chat.call.error')}
              </p>
            )}

            <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
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
                      <div className="text-[10px] mt-1 opacity-60 text-left flex items-center gap-1">
                        {isMe && (
                          <span
                            title={t(
                              message.createdAt && message.createdAt.toMillis() <= partnerReadMillis
                                ? 'chat.read'
                                : 'chat.sent',
                            )}
                            className={
                              message.createdAt && message.createdAt.toMillis() <= partnerReadMillis
                                ? 'text-sky-300'
                                : 'text-white/60'
                            }
                          >
                            <i
                              className={`fa-solid ${
                                message.createdAt && message.createdAt.toMillis() <= partnerReadMillis
                                  ? 'fa-check-double'
                                  : 'fa-check'
                              }`}
                            ></i>
                          </span>
                        )}
                        <span>{formatTime(message)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                className="flex gap-2 sm:gap-3"
              >
                <button
                  type="button"
                  onClick={handleVideoMessageClick}
                  aria-label={t('chat.videoMessage.record')}
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all relative"
                >
                  <i className="fa-solid fa-video text-lg"></i>
                  {!isPro && (
                    <span className="absolute -top-1 -left-1 text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black px-1.5 py-0.5 rounded-full uppercase">
                      Pro
                    </span>
                  )}
                </button>
                <label
                  aria-label={t('chat.imageMessage.attach')}
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all relative cursor-pointer"
                  onClick={(e) => {
                    if (!isPro) {
                      e.preventDefault();
                      setShowProUpsell(true);
                    }
                  }}
                >
                  {sendingImage ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="fa-solid fa-image text-lg"></i>
                  )}
                  {!isPro && (
                    <span className="absolute -top-1 -left-1 text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black px-1.5 py-0.5 rounded-full uppercase">
                      Pro
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={sendingImage || !isPro}
                    onChange={(e) => {
                      void handlePickImage(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                <input
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  placeholder={t('chat.inputPlaceholder')}
                  maxLength={2000}
                  className="flex-1 min-w-0 dark:bg-black/20 bg-white/50 border dark:border-white/10 border-gray-200 rounded-2xl px-4 sm:px-5 py-3 dark:text-white text-text-inverse focus:outline-none focus:border-primary transition-all text-right shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label={t('chat.send')}
                  className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
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
              const unread = uid ? unreadCountFor(chat, uid) : 0;
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
                  <div className="relative shrink-0">
                    {unread > 0 && !isSelected && (
                      <span
                        aria-label={t('chat.unreadCount', { count: unread })}
                        className="absolute -top-1 -end-1 z-10 min-w-[22px] h-[22px] px-1.5 rounded-full bg-danger text-white text-xs font-black flex items-center justify-center border-2 border-background"
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
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
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold truncate text-base">{partner?.displayName ?? ''}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                        {chat.gameName}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        isSelected
                          ? 'text-white/80'
                          : unread > 0
                            ? 'font-bold dark:text-white text-text-inverse'
                            : 'text-text-muted'
                      }`}
                    >
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
