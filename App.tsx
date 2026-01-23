
import React, { useState, useMemo, useEffect } from 'react';
import { gamerProfiles, currentUserProfile, profilesWhoLikedUser, matchedProfiles, backgroundShopItems } from './constants';
import { GamerProfile, BackgroundItem } from './types';
import Header from './components/Header';
import ProfileView from './components/ProfileView';
import ChatView from './components/ChatView';
import ShopView from './components/ShopView';
import SettingsView from './components/SettingsView';
import SubscriptionsView from './components/SubscriptionsView';
import GamesView from './components/GamesView';

// --- Types ---
type ActiveView = 'swipe' | 'likes-you' | 'games' | 'profile' | 'chat' | 'shop' | 'settings' | 'subscriptions';

// --- Sub-components ---

const SwipeView: React.FC<{ onLike: (p: GamerProfile) => void }> = ({ onLike }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const profiles = gamerProfiles;

    const handleSwipe = (direction: 'left' | 'right') => {
        if (direction === 'right' && profiles[currentIndex]) {
            onLike(profiles[currentIndex]);
        }
        setCurrentIndex(prev => prev + 1);
    };

    if (currentIndex >= profiles.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-50 relative z-10">
                <i className="fa-solid fa-ghost text-7xl mb-6 dark:text-white text-dogame-lightText"></i>
                <h3 className="text-2xl font-bold italic uppercase dark:text-white text-dogame-lightText">אין יותר שחקנים באזור שלך</h3>
                <p className="font-bold dark:text-dogame-muted text-gray-500">נסה לשנות פילטרים או לחזור מאוחר יותר</p>
            </div>
        );
    }

    const currentProfile = profiles[currentIndex];

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
            <div className="relative w-full max-w-md aspect-[3/4.5] rounded-[40px] overflow-hidden shadow-2xl border-2 dark:border-white/10 border-gray-200 group bg-dogame-surface/20 backdrop-blur-md">
                <img src={currentProfile.image} alt={currentProfile.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{currentProfile.name}, {currentProfile.age}</h2>
                    <p className="text-white/80 font-bold mb-6 line-clamp-2">{currentProfile.bio}</p>
                    
                    <div className="flex flex-wrap gap-2 justify-end mb-8">
                        {currentProfile.games.map((g, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase italic border border-white/10">
                                <i className={`fa-solid ${g.icon} ml-1.5`}></i>
                                {g.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex justify-between gap-4">
                        <button 
                            onClick={() => handleSwipe('left')}
                            className="flex-1 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-2xl hover:bg-dogame-danger hover:text-white transition-all active:scale-95 shadow-lg"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <button 
                            onClick={() => handleSwipe('right')}
                            className="flex-1 h-16 rounded-2xl bg-dogame-primary text-white flex items-center justify-center text-2xl hover:scale-105 transition-all active:scale-95 shadow-glow"
                        >
                            <i className="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LikesGrid: React.FC<{ profiles: GamerProfile[]; onProfileClick: (p: GamerProfile) => void; onMatch: (p: GamerProfile) => void }> = ({ profiles, onProfileClick, onMatch }) => (
    <div className="p-6 pt-24 pb-32 overflow-y-auto h-full max-w-6xl mx-auto relative z-10 no-scrollbar">
        <div className="text-right mb-8">
            <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter">מי שעשה לך לייק</h2>
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

const SideNav: React.FC<{ activeView: ActiveView; userProfile: GamerProfile; onNavigate: (v: ActiveView) => void }> = ({ activeView, userProfile, onNavigate }) => {
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
                className={`w-12 h-12 rounded-[24px] overflow-hidden transition-all duration-300 hover:rounded-[16px] mb-4 relative p-0.5 ${activeView === 'profile' ? 'rounded-[16px] ring-2 ring-dogame-primary shadow-glow' : 'opacity-80 hover:opacity-100'}`}
            >
                {userProfile.avatarBorder && (
                    <div 
                        style={{ background: userProfile.avatarBorder }} 
                        className="absolute inset-0 z-0 bg-moving" 
                    />
                )}
                <div className="relative z-10 w-full h-full rounded-full border-2 border-dogame-bg overflow-hidden">
                    <img src={userProfile.image} alt="Me" className="w-full h-full object-cover" />
                </div>
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

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('swipe');
    const [viewingProfile, setViewingProfile] = useState<GamerProfile | null>(null);
    const [likedProfiles, setLikedProfiles] = useState<GamerProfile[]>([]);
    const [userProfile, setUserProfile] = useState<GamerProfile>(currentUserProfile);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [userCoins, setUserCoins] = useState(1000000); 
    const [globalBackground, setGlobalBackground] = useState<string | null>(null);
    const [isGlobalBgEnabled, setIsGlobalBgEnabled] = useState(true);
    const [ownedItems, setOwnedItems] = useState<BackgroundItem[]>([]);

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
            case 'shop': return 'חנות סטייל';
            case 'chat': return 'הודעות';
            case 'settings': return 'הגדרות';
            case 'profile': return 'פרופיל אישי';
            case 'games': return 'בחירת משחק';
            case 'subscriptions': return 'שדרג ל-Premium';
            default: return 'swish & game';
        }
    };

    const currentBg = isGlobalBgEnabled ? (globalBackground || userProfile.bannerImage) : (activeView === 'profile' ? (viewingProfile?.bannerImage || userProfile.bannerImage) : null);

    const isColorBackground = (bg: string | null | undefined) => {
        if (!bg) return false;
        return bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('linear-gradient');
    };

    const handlePurchase = (item: BackgroundItem) => {
        if (userCoins >= item.price) {
            if (ownedItems.find(b => b.id === item.id)) {
                alert('הצבע הזה כבר נמצא באוסף שלך!');
                return;
            }
            setUserCoins(prev => prev - item.price);
            setOwnedItems(prev => [...prev, item]);
            
            if (item.itemType === 'background') {
                setUserProfile(prev => ({...prev, bannerImage: item.previewUrl}));
                if (isGlobalBgEnabled) setGlobalBackground(item.previewUrl);
            } else if (item.itemType === 'avatar-border') {
                setUserProfile(prev => ({...prev, avatarBorder: item.previewUrl}));
            }
            
            alert('הרכישה הושלמה בהצלחה!');
        } else {
            alert('אין לך מספיק מטבעות לרכישה זו.');
        }
    };

    return (
        <div className={`h-screen w-full relative font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-dogame-bg text-dogame-text' : 'bg-dogame-lightBg text-dogame-lightText'}`}>
            
            {/* Background Layer */}
            {currentBg && (
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    {isColorBackground(currentBg) ? (
                        <div 
                            style={{ background: currentBg }} 
                            className="w-full h-full opacity-40 bg-moving" 
                        />
                    ) : (
                        <img 
                            src={currentBg} 
                            className="w-full h-full object-cover opacity-25 blur-[2px] bg-moving" 
                            alt=""
                        />
                    )}
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-dogame-bg/30 via-dogame-bg/85 to-dogame-bg' : 'bg-gradient-to-b from-dogame-lightBg/30 via-dogame-lightBg/85 to-dogame-lightBg'}`}></div>
                </div>
            )}

            <SideNav activeView={activeView} userProfile={userProfile} onNavigate={handleNavigate} />

            <div className="h-full w-full mr-[72px] flex flex-col relative z-10">
                <Header 
                    viewTitle={getViewTitle(activeView)} 
                    userProfile={userProfile}
                    onOpenSubscriptions={() => handleNavigate('subscriptions')}
                    onOpenProfile={() => handleNavigate('profile')}
                    onOpenChat={() => handleNavigate('chat')}
                    onOpenSearch={() => handleNavigate('games')}
                    showBackButton={activeView !== 'swipe'}
                    onBack={() => handleNavigate('swipe')}
                />

                <main className="flex-1 w-full overflow-hidden relative">
                    {activeView === 'swipe' && <SwipeView onLike={(p) => setLikedProfiles([...likedProfiles, p])} />}
                    {activeView === 'shop' && <ShopView onPurchase={handlePurchase} userCoins={userCoins} ownedItems={ownedItems} />}
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
                            ownedBackgrounds={ownedItems}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
