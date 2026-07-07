import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { GeminiSquadEngine } from '@/features/ai/GeminiSquadEngine';
import { signOutUser } from '@/features/auth/authService';
import { initAuthListener } from '@/features/auth/authStore';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ChatView } from '@/features/chat/ChatView';
import { GamesView } from '@/features/discovery/GamesView';
import { SwipeView } from '@/features/discovery/SwipeView';
import { LikesGrid } from '@/features/matches/LikesGrid';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { RequireOnboarding } from '@/features/onboarding/RequireOnboarding';
import { MyProfilePage } from '@/features/profile/MyProfilePage';
import { ProfileView } from '@/features/profile/ProfileView';
import { SettingsView } from '@/features/profile/SettingsView';
import { ShopView } from '@/features/shop/ShopView';
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
  const [userProfile, setUserProfile] = useState<GamerProfile>(currentUserProfile);
  const [globalBackground, setGlobalBackground] = useState<string | null>(null);
  const [isGlobalBgEnabled, setIsGlobalBgEnabled] = useState(true);

  const isDarkMode = useUiStore((s) => s.isDarkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const setSelectedGame = useUiStore((s) => s.setSelectedGame);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode ? 'dark overflow-hidden' : 'light overflow-hidden';
  }, [isDarkMode]);

  const path = location.pathname;
  const viewTitle = t(TITLE_KEYS[path] ?? 'common.appName');

  const handleNavigate = (to: string) => {
    setViewingProfile(null);
    navigate(to);
  };

  const currentBg = isGlobalBgEnabled
    ? globalBackground || userProfile.bannerImage
    : path === '/profile'
      ? viewingProfile?.bannerImage || userProfile.bannerImage
      : null;

  const isColorBackground = (bg: string | null | undefined) => {
    if (!bg) return false;
    return bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('linear-gradient');
  };

  return (
    <div className={`h-screen w-full relative font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-background text-text' : 'bg-slate-100 text-text-inverse'}`}>
      {/* Background Layer */}
      {currentBg && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {isColorBackground(currentBg) ? (
            <div style={{ background: currentBg }} className="w-full h-full opacity-40 bg-moving" />
          ) : (
            <img src={currentBg} className="w-full h-full object-cover opacity-25 blur-[2px] bg-moving" alt="" />
          )}
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-background/30 via-background/85 to-background' : 'bg-gradient-to-b from-slate-100/30 via-slate-100/85 to-slate-100'}`}></div>
        </div>
      )}

      <SideNav activePath={path} userProfile={userProfile} onNavigate={handleNavigate} />

      <div className="h-full w-full me-[100px] flex flex-col relative z-10">
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
                <SubscriptionsView onSelectPlan={(plan) => alert(`נרשמת בהצלחה לתוכנית ${plan}!`)} />
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
