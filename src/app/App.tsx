import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { GeminiSquadEngine } from '@/features/ai/GeminiSquadEngine';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ChatView } from '@/features/chat/ChatView';
import { GamesView } from '@/features/discovery/GamesView';
import { SwipeView } from '@/features/discovery/SwipeView';
import { LikesGrid } from '@/features/matches/LikesGrid';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { ProfileView } from '@/features/profile/ProfileView';
import { SettingsView } from '@/features/profile/SettingsView';
import { ShopView } from '@/features/shop/ShopView';
import { SubscriptionsView } from '@/features/subscription/SubscriptionsView';
import { Header } from '@/shared/components/Header';
import { SideNav } from '@/shared/components/SideNav';
import { currentUserProfile, matchedProfiles, profilesWhoLikedUser } from '@/shared/mockData';
import { useUiStore } from '@/shared/store/uiStore';
import { BackgroundItem, GamerProfile } from '@/shared/types';

const VIEW_TITLES: Record<string, string> = {
  '/discover': 'התאמות חדשות',
  '/likes': 'מי אהב אותך',
  '/shop': 'חנות סטייל',
  '/chat': 'הודעות',
  '/settings': 'הגדרות',
  '/profile': 'פרופיל אישי',
  '/games': 'בחירת משחק',
  '/subscriptions': 'שדרג ל-Premium',
  '/ai': 'מנוע הסקוואד',
};

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewingProfile, setViewingProfile] = useState<GamerProfile | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<GamerProfile[]>([]);
  const [userProfile, setUserProfile] = useState<GamerProfile>(currentUserProfile);
  const [userCoins, setUserCoins] = useState(1000000);
  const [globalBackground, setGlobalBackground] = useState<string | null>(null);
  const [isGlobalBgEnabled, setIsGlobalBgEnabled] = useState(true);
  const [ownedItems, setOwnedItems] = useState<BackgroundItem[]>([]);

  const isDarkMode = useUiStore((s) => s.isDarkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const selectedGame = useUiStore((s) => s.selectedGame);
  const setSelectedGame = useUiStore((s) => s.setSelectedGame);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.className = isDarkMode ? 'dark overflow-hidden' : 'light overflow-hidden';
  }, [isDarkMode]);

  const path = location.pathname;
  const viewTitle = VIEW_TITLES[path] ?? 'Swish & Game';

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

  const handlePurchase = (item: BackgroundItem) => {
    if (userCoins >= item.price) {
      if (ownedItems.find((b) => b.id === item.id)) {
        alert('הצבע הזה כבר נמצא באוסף שלך!');
        return;
      }
      setUserCoins((prev) => prev - item.price);
      setOwnedItems((prev) => [...prev, item]);

      if (item.itemType === 'background') {
        setUserProfile((prev) => ({ ...prev, bannerImage: item.previewUrl }));
        if (isGlobalBgEnabled) setGlobalBackground(item.previewUrl);
      } else if (item.itemType === 'avatar-border') {
        setUserProfile((prev) => ({ ...prev, avatarBorder: item.previewUrl }));
      }

      alert('הרכישה הושלמה בהצלחה!');
    } else {
      alert('אין לך מספיק מטבעות לרכישה זו.');
    }
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

      <div className="h-full w-full mr-[100px] flex flex-col relative z-10">
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
            <Route
              path="/discover"
              element={
                <SwipeView
                  onLike={(p) => setLikedProfiles([...likedProfiles, p])}
                  onViewProfile={(p) => {
                    setViewingProfile(p);
                    navigate('/profile');
                  }}
                  selectedGame={selectedGame}
                />
              }
            />
            <Route
              path="/shop"
              element={<ShopView onPurchase={handlePurchase} userCoins={userCoins} ownedItems={ownedItems} />}
            />
            <Route
              path="/chat"
              element={<ChatView matches={matchedProfiles} onBack={() => handleNavigate('/discover')} />}
            />
            <Route
              path="/likes"
              element={
                <LikesGrid
                  profiles={profilesWhoLikedUser}
                  onProfileClick={(p) => {
                    setViewingProfile(p);
                    navigate('/profile');
                  }}
                  onMatch={(p) => {
                    alert(`התאמת עם ${p.name}!`);
                    handleNavigate('/chat');
                  }}
                />
              }
            />
            <Route
              path="/games"
              element={
                <GamesView
                  onSelectGame={(gameName) => {
                    setSelectedGame(gameName);
                    handleNavigate('/discover');
                  }}
                />
              }
            />
            <Route
              path="/subscriptions"
              element={
                <SubscriptionsView
                  onSelectPlan={(plan) => alert(`נרשמת בהצלחה לתוכנית ${plan}!`)}
                  onUpdateCoins={(amount) => setUserCoins((prev) => prev + amount)}
                />
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
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProfileView
                  profile={viewingProfile || userProfile}
                  onSave={setUserProfile}
                  isOwnProfile={!viewingProfile}
                  onReturnToLobby={() => handleNavigate('/discover')}
                  isGlobalBackground={globalBackground === (viewingProfile?.bannerImage || userProfile.bannerImage)}
                  onSetGlobalBackground={(url) => setGlobalBackground(url || null)}
                  ownedBackgrounds={ownedItems}
                />
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

export const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route element={<RequireAuth />}>
      <Route path="/*" element={<AppShell />} />
    </Route>
  </Routes>
);
