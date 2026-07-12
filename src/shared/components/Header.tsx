
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { disablePushDevice, isPushLocallyDisabled, pushPermissionState, registerPushDevice, setPushLocallyDisabled, unlockAudio } from '@/features/notifications/pushApi';
import { loadMyChatsOnce } from '@/features/chat/chatApi';
import { loadLikesYou } from '@/features/matches/likesApi';
import { useUserStore } from '@/shared/store/userStore';
import { GamerProfile } from '@/shared/types';

interface HeaderProps {
  viewTitle: string;
  userProfile: GamerProfile;
  onOpenSubscriptions: () => void;
  onOpenProfile: () => void;
  onOpenChat: () => void;
  onOpenSearch: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewTitle,
  onOpenSubscriptions,
  onOpenProfile, 
  onOpenChat, 
  onOpenSearch,
  showBackButton, 
  onBack 
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const navigate = useNavigate();
  const pushUid = useUserStore((s) => s.userDoc?.uid);
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(!isPushLocallyDisabled());

  // The bell toggle is the real push opt-out/in (notifications are on by default).
  const toggleNotifications = (enabled: boolean) => {
    setAreNotificationsEnabled(enabled);
    if (!pushUid) return;
    if (enabled) {
      unlockAudio();
      setPushLocallyDisabled(false);
      void registerPushDevice(pushUid).catch(() => undefined);
    } else {
      void disablePushDevice(pushUid).catch(() => undefined);
    }
  };
  // Real events: pending inbound likes + latest incoming chat messages.
  const [notifications, setNotifications] = useState<
    Array<{ id: string; text: string; type: string; time: string; read: boolean }>
  >([]);

  useEffect(() => {
    if (!pushUid) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [likes, chats] = await Promise.all([
          loadLikesYou(pushUid),
          loadMyChatsOnce(pushUid),
        ]);
        if (cancelled) return;
        const seenIds = new Set(JSON.parse(localStorage.getItem('swish_seen_notifs') ?? '[]') as string[]);
        const items = [
          ...likes.map((like) => ({
            id: `like_${like.profile.uid}`,
            text: t('notifications.likeText', { name: like.profile.displayName }),
            type: 'like',
            time: '',
            read: seenIds.has(`like_${like.profile.uid}`),
          })),
          ...chats
            .filter((c) => c.lastMessage && c.lastMessageSenderId && c.lastMessageSenderId !== pushUid)
            .map((c) => ({
              id: `msg_${c.chatId}_${c.lastTimestamp?.toMillis() ?? 0}`,
              text: t('notifications.messageText', { preview: (c.lastMessage ?? '').slice(0, 40) }),
              type: 'message',
              time: c.lastTimestamp ? c.lastTimestamp.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '',
              read: seenIds.has(`msg_${c.chatId}_${c.lastTimestamp?.toMillis() ?? 0}`),
            })),
        ].slice(0, 10);
        setNotifications(items);
      } catch {
        // notifications center is best-effort
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [pushUid, isNotifMenuOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    localStorage.setItem('swish_seen_notifs', JSON.stringify(notifications.map((n) => n.id)));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setIsNotifMenuOpen(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'match': return <i className="fa-solid fa-heart text-danger"></i>;
      case 'message': return <i className="fa-solid fa-comment text-sky-500"></i>;
      case 'like': return <i className="fa-solid fa-fire text-orange-500"></i>;
      default: return <i className="fa-solid fa-bell text-primary"></i>;
    }
  };

  return (
    <header className="relative w-full h-20 dark:bg-background/90 bg-white/90 backdrop-blur-xl border-b dark:border-white/5 border-gray-200 shadow-sm shrink-0 flex items-center justify-between px-6 z-40">
      
        {/* Right Side Controls (Hamburger and Notifications) */}
        <div className="flex items-center gap-3 z-10"> 
          {showBackButton ? (
              <button 
                onClick={onBack} 
                className="w-11 h-11 flex items-center justify-center dark:text-white text-text-inverse hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-90"
              >
                  <i className="fa-solid fa-arrow-right text-xl"></i>
              </button>
          ) : (
            <>
               <button 
                onClick={() => { setIsMenuOpen(!isMenuOpen); setIsNotifMenuOpen(false); }}
                className={`w-11 h-11 flex items-center justify-center dark:text-white text-text-inverse rounded-full transition-all active:scale-90 ${isMenuOpen ? 'bg-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              >
                  <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
              </button>

               <div className="relative">
                 <button 
                  onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsMenuOpen(false); if (!isNotifMenuOpen && areNotificationsEnabled) markAllAsRead(); }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all active:scale-90 ${isNotifMenuOpen ? 'bg-white/10 text-primary' : 'dark:text-white text-text-inverse hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                   <i className={`fa-solid ${areNotificationsEnabled ? 'fa-bell' : 'fa-bell-slash text-text-muted'} text-xl transition-all`}></i>
                   {areNotificationsEnabled && unreadCount > 0 && (
                     <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-danger rounded-full border-2 dark:border-background border-white animate-pulse flex items-center justify-center text-[8px] text-white font-black">
                       {unreadCount}
                     </span>
                   )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifMenuOpen(false)}></div>
                    <div className="absolute top-14 right-0 w-80 dark:bg-surface/95 bg-white/95 backdrop-blur-2xl rounded-[28px] shadow-2xl border dark:border-white/10 border-gray-200 z-50 overflow-hidden animate-pop origin-top-right">
                        
                        <div className="p-4 border-b dark:border-white/5 border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={() => toggleNotifications(!areNotificationsEnabled)}
                                className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${areNotificationsEnabled ? 'bg-primary' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${areNotificationsEnabled ? 'left-5' : 'left-1'}`}></div>
                            </button>
                            <span className="text-[10px] font-black uppercase text-text-muted">{t('notifications.label')}</span>
                          </div>
                          <h4 className="font-black text-white italic uppercase text-sm">{t('notifications.center')}</h4>
                        </div>

                        {/* Live push status — the honest state of THIS device */}
                        <div className="px-4 py-2 border-b dark:border-white/5 border-gray-100 text-[10px] font-bold text-text-muted text-right">
                          {(() => {
                            const s = pushPermissionState();
                            if (s === 'granted') return t('notifications.statusGranted');
                            if (s === 'denied') return t('notifications.statusDenied');
                            if (s === 'unsupported') return t('notifications.statusUnsupported');
                            return t('notifications.statusPending');
                          })()}
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto no-scrollbar">
                          {!areNotificationsEnabled ? (
                             <div className="p-10 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-bell-slash text-2xl text-text-muted"></i>
                                </div>
                                <p className="font-bold text-white mb-1">{t('notifications.offTitle')}</p>
                                <p className="text-xs text-text-muted">{t('notifications.offNote')}</p>
                                <button 
                                    onClick={() => toggleNotifications(true)}
                                    className="mt-4 px-6 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-full shadow-glow"
                                >
                                    {t('notifications.enableNow')}
                                </button>
                             </div>
                          ) : notifications.length > 0 ? (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setIsNotifMenuOpen(false);
                                  navigate(n.type === 'like' ? '/likes' : '/chat');
                                }}
                                className={`p-4 flex items-start gap-4 hover:bg-white/5 transition-colors border-b dark:border-white/5 border-gray-50 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                                <div className="text-right flex-1">
                                  <p className={`text-sm ${!n.read ? 'text-white font-bold' : 'text-gray-400'}`}>{n.text}</p>
                                  <span className="text-[10px] text-text-muted font-medium">{n.time}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                  {getNotifIcon(n.type)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-10 text-center opacity-30 flex flex-col items-center">
                              <i className="fa-solid fa-bell-slash text-4xl mb-3"></i>
                              <p className="font-bold">{t('notifications.empty')}</p>
                            </div>
                          )}
                        </div>

                        {areNotificationsEnabled && notifications.length > 0 && (
                          <div className="p-3 bg-black/10">
                            <button onClick={clearNotifications} className="w-full py-2 text-[10px] font-black uppercase text-text-muted hover:text-white transition-colors">
                              {t('notifications.clearAll')}
                            </button>
                          </div>
                        )}
                    </div>
                  </>
                )}
               </div>
            </>
          )}
        </div>

        {/* Title/Brand - CENTERED */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="font-sans font-black text-2xl tracking-tighter dark:text-white text-text-inverse drop-shadow-lg whitespace-nowrap italic uppercase leading-none">
                {viewTitle}
            </h1>
            <div className="h-1 w-8 bg-primary rounded-full mt-1 opacity-50"></div>
        </div>

        {/* Pro Button / Premium Status */}
        <div className="flex items-center">
            <button 
              onClick={onOpenSubscriptions}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-[10px] px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform uppercase italic"
            >
                <span>Premium</span>
                <i className="fa-solid fa-crown"></i>
            </button>
        </div>

        {/* Dropdown Menu (The Three Lines Content) */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute top-16 right-6 w-72 dark:bg-surface/95 bg-white/95 backdrop-blur-2xl rounded-[28px] shadow-2xl border dark:border-white/10 border-gray-200 z-50 overflow-hidden animate-pop origin-top-right p-3">
                <div className="flex flex-col gap-1">
                  <div className="px-4 py-3 mb-2 border-b dark:border-white/5 border-gray-100">
                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">{t('notifications.quickMenu')}</p>
                  </div>
                  
                  <button onClick={() => {onOpenProfile(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between dark:text-white text-text-inverse font-bold transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <i className="fa-solid fa-user text-sm"></i>
                    </div>
                    <span>{t('notifications.myProfile')}</span>
                  </button>

                  <button onClick={() => {onOpenChat(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between dark:text-white text-text-inverse font-bold transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <i className="fa-solid fa-comment text-sm"></i>
                    </div>
                    <span>{t('notifications.messages')}</span>
                  </button>

                  <button onClick={() => {onOpenSearch(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between dark:text-white text-text-inverse font-bold transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <i className="fa-solid fa-layer-group text-sm"></i>
                    </div>
                    <span>{t('notifications.games')}</span>
                  </button>

                  <div className="w-full h-[1px] dark:bg-white/5 bg-gray-100 my-2"></div>

                  <button onClick={() => {onOpenSubscriptions(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-500/30 flex items-center justify-between group hover:from-yellow-400 hover:to-amber-500 transition-all shadow-lg shadow-yellow-500/10">
                    <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center group-hover:bg-white group-hover:text-yellow-500 transition-colors shadow-glow">
                      <i className="fa-solid fa-crown text-sm"></i>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-amber-500 group-hover:text-black transition-colors uppercase italic text-sm">{t('notifications.upgrade')}</span>
                      <span className="text-[9px] text-text-muted group-hover:text-black/60 transition-colors">{t('notifications.upgradeNote')}</span>
                    </div>
                  </button>
                  
                  <div className="mt-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                    <p className="text-[10px] text-center font-bold text-text-muted italic uppercase">Swish & Game v2.5.5</p>
                  </div>
                </div>
            </div>
          </>
        )}
    </header>
  );
};

