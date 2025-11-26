
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { gamerProfiles, currentUserProfile, profilesWhoLikedUser, matchedProfiles } from './constants';
import { GamerProfile } from './types';
import Header from './components/Header';
import ProfileView from './components/ProfileView';
import ChatView from './components/ChatView';

// --- Types ---
type ActiveView = 'swipe' | 'likes-you' | 'you-liked' | 'search' | 'profile' | 'chat';

// --- Sub-components ---

// 1. Grid for Likes (Simplified)
const LikesGrid: React.FC<{ profiles: GamerProfile[]; onProfileClick: (p: GamerProfile) => void }> = ({ profiles, onProfileClick }) => (
    <div className="p-4 pt-24 pb-32 grid grid-cols-2 gap-4 overflow-y-auto h-full max-w-3xl mx-auto">
        {profiles.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center h-64 text-dogame-muted">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                   <i className="fa-solid fa-ghost text-4xl opacity-50"></i>
                </div>
                <p className="text-lg font-medium">עדיין אין כאן אף אחד</p>
                <p className="text-sm">התחל לעשות לייקים כדי למצוא התאמות!</p>
            </div>
        ) : (
            profiles.map((profile) => (
                <button 
                    key={profile.id} 
                    onClick={() => onProfileClick(profile)}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft group hover:scale-[1.02] transition-transform"
                >
                    <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 right-0 p-3 text-right w-full">
                        <h3 className="text-white font-bold text-lg">{profile.name}, {profile.age}</h3>
                        <p className="text-dogame-accent text-xs font-medium bg-dogame-surface/50 backdrop-blur-md px-2 py-1 rounded-lg inline-block mt-1">
                             {profile.skillLevel}
                        </p>
                    </div>
                </button>
            ))
        )}
    </div>
);

// 2. Navigation (Clear Labels, Friendly Icons)
const BottomNav: React.FC<{ activeView: ActiveView; onNavigate: (v: ActiveView) => void }> = ({ activeView, onNavigate }) => {
    const items = [
        { id: 'search', icon: 'fa-magnifying-glass', label: 'חיפוש' },
        { id: 'swipe', icon: 'fa-layer-group', label: 'התאמות' },
        { id: 'likes-you', icon: 'fa-heart', label: 'לייקים' },
        { id: 'chat', icon: 'fa-comments', label: 'צ׳אט' },
    ];
    
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-dogame-surface border-t border-white/5 pb-safe">
            <div className="flex justify-around items-center h-20 max-w-3xl mx-auto px-2">
                {items.map(item => {
                    const isActive = activeView === item.id || (activeView === 'you-liked' && item.id === 'likes-you');
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as ActiveView)}
                            className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${isActive ? 'text-dogame-primary' : 'text-dogame-muted hover:text-white'}`}
                        >
                            <i className={`fa-solid ${item.icon} text-2xl mb-1`}></i>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
                 <button
                    onClick={() => onNavigate('profile')}
                    className={`flex flex-col items-center justify-center gap-1 w-16 transition-all ${activeView === 'profile' ? 'text-dogame-primary' : 'text-dogame-muted hover:text-white'}`}
                >
                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${activeView === 'profile' ? 'border-dogame-primary' : 'border-transparent'}`}>
                        <img src={currentUserProfile.image} alt="Me" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-medium">אני</span>
                </button>
            </div>
        </div>
    )
};

// 3. Main Swiping Interface (Big cards, big buttons)
const SwipeView: React.FC<{ onLike: (p: GamerProfile) => void; userProfile: GamerProfile; gameFilter: string | null; onClearFilter: () => void }> = ({ onLike, userProfile, gameFilter, onClearFilter }) => {
    const filteredProfiles = useMemo(() => gameFilter ? gamerProfiles.filter(p => p.games.some(g => g.name === gameFilter)) : gamerProfiles, [gameFilter]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipedDirection, setSwipedDirection] = useState<'left' | 'right' | null>(null);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState<GamerProfile | null>(null);

    const activeProfile = filteredProfiles[currentIndex];
    
    const handleSwipe = (direction: 'left' | 'right') => {
        if (!activeProfile) return;
        setSwipedDirection(direction);
        setTimeout(() => {
            if (direction === 'right') {
                onLike(activeProfile);
                if (Math.random() > 0.6) { // Simulate match
                    setMatchedProfile(activeProfile);
                    setShowMatch(true);
                }
            }
            setCurrentIndex(prev => prev + 1);
            setSwipedDirection(null);
        }, 300);
    };

    if (!activeProfile) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-dogame-surface rounded-full flex items-center justify-center mb-6 shadow-soft">
                <i className="fa-solid fa-check text-4xl text-dogame-success"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">זה הכל להיום!</h2>
            <p className="text-dogame-muted mb-8">עברת על כל הפרופילים באזור שלך.</p>
            <button onClick={() => setCurrentIndex(0)} className="px-8 py-3 bg-dogame-primary text-white font-bold rounded-full shadow-glow hover:bg-indigo-600 transition-colors">
                התחל מחדש
            </button>
        </div>
    );

    return (
        <div className="h-full w-full relative flex flex-col items-center justify-center pb-24 pt-16 px-4 max-w-xl mx-auto">
             {showMatch && matchedProfile && (
                <div className="fixed inset-0 z-[100] bg-dogame-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-pop">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-glow animate-bounce">
                        <i className="fa-solid fa-heart text-4xl text-dogame-danger"></i>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">יש התאמה!</h1>
                    <p className="text-dogame-muted mb-12 text-center">אתה ו{matchedProfile.name} אהבתם אחד את השני.</p>
                    
                    <div className="flex items-center justify-center gap-4 mb-12">
                         <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
                             <img src={userProfile.image} className="w-full h-full object-cover" />
                         </div>
                         <div className="w-24 h-24 rounded-full border-4 border-dogame-primary shadow-lg overflow-hidden">
                             <img src={matchedProfile.image} className="w-full h-full object-cover" />
                         </div>
                    </div>
                    
                    <button onClick={() => setShowMatch(false)} className="w-full py-4 bg-dogame-primary text-white rounded-xl font-bold text-lg shadow-glow mb-4">
                        שלח הודעה
                    </button>
                    <button onClick={() => setShowMatch(false)} className="text-dogame-muted hover:text-white font-medium">
                        המשך לחפש
                    </button>
                </div>
            )}

            {gameFilter && (
                <div className="absolute top-20 z-10 px-4 py-2 bg-dogame-surface rounded-full shadow-soft border border-white/10 flex items-center gap-2">
                    <span className="text-sm font-medium text-dogame-accent">סינון: {gameFilter}</span>
                    <button onClick={onClearFilter} className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                        <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
            )}

            <div className="relative w-full aspect-[3/4.5] max-h-[60vh]">
                {/* Background Cards Stack */}
                {filteredProfiles[currentIndex + 1] && (
                     <div className="absolute inset-0 bg-dogame-surface rounded-3xl transform scale-95 translate-y-3 opacity-50"></div>
                )}
                
                {/* Active Card */}
                <div 
                    className={`absolute inset-0 bg-dogame-surface rounded-3xl overflow-hidden shadow-2xl border border-white/5 transition-transform duration-300 ease-out ${swipedDirection === 'left' ? '-translate-x-[150%] -rotate-12' : swipedDirection === 'right' ? 'translate-x-[150%] rotate-12' : ''}`}
                >
                    <img src={activeProfile.image} className="w-full h-full object-cover" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    
                    <div className="absolute top-4 left-4">
                         <div className={`px-3 py-1.5 rounded-full backdrop-blur-md text-sm font-bold shadow-sm ${activeProfile.skillLevel === 'מקצוען' ? 'bg-amber-500/90 text-white' : 'bg-white/20 text-white'}`}>
                            {activeProfile.skillLevel}
                         </div>
                    </div>

                    <div className="absolute bottom-0 w-full p-6 text-right">
                        <div className="flex items-end gap-2 mb-2">
                             <h2 className="text-3xl font-bold text-white">{activeProfile.name}</h2>
                             <span className="text-xl text-dogame-muted font-medium mb-1">, {activeProfile.age}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4 justify-start">
                            {activeProfile.games.slice(0,3).map(g => (
                                <span key={g.name} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white border border-white/10">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                        
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-2">
                            {activeProfile.bio}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute bottom-24 w-full max-w-xs flex justify-center gap-8 px-4">
                <button 
                    onClick={() => handleSwipe('left')} 
                    className="w-16 h-16 rounded-full bg-dogame-surface border border-dogame-danger/30 text-dogame-danger text-2xl flex items-center justify-center hover:bg-dogame-danger hover:text-white transition-all shadow-soft"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
                 <button 
                    onClick={() => handleSwipe('right')} 
                    className="w-16 h-16 rounded-full bg-dogame-primary text-white text-2xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-glow hover:scale-110"
                >
                    <i className="fa-solid fa-heart"></i>
                </button>
            </div>
        </div>
    );
};

// 4. Search View (Friendly Categories)
const SearchView: React.FC<{ onSelect: (g: string) => void }> = ({ onSelect }) => {
    const games = [
        {name: 'Call of Duty', icon: 'fa-crosshairs', color: 'bg-orange-500'},
        {name: 'Valorant', icon: 'fa-cube', color: 'bg-red-500'},
        {name: 'Minecraft', icon: 'fa-cubes', color: 'bg-green-500'},
        {name: 'League of Legends', icon: 'fa-shield-halved', color: 'bg-blue-500'},
        {name: 'Fortnite', icon: 'fa-person-rifle', color: 'bg-purple-500'},
        {name: 'Overwatch 2', icon: 'fa-circle-notch', color: 'bg-orange-400'},
        {name: 'FIFA', icon: 'fa-futbol', color: 'bg-blue-400'},
        {name: 'GTA V', icon: 'fa-car', color: 'bg-green-400'},
    ];
    return (
        <div className="pt-20 px-4 h-full overflow-y-auto pb-32 max-w-3xl mx-auto">
            <div className="relative mb-6">
                <input type="text" placeholder="חפש משחק או שחקן..." className="w-full bg-dogame-surface border border-white/5 rounded-xl py-4 pr-12 pl-4 text-white placeholder-dogame-muted focus:outline-none focus:border-dogame-primary transition-all shadow-soft text-right" dir="rtl" />
                <i className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-dogame-muted"></i>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4 text-right">קטגוריות מובילות</h3>
            <div className="grid grid-cols-2 gap-4">
                {games.map(g => (
                    <button key={g.name} onClick={() => onSelect(g.name)} className="bg-dogame-surface rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-right shadow-sm group">
                        <div className={`w-12 h-12 rounded-xl ${g.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                             <i className={`fa-solid ${g.icon} text-white text-xl`}></i>
                        </div>
                        <span className="font-bold text-gray-200 text-sm">{g.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
};

// 5. Subscription Modal (Redesigned - Horizontal Side-by-Side)
const SubscriptionsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const plans = [
        {
            id: 'silver',
            name: 'SILVER',
            price: '₪19.90',
            period: '/חודש',
            features: ['ללא פרסומות', '5 סופר לייקים ביום'],
            gradient: 'from-gray-300 to-gray-400',
            bg: 'bg-gray-900',
            border: 'border-gray-500',
            icon: 'fa-shield-halved',
            popular: false
        },
        {
            id: 'gold',
            name: 'GOLD',
            price: '₪39.90',
            period: '/חודש',
            features: ['לראות מי עשה לך לייק', 'לייקים ללא הגבלה', 'הטבות ה-Silver'],
            gradient: 'from-amber-300 to-yellow-500',
            bg: 'bg-yellow-950/30',
            border: 'border-yellow-500',
            icon: 'fa-crown',
            popular: true
        },
        {
            id: 'diamond',
            name: 'DIAMOND',
            price: '₪69.90',
            period: '/חודש',
            features: ['הודעה לפני התאמה', 'חשיפה פי 3 בפרופיל', 'תג VIP', 'הטבות ה-Gold'],
            gradient: 'from-cyan-300 to-blue-500',
            bg: 'bg-blue-950/30',
            border: 'border-cyan-500',
            icon: 'fa-gem',
            popular: false
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-pop backdrop-blur-sm" onClick={onClose}>
             <div className="absolute inset-0 bg-black/80" />
             
             {/* Main Modal Container - Wider for horizontal layout */}
             <div 
                className="relative w-full max-w-6xl bg-dogame-surface rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden" 
                onClick={e => e.stopPropagation()}
             >
                {/* Header */}
                <div className="p-6 text-center border-b border-white/5 shrink-0 relative bg-dogame-bg/50">
                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <h2 className="text-3xl font-black text-white tracking-tight">שדרג את החוויה שלך</h2>
                    <p className="text-dogame-muted mt-2">בחר את המסלול המתאים לך ביותר</p>
                </div>

                {/* Plans Container - Horizontal Grid/Flex */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8">
                    <div className="flex flex-col md:grid md:grid-cols-3 gap-6 h-full items-stretch min-w-[min-content] md:min-w-0">
                        {plans.map(plan => (
                             <div key={plan.id} className={`relative rounded-3xl p-[1px] group transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'md:scale-105 z-10 shadow-glow' : 'md:scale-100 hover:shadow-soft'}`}>
                                 {/* Gradient Border */}
                                 <div className={`absolute inset-0 bg-gradient-to-b ${plan.gradient} rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                 
                                 {/* Card Content */}
                                 <div className={`relative ${plan.bg} backdrop-blur-xl rounded-[23px] p-6 h-full flex flex-col items-center text-center border-t border-white/10`}>
                                     {plan.popular && (
                                         <div className="absolute -top-4 bg-gradient-to-r from-amber-300 to-yellow-500 text-black text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                                             הכי משתלם
                                         </div>
                                     )}

                                     <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg mb-4 mt-2`}>
                                         <i className={`fa-solid ${plan.icon} text-white text-2xl`}></i>
                                     </div>

                                     <h3 className={`text-2xl font-black bg-gradient-to-br ${plan.gradient} bg-clip-text text-transparent mb-1`}>{plan.name}</h3>
                                     
                                     <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-bold text-white tracking-tight">{plan.price}</span>
                                        <span className="text-sm text-dogame-muted">{plan.period}</span>
                                     </div>

                                     <ul className="space-y-4 mb-8 w-full flex-1">
                                         {plan.features.map((f, i) => (
                                             <li key={i} className="flex items-center gap-3 text-sm text-gray-200 dir-rtl justify-center">
                                                 <i className={`fa-solid fa-check text-xs ${plan.id === 'silver' ? 'text-gray-400' : plan.id === 'gold' ? 'text-yellow-400' : 'text-cyan-400'}`}></i>
                                                 <span>{f}</span>
                                             </li>
                                         ))}
                                     </ul>

                                     <button className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${plan.gradient} shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95 text-lg`}>
                                         בחר עכשיו
                                     </button>
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>
    );
}

// --- Main App ---
const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('swipe');
    const [viewingProfile, setViewingProfile] = useState<GamerProfile | null>(null);
    const [likedProfiles, setLikedProfiles] = useState<GamerProfile[]>([]);
    const [userProfile, setUserProfile] = useState<GamerProfile>(currentUserProfile);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [gameFilter, setGameFilter] = useState<string | null>(null);

    const handleNavigate = (view: ActiveView) => {
        setActiveView(view);
        setViewingProfile(null);
    };

    const handleProfileClick = (p: GamerProfile) => {
        setViewingProfile(p);
        setActiveView('profile');
    };

    return (
        <div className="h-screen w-full relative bg-dogame-bg text-dogame-text font-sans">
            <Header 
                viewTitle={activeView} 
                onOpenSubscriptions={() => setIsSubModalOpen(true)}
                onOpenProfile={() => { setViewingProfile(null); setActiveView('profile'); }}
                onOpenChat={() => setActiveView('chat')}
                showBackButton={!!viewingProfile || activeView === 'chat' && window.innerWidth < 768}
                onBack={() => viewingProfile ? handleNavigate('swipe') : handleNavigate('swipe')}
            />

            {isSubModalOpen && <SubscriptionsView onClose={() => setIsSubModalOpen(false)} />}

            <main className="h-full w-full overflow-hidden">
                {activeView === 'swipe' && <SwipeView onLike={(p) => setLikedProfiles([...likedProfiles, p])} userProfile={userProfile} gameFilter={gameFilter} onClearFilter={() => setGameFilter(null)} />}
                {activeView === 'search' && <SearchView onSelect={(g) => { setGameFilter(g); setActiveView('swipe'); }} />}
                {activeView === 'likes-you' && <LikesGrid profiles={profilesWhoLikedUser} onProfileClick={handleProfileClick} />}
                {activeView === 'you-liked' && <LikesGrid profiles={likedProfiles} onProfileClick={handleProfileClick} />}
                {activeView === 'profile' && (
                    <ProfileView 
                        profile={viewingProfile || userProfile} 
                        onSave={setUserProfile} 
                        isOwnProfile={!viewingProfile} 
                        onReturnToLobby={() => setActiveView('swipe')}
                    />
                )}
                {activeView === 'chat' && <ChatView matches={matchedProfiles} onBack={() => setActiveView('swipe')} />}
            </main>

            {/* Bottom Nav */}
            {(activeView !== 'chat') && (
                <BottomNav activeView={activeView} onNavigate={handleNavigate} />
            )}
        </div>
    );
};

export default App;
