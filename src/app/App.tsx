import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { GeminiSquadEngine } from '@/features/ai/GeminiSquadEngine';
import { signOutUser } from '@/features/auth/authService';
import { initAuthListener } from '@/features/auth/authStore';
import { startUpdateWatcher } from '@/shared/api/appUpdate';
import { startIosViewportFix } from '@/shared/api/iosViewportFix';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { CallManager } from '@/features/chat/CallManager';
import { subscribeMyChats, unreadCountFor } from '@/features/chat/chatApi';
import { ChatView } from '@/features/chat/ChatView';
import { GamesView } from '@/features/discovery/GamesView';
import { SwipeView } from '@/features/discovery/SwipeView';
import { LikesGrid } from '@/features/matches/LikesGrid';
import { isPushLocallyDisabled, listenForegroundPush, pushPermissionState, registerPushDevice, unlockAudio } from '@/features/notifications/pushApi';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { RequireOnboarding } from '@/features/onboarding/RequireOnboarding';
import { MyProfilePage } from '@/features/profile/MyProfilePage';
import { ProfileView } from '@/features/profile/ProfileView';
import { SettingsView } from '@/features/profile/SettingsView';
import { ShopView } from '@/features/shop/ShopView';
import { useCosmetics } from '@/features/shop/useCosmetics';
import { SubscriptionsView } from '@/features/subscription/SubscriptionsView';
import { Header } from '@/shared/components/Header';
import { SideNav } from '@/shared/components/SideNav';
import { useLocale } from '@/shared/i18n/useLocale';
import { currentUserProfile } from '@/shared/mockData';
import { useUiStore } from '@/shared/store/uiStore';
import { useUserStore } from '@/shared/store/userStore';
import { GamerProfile } from '@/shared/types';

const TITLE_KEYS: Record<string, string> = {
  '/discover': 'titles.discover',
  '/likes': 'titles.likes',
  '/shop': 'titles.shop',
  '/chat': 'titles.chat',
  '/settings': 'titles.settings',
  '/profile': 'titles.profile',
  '/games': 'titles.games',
  '/subscriptions': 'titles.subscriptions',
  '/ai': 'titles.ai',
};

// Keeps <html lang/dir> in sync with the active locale, and applies the
// signed-in user's persisted preferredLocale from Firestore (ADR-035).
const LocaleSync: React.FC = () => {
  const { locale, setLocale, dir } = useLocale();
  const preferredLocale = useUserStore((s) => s.userDoc?.preferredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  useEffect(() => {
    if (preferredLocale && preferredLocale !== locale) {
      setLocale(preferredLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply only when the persisted value changes
  }, [preferredLocale]);

  return null;
};

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [viewingProfile, setViewingProfile] = useState<GamerProfile | null>(null);
  const userDoc = useUserStore((s) => s.userDoc);
  // Equipped cosmetics drive the real visuals (P5: purchases must be visible).
  const cosmetics = useCosmetics();
  // Live nav profile from the real users doc (mock only as a typed shell).
  const userProfile: GamerProfile = {
    ...currentUserProfile,
    name: userDoc?.displayName ?? '',
    image: userDoc?.profileImageUrl ?? '',
    bannerImage: userDoc?.bannerImageUrl ?? '',
    avatarBorder: cosmetics.borderGradient,
  } as GamerProfile;
  const setUserProfile = (_p: GamerProfile) => undefined;
  const [globalBackground, setGlobalBackground] = useState<string | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Unread dot on the chat tab: backend-maintained unreadCounts (DATA_MODEL
  // §4.7) — increments on the recipient's key, zeroed when the chat is opened.
  useEffect(() => {
    if (!userDoc?.uid) return;
    const uid = userDoc.uid;
    return subscribeMyChats(
      uid,
      (chats) =>
        setHasUnreadChat(
          chats.some((c) => c.isActive !== false && unreadCountFor(c, uid) > 0),
        ),
      () => undefined,
    );
  }, [userDoc?.uid]);
  const [isGlobalBgEnabled, setIsGlobalBgEnabled] = useState(true);

  const isDarkMode = useUiStore((s) => s.isDarkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const setSelectedGame = useUiStore((s) => s.setSelectedGame);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode ? 'dark overflow-hidden' : 'light overflow-hidden';
  }, [isDarkMode]);

  // Push notifications: register this device and ring on incoming-call
  // pushes while the app is in the foreground.
  useEffect(() => {
    if (!userDoc?.uid) return;
    const uid = userDoc.uid;
    // Notifications are on by default: already-granted devices refresh their
    // token silently; new devices get the browser permission prompt on the
    // FIRST tap anywhere (browsers require a user gesture). The header bell
    // is the opt-out switch.
    if (!isPushLocallyDisabled() && pushPermissionState() === 'granted') {
      void registerPushDevice(uid).catch(() => undefined);
    }
    const onFirstTap = () => {
      unlockAudio();
      if (!isPushLocallyDisabled() && pushPermissionState() === 'default') {
        void registerPushDevice(uid).catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', onFirstTap, { once: true });
    const stopListen = listenForegroundPush(() => undefined);
    return () => {
      window.removeEventListener('pointerdown', onFirstTap);
      stopListen();
    };
  }, [userDoc?.uid]);

  const path = location.pathname;
  const viewTitle = t(TITLE_KEYS[path] ?? 'common.appName');

  const handleNavigate = (to: string) => {
    setViewingProfile(null);
    navigate(to);
  };

  const currentBg = isGlobalBgEnabled
    ? cosmetics.backgroundGradient || globalBackground || userProfile.bannerImage
    : path === '/profile'
      ? viewingProfile?.bannerImage || userProfile.bannerImage
      : null;

  const isColorBackground = (bg: string | null | undefined) => {
    if (!bg) return false;
    return bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('linear-gradient');
  };

  return (
    <div className={`h-screen-dynamic w-full relative font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-background text-text' : 'bg-slate-100 text-text-inverse'}`}>
      {/* Background Layer */}
      {currentBg && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {isColorBackground(currentBg) ? (
            <div style={{ background: currentBg }} className="w-full h-full opacity-90 bg-moving" />
          ) : (
            <img src={currentBg} className="w-full h-full object-cover opacity-25 blur-[2px] bg-moving" alt="" />
          )}
          <div className={`absolute inset-0 ${isColorBackground(currentBg) ? (isDarkMode ? 'bg-gradient-to-b from-background/10 via-background/35 to-background/60' : 'bg-gradient-to-b from-slate-100/10 via-slate-100/35 to-slate-100/60') : isDarkMode ? 'bg-gradient-to-b from-background/30 via-background/85 to-background' : 'bg-gradient-to-b from-slate-100/30 via-slate-100/85 to-slate-100'}`}></div>
        </div>
      )}

      <CallManager />

      <SideNav activePath={path} userProfile={userProfile} onNavigate={handleNavigate} hasUnreadChat={hasUnreadChat} />

      <div className="h-full w-full md:me-[100px] pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 flex flex-col relative z-10">
        <Header
          viewTitle={viewTitle}
          userProfile={userProfile}
          onOpenSubscriptions={() => handleNavigate('/subscriptions')}
          onOpenProfile={() => handleNavigate('/profile')}
          onOpenChat={() => handleNavigate('/chat')}
          onOpenSearch={() => handleNavigate('/games')}
          showBackButton={path !== '/discover'}
          onBack={() => handleNavigate('/discover')}
        />

        <main className="flex-1 w-full overflow-hidden relative">
          <Routes>
            <Route path="/discover" element={<SwipeView />} />
            <Route path="/shop" element={<ShopView />} />
            <Route path="/chat" element={<ChatView />} />
            <Route path="/likes" element={<LikesGrid />} />
            <Route
              path="/games"
              element={
                <GamesView
                  onSelectGame={(gameId) => {
                    setSelectedGame(gameId);
                    handleNavigate('/discover');
                  }}
                />
              }
            />
            <Route
              path="/subscriptions"
              element={
                <SubscriptionsView onSelectPlan={() => alert(t('subscriptions.comingSoon'))} />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleDarkMode}
                  isGlobalBgEnabled={isGlobalBgEnabled}
                  onToggleGlobalBg={() => setIsGlobalBgEnabled(!isGlobalBgEnabled)}
                  onLogout={() => void signOutUser()}
                />
              }
            />
            <Route
              path="/profile"
              element={
                viewingProfile ? (
                  // Viewing ANOTHER user still runs on prototype mock data — replaced in Phase 3 (real discovery).
                  <ProfileView
                    profile={viewingProfile}
                    onSave={setUserProfile}
                    isOwnProfile={false}
                    onReturnToLobby={() => handleNavigate('/discover')}
                    isGlobalBackground={globalBackground === viewingProfile.bannerImage}
                    onSetGlobalBackground={(url) => setGlobalBackground(url || null)}
                    ownedBackgrounds={[]}
                  />
                ) : (
                  <MyProfilePage />
                )
              }
            />
            <Route path="/ai" element={<GeminiSquadEngine />} />
            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    initAuthListener();
    // Stale installed PWAs pick up new deploys on their own (see appUpdate).
    startUpdateWatcher();
    // iOS keyboard dismissal can leave the web view scrolled up for good,
    // stacking a growing dead strip under the bottom nav (see iosViewportFix).
    startIosViewportFix();
  }, []);

  return (
    <>
      <LocaleSync />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<RequireOnboarding />}>
            <Route path="/*" element={<AppShell />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};
