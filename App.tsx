
import React, { useState, useMemo, useEffect } from 'react';
import { gamerProfiles, currentUserProfile, profilesWhoLikedUser, matchedProfiles, backgroundShopItems } from './constants';
import { GamerProfile, BackgroundItem } from './types';
import Header from './components/Header';
import ProfileView from './components/ProfileView';
import ChatView from './components/ChatView';
import ShopView from './components/ShopView';
import SettingsView from './components/SettingsView';
import GeminiSquadEngine from './components/GeminiSquadEngine';
import SubscriptionsView from './components/SubscriptionsView';
import GamesView from './components/GamesView';

// --- Types ---
type ActiveView = 'swipe' | 'likes-you' | 'games' | 'profile' | 'chat' | 'shop' | 'settings' | 'subscriptions';

// --- Sub-components ---

const LikesGrid: React.FC<{ profiles: GamerProfile[]; onProfileClick: (p: GamerProfile) => void; onMatch: (p: GamerProfile) => void }> = ({ profiles, onProfileClick, onMatch }) => (
    <div className="p-6 pt-24 pb-32 overflow-y-auto h-full max-w-6xl mx-auto relative z-10 no-scrollbar">
        <div className="text-right mb-8">
            <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase italic tracking-tighter">מי שעשה לך לייק</h2>
            <p className="dark:text-dogame-muted text-gray-500 font-bold">החזר להם לייק כדי להתחיל לדבר!</p>
        </div>
        
        {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <i className="fa-solid fa-heart-crack text-7xl mb-4"></i>
                <p className="text-xl font-bold italic uppercase">עדיין אין לייקים חדשים</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {profiles.map((profile) => (
                    <div key={profile.id} className="group relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-soft hover:scale-[1.03] transition-all duration-300 border-2 border-transparent hover:border-dogame-primary/40">
                        <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        
                        <div className="absolute inset-0 flex flex-col justify-end p-4 text-right">
                            <h3 className="text-white font-black text-xl italic uppercase mb-3">{profile.name}, {profile.age}</h3>
                            <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={() => onProfileClick(profile)}
                                    className="flex-1 py-2 bg-white/10 backdrop-blur-md text-white text-xs font-black rounded-xl hover:bg-white/20 transition-colors uppercase italic"
                                >
                                    פרופיל
                                </button>
                                <button 
                                    onClick={() => onMatch(profile)}
                                    className="w-10 h-10 flex items-center justify-center bg-dogame-primary text-white rounded-xl shadow-glow hover:scale-110 transition-transform"
                                >
                                    <i className="fa-solid fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const SideNav: React.FC<{ activeView: ActiveView; onNavigate: (v: ActiveView) => void }> = ({ activeView, onNavigate }) => {
    const items = [
        { id: 'swipe', icon: 'fa-gamepad', label: 'התאמות', bg: 'hover:bg-indigo-500' },
        { id: 'games', icon: 'fa-layer-group', label: 'משחקים', bg: 'hover:bg-emerald-500' },
        { id: 'shop', icon: 'fa-shopping-bag', label: 'חנות', bg: 'hover:bg-yellow-500' },
        { id: 'likes-you', icon: 'fa-heart', label: 'לייקים', bg: 'hover:bg-rose-500' },
        { id: 'chat', icon: 'fa-comment', label: 'צ׳אט', bg: 'hover:bg-sky-500' },
        { id: 'settings', icon: 'fa-gear', label: 'הגדרות', bg: 'hover:bg-gray-500' },
    ];
    
    return (
        <div className="fixed top-0 right-0 bottom-0 w-[72px] dark:bg-[#1E1F22]/95 bg-white/95 backdrop-blur-xl z-[60] flex flex-col items-center py-5 gap-3 border-l dark:border-white/5 border-gray-200 shadow-2xl">
             <button
                onClick={() => onNavigate('profile')}
                className={`w-12 h-12 rounded-[24px] overflow-hidden transition-all duration-300 hover:rounded-[16px] mb-4 ${activeView === 'profile' ? 'rounded-[16px] ring-2 ring-dogame-primary shadow-glow' : 'opacity-60 hover:opacity-100'}`}
            >
                <img src={currentUserProfile.image} alt="Me" className="w-full h-full object-cover" />
            </button>

             <div className="w-8 h-[2px] dark:bg-white/10 bg-gray-200 rounded-full mb-2"></div>

             {items.map(item => {
                 const isActive = activeView === item.id;
                 return (
                    <div key={item.id} className="relative flex items-center justify-center group w-full">
                        <button
                            onClick={() => onNavigate(item.id as ActiveView)}
                            className={`w-12 h-12 flex items-center justify-center transition-all duration-300 
                                ${isActive ? 'rounded-[16px] bg-dogame-primary text-white shadow-glow' : 'rounded-[24px] dark:bg-dogame-surface bg-gray-100 dark:text-gray-400 text-gray-500 hover:rounded-[16px] ' + item.bg + ' hover:text-white'}`}
                        >
                            <i className={`fa-solid ${item.icon} text-xl`}></i>
                        </button>
                        <div className={`absolute right-0 w-1 bg-dogame-primary rounded-l-lg transition-all duration-300 ${isActive ? 'h-8 opacity-100' : 'h-0 opacity-0 group-hover:h-4 group-hover:opacity-50'}`}></div>
                    </div>
                 )
             })}
        </div>
    )
};

const SwipeView: React.FC<{ onLike: (p: GamerProfile) => void }> = ({ onLike }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipedDirection, setSwipedDirection] = useState<'left' | 'right' | null>(null);
    const [showMatch, setShowMatch] = useState(false);

    const activeProfile = gamerProfiles[currentIndex];
    
    const handleSwipe = (direction: 'left' | 'right') => {
        if (!activeProfile) return;
        setSwipedDirection(direction);
        setTimeout(() => {
            if (direction === 'right') {
                onLike(activeProfile);
                if (Math.random() > 0.7) setShowMatch(true);
            }
            setCurrentIndex(prev => prev + 1);
            setSwipedDirection(null);
        }, 300);
    };

    if (!activeProfile) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 relative z-10">
            <div className="w-24 h-24 bg-dogame-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <i className="fa-solid fa-ghost text-5xl text-dogame-primary opacity-50"></i>
            </div>
            <h2 className="text-3xl font-black dark:text-white text-dogame-lightText mb-4 italic uppercase">זה הכל להיום!</h2>
            <button onClick={() => setCurrentIndex(0)} className="px-10 py-4 bg-dogame-primary text-white font-black rounded-2xl shadow-glow hover:scale-105 transition-transform italic uppercase">
                התחל מחדש
            </button>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col items-center justify-between py-6 px-4 max-w-xl mx-auto z-10 overflow-hidden relative">
             {showMatch && (
                <div className="fixed inset-0 z-[100] dark:bg-dogame-bg/95 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-pop">
                    <div className="animate-match text-center">
                        <i className="fa-solid fa-heart text-dogame-primary text-8xl mb-6 drop-shadow-glow"></i>
                        <h1 className="text-5xl font-black dark:text-white text-dogame-lightText mb-4 italic uppercase tracking-tighter">יש התאמה!</h1>
                        <button onClick={() => setShowMatch(false)} className="w-full py-5 bg-dogame-primary text-white rounded-2xl font-black text-xl shadow-glow uppercase italic hover:scale-105 transition-transform">מעולה!</button>
                    </div>
                </div>
            )}

            {/* Profile Card Container */}
            <div className="flex-1 w-full flex items-center justify-center">
                <div 
                    className={`relative w-full aspect-[3/4.5] dark:bg-dogame-surface/60 bg-white/80 backdrop-blur-md rounded-[40px] overflow-hidden shadow-2xl border dark:border-white/5 border-gray-200 transition-all duration-300 ease-out transform ${swipedDirection === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' : swipedDirection === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' : 'scale-100 opacity-100'}`}
                >
                    <img src={activeProfile.image} className="w-full h-full object-cover" alt={activeProfile.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-0 w-full p-10 text-right">
                        <h2 className="text-4xl font-black text-white italic uppercase mb-2 drop-shadow-xl">{activeProfile.name}, {activeProfile.age}</h2>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {activeProfile.games.map((g, i) => (
                                <span key={i} className="bg-dogame-primary/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{g.name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Control Buttons - FIXED & VISIBLE */}
            <div className="flex justify-center gap-12 mt-8 mb-6 shrink-0 relative">
                <button 
                    onClick={() => handleSwipe('left')} 
                    className="w-20 h-20 rounded-full dark:bg-dogame-surface/90 bg-white border-2 border-dogame-danger/30 text-dogame-danger text-3xl flex items-center justify-center shadow-2xl hover:bg-dogame-danger hover:text-white transition-all transform hover:scale-115 active:scale-95"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
                 <button 
                    onClick={() => handleSwipe('right')} 
                    className="w-20 h-20 rounded-full bg-dogame-primary text-white text-3xl flex items-center justify-center shadow-glow hover:scale-115 transition-all active:scale-95"
                >
                    <i className="fa-solid fa-heart"></i>
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('swipe');
    const [viewingProfile, setViewingProfile] = useState<GamerProfile | null>(null);
    const [likedProfiles, setLikedProfiles] = useState<GamerProfile[]>([]);
    const [userProfile, setUserProfile] = useState<GamerProfile>(currentUserProfile);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [userCoins, setUserCoins] = useState(1000000); // Set to 1,000,000 as requested
    const [globalBackground, setGlobalBackground] = useState<string | null>(null);
    const [isGlobalBgEnabled, setIsGlobalBgEnabled] = useState(true);
    const [ownedBackgrounds, setOwnedBackgrounds] = useState<BackgroundItem[]>([]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.body.className = isDarkMode ? 'dark overflow-hidden' : 'light overflow-hidden';
    }, [isDarkMode]);

    const handleNavigate = (view: ActiveView) => {
        setActiveView(view);
        setViewingProfile(null);
    };

    const getViewTitle = (view: ActiveView) => {
        switch(view) {
            case 'swipe': return 'התאמות חדשות';
            case 'likes-you': return 'מי אהב אותך';
            case 'shop': return 'חנות שדרוגים';
            case 'chat': return 'הודעות';
            case 'settings': return 'הגדרות';
            case 'profile': return 'פרופיל אישי';
            case 'games': return 'בחירת משחק';
            case 'subscriptions': return 'שדרג ל-Premium';
            default: return 'swish & game';
        }
    };

    const currentBg = isGlobalBgEnabled ? (globalBackground || userProfile.bannerImage) : (activeView === 'profile' ? (viewingProfile?.bannerImage || userProfile.bannerImage) : null);

    const handlePurchase = (item: BackgroundItem) => {
        if (userCoins >= item.price) {
            if (ownedBackgrounds.find(b => b.id === item.id)) {
                alert('הרקע הזה כבר נמצא באוסף שלך!');
                return;
            }
            setUserCoins(prev => prev - item.price);
            setOwnedBackgrounds(prev => [...prev, item]);
            setUserProfile(prev => ({...prev, bannerImage: item.previewUrl}));
            if (isGlobalBgEnabled) setGlobalBackground(item.previewUrl);
            alert('הרקע נרכש בהצלחה והתווסף לאוסף שלך!');
        } else {
            alert('אין לך מספיק מטבעות לרכישה זו.');
        }
    };

    return (
        <div className={`h-screen w-full relative font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-dogame-bg text-dogame-text' : 'bg-dogame-lightBg text-dogame-lightText'}`}>
            
            {/* Background Layer with Animation */}
            {currentBg && (
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <img 
                        src={currentBg} 
                        className="w-full h-full object-cover opacity-25 blur-[2px] bg-moving" 
                        alt=""
                    />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-dogame-bg/30 via-dogame-bg/85 to-dogame-bg' : 'bg-gradient-to-b from-dogame-lightBg/30 via-dogame-lightBg/85 to-dogame-lightBg'}`}></div>
                </div>
            )}

            <SideNav activeView={activeView} onNavigate={handleNavigate} />

            <div className="h-full w-full mr-[72px] flex flex-col relative z-10">
                <Header 
                    viewTitle={getViewTitle(activeView)} 
                    onOpenSubscriptions={() => handleNavigate('subscriptions')}
                    onOpenProfile={() => handleNavigate('profile')}
                    onOpenChat={() => handleNavigate('chat')}
                    onOpenSearch={() => handleNavigate('games')}
                    showBackButton={activeView !== 'swipe'}
                    onBack={() => handleNavigate('swipe')}
                />

                <main className="flex-1 w-full overflow-hidden relative">
                    {activeView === 'swipe' && <SwipeView onLike={(p) => setLikedProfiles([...likedProfiles, p])} />}
                    {activeView === 'shop' && <ShopView onPurchase={handlePurchase} userCoins={userCoins} />}
                    {activeView === 'chat' && <ChatView matches={matchedProfiles} onBack={() => handleNavigate('swipe')} />}
                    {activeView === 'likes-you' && <LikesGrid profiles={profilesWhoLikedUser} onProfileClick={(p) => {setViewingProfile(p); setActiveView('profile');}} onMatch={(p) => {alert(`התאמת עם ${p.name}!`); handleNavigate('chat');}} />}
                    {activeView === 'games' && <GamesView onSelectGame={() => handleNavigate('swipe')} />}
                    {activeView === 'subscriptions' && <SubscriptionsView onSelectPlan={(plan) => alert(`נרשמת בהצלחה לתוכנית ${plan}!`)} />}
                    {activeView === 'settings' && (
                        <SettingsView 
                            isDarkMode={isDarkMode} 
                            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
                            isGlobalBgEnabled={isGlobalBgEnabled}
                            onToggleGlobalBg={() => setIsGlobalBgEnabled(!isGlobalBgEnabled)}
                        />
                    )}
                    {activeView === 'profile' && (
                        <ProfileView 
                            profile={viewingProfile || userProfile} 
                            onSave={setUserProfile} 
                            isOwnProfile={!viewingProfile} 
                            onReturnToLobby={() => handleNavigate('swipe')}
                            isGlobalBackground={globalBackground === (viewingProfile?.bannerImage || userProfile.bannerImage)}
                            onSetGlobalBackground={(url) => setGlobalBackground(url || null)}
                            ownedBackgrounds={ownedBackgrounds}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
