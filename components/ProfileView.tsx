
import React, { useState } from 'react';
import { GamerProfile, BackgroundItem } from '../types';
import ImageEditModal from './ImageEditModal';
import BackgroundCollectionModal from './BackgroundCollectionModal';

interface ProfileViewProps {
    profile: GamerProfile;
    onSave: (updatedProfile: GamerProfile) => void;
    isOwnProfile: boolean;
    onReturnToLobby: () => void;
    isGlobalBackground?: boolean;
    onSetGlobalBackground?: (url: string | undefined) => void;
    ownedBackgrounds: BackgroundItem[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
    profile, 
    onSave, 
    isOwnProfile, 
    onReturnToLobby, 
    isGlobalBackground,
    onSetGlobalBackground,
    ownedBackgrounds
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<GamerProfile>(profile);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [imageTarget, setImageTarget] = useState<'image' | 'bannerImage'>('image');

    const handleSave = () => {
        onSave(editedProfile);
        setIsEditing(false);
    }

    const handleEquipItem = (item: BackgroundItem) => {
        let updated;
        if (item.itemType === 'background') {
            updated = { ...editedProfile, bannerImage: item.previewUrl };
        } else {
            updated = { ...editedProfile, avatarBorder: item.previewUrl };
        }
        setEditedProfile(updated);
        onSave(updated);
        setIsCollectionModalOpen(false);
    };

    const isColorBackground = (bg: string | null | undefined) => {
        if (!bg) return false;
        return bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('linear-gradient');
    };

    return (
        <div className="h-full w-full overflow-y-auto relative pb-32">
            
            {/* Full Page Background Area */}
            {profile.bannerImage && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    {isColorBackground(profile.bannerImage) ? (
                        <div 
                            style={{ background: profile.bannerImage }} 
                            className="w-full h-full animate-pulse-slow opacity-40 bg-moving" 
                        />
                    ) : (
                        <img src={profile.bannerImage} className="w-full h-full object-cover animate-pulse-slow opacity-40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-dogame-bg/30 via-dogame-bg/80 to-dogame-bg"></div>
                    <div className="absolute inset-0 backdrop-blur-[6px]"></div>
                </div>
            )}

            <ImageEditModal 
                isOpen={isImageModalOpen} 
                onClose={() => setIsImageModalOpen(false)} 
                onSave={(url) => { 
                    const updated = {...editedProfile, [imageTarget]: url};
                    setEditedProfile(updated); 
                    onSave(updated);
                    setIsImageModalOpen(false); 
                }} 
            />

            <BackgroundCollectionModal 
                isOpen={isCollectionModalOpen}
                onClose={() => setIsCollectionModalOpen(false)}
                ownedItems={ownedBackgrounds}
                onEquip={handleEquipItem}
            />
            
            {/* Profile Content */}
            <div className="px-4 max-w-2xl mx-auto relative z-10 pt-16">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="relative w-40 h-40 mb-6 group">
                        {/* Avatar Border Wrapper */}
                        <div className="absolute inset-0 p-1.5 rounded-full overflow-hidden">
                            {editedProfile.avatarBorder && (
                                <div 
                                    style={{ background: editedProfile.avatarBorder }} 
                                    className="absolute inset-0 z-0 bg-moving" 
                                />
                            )}
                            <div className="relative z-10 w-full h-full rounded-full border-[6px] border-dogame-bg overflow-hidden shadow-2xl bg-dogame-surface">
                                <img src={editedProfile.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            </div>
                        </div>
                        
                        {isOwnProfile && (
                            <button onClick={() => { setImageTarget('image'); setIsImageModalOpen(true); }} className="absolute bottom-2 right-2 z-20 w-12 h-12 bg-dogame-primary text-white rounded-full flex items-center justify-center border-4 border-dogame-bg hover:scale-110 transition-transform shadow-glow">
                                <i className="fa-solid fa-camera"></i>
                            </button>
                        )}
                    </div>

                    <div className="w-full">
                        {isEditing ? (
                            <input value={editedProfile.name} onChange={e => setEditedProfile({...editedProfile, name: e.target.value})} className="bg-white/5 border-b-2 border-dogame-primary/50 text-4xl font-black text-white text-center focus:outline-none focus:border-dogame-primary w-full py-2 mb-2 italic uppercase" />
                        ) : (
                            <h1 className="text-4xl font-black text-white mb-1 italic uppercase tracking-tighter drop-shadow-lg">{editedProfile.name}</h1>
                        )}
                        
                        {isEditing ? (
                            <div className="flex justify-center items-center gap-2 mt-1">
                                <span className="text-dogame-muted text-lg font-bold">גיל</span>
                                <input 
                                    type="number" 
                                    value={editedProfile.age} 
                                    onChange={e => setEditedProfile({...editedProfile, age: parseInt(e.target.value) || 0})} 
                                    className="bg-white/5 border-b border-white/20 text-lg text-white text-center focus:outline-none focus:border-dogame-primary w-16" 
                                />
                            </div>
                        ) : (
                            <p className="text-dogame-primary text-xl font-bold tracking-widest">{editedProfile.age} גיימר</p>
                        )}
                    </div>
                </div>

                {/* Theme Options (If own profile) */}
                {isOwnProfile && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 mb-8 shadow-xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="text-right">
                                <h3 className="text-white font-bold text-lg mb-1">האוסף שלי</h3>
                                <p className="text-dogame-muted text-sm">{ownedBackgrounds.length} פריטי סטייל</p>
                            </div>
                            <button 
                                onClick={() => setIsCollectionModalOpen(true)}
                                className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <i className="fa-solid fa-layer-group"></i>
                                <span>נהל אוסף</span>
                            </button>
                        </div>
                        
                        {profile.bannerImage && (
                            <div className="w-full h-[1px] bg-white/5"></div>
                        )}

                        {profile.bannerImage && (
                            <div className="flex items-center justify-between">
                                <div className="text-right">
                                    <h3 className="text-white font-bold text-lg mb-1">ערכת נושא גלובלית</h3>
                                    <p className="text-dogame-muted text-sm">הצג את הרקע הזה בכל האתר</p>
                                </div>
                                <button 
                                    onClick={() => onSetGlobalBackground?.(isGlobalBackground ? undefined : editedProfile.bannerImage)}
                                    className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                                        isGlobalBackground 
                                        ? 'bg-dogame-danger/20 text-dogame-danger border border-dogame-danger/30' 
                                        : 'bg-dogame-primary text-white shadow-glow'
                                    }`}
                                >
                                    <i className={`fa-solid ${isGlobalBackground ? 'fa-xmark' : 'fa-wand-magic-sparkles'}`}></i>
                                    <span>{isGlobalBackground ? 'בטל רקע אתר' : 'הגדר כרקע אתר'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-dogame-surface/40 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl border border-white/10 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-white italic uppercase">ביוגרפיה</h3>
                        {isOwnProfile && !isEditing && (
                             <button onClick={() => setIsEditing(true)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-dogame-primary hover:bg-dogame-primary hover:text-white transition-all shadow-sm">
                                <i className="fa-solid fa-pen-to-square"></i>
                             </button>
                        )}
                    </div>

                    {isEditing ? (
                        <textarea value={editedProfile.bio} onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-dogame-primary min-h-[150px]" />
                    ) : (
                        <p className="text-gray-200 leading-relaxed text-right text-lg">
                            {editedProfile.bio}
                        </p>
                    )}

                    {isOwnProfile && isEditing && (
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button onClick={handleSave} className="py-4 bg-dogame-primary text-white rounded-2xl font-black italic uppercase shadow-glow hover:scale-[1.02] transition-transform">שמור שינויים</button>
                            <button onClick={() => setIsEditing(false)} className="py-4 bg-white/5 text-white rounded-2xl font-black italic uppercase border border-white/10 hover:bg-white/10 transition-colors">ביטול</button>
                        </div>
                    )}
                </div>

                {/* Stats / Info */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                     <div className="bg-white/5 backdrop-blur-lg p-6 rounded-[24px] border border-white/10 text-center shadow-lg">
                         <span className="text-dogame-muted text-xs font-black uppercase tracking-widest block mb-2">רמת מיומנות</span>
                         <span className="text-2xl font-black text-white italic uppercase">{profile.skillLevel}</span>
                     </div>
                     <div className="bg-white/5 backdrop-blur-lg p-6 rounded-[24px] border border-white/10 text-center shadow-lg">
                         <span className="text-dogame-muted text-xs font-black uppercase tracking-widest block mb-2">ספריית משחקים</span>
                         <span className="text-2xl font-black text-white italic uppercase">{profile.games.length} פריטים</span>
                     </div>
                </div>

                {/* Games List */}
                <div className="mb-12">
                    <h3 className="text-xl font-black text-white mb-6 text-right px-1 italic uppercase tracking-tighter">התמחות בגיימינג</h3>
                    <div className="space-y-4">
                        {editedProfile.games.map((game, idx) => (
                            <div key={idx} className="bg-dogame-surface/30 backdrop-blur-xl p-6 rounded-[24px] border border-white/10 flex items-start gap-5 hover:bg-white/5 transition-all text-right shadow-xl group">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dogame-primary/20 to-dogame-accent/20 flex items-center justify-center shrink-0 border border-white/10 group-hover:rotate-6 transition-transform">
                                    <i className={`fa-solid ${game.icon} text-dogame-primary text-2xl`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-white text-lg italic uppercase">{game.name}</h4>
                                    <p className="text-gray-400 mt-2 leading-snug">{game.lookingFor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions Only */}
                {isOwnProfile && !isEditing && (
                    <div className="flex flex-col gap-4 mb-12">
                        <button 
                            onClick={() => setIsCollectionModalOpen(true)}
                            className="w-full py-4 bg-gradient-to-r from-dogame-primary to-dogame-accent text-white font-black italic uppercase rounded-[20px] shadow-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                        >
                            <i className="fa-solid fa-palette"></i>
                            <span>שנה סטייל מהאוסף</span>
                        </button>
                        <button className="w-full py-4 text-dogame-danger font-black italic uppercase hover:bg-dogame-danger/10 rounded-[20px] transition-colors border border-dogame-danger/10">
                            התנתק מהמערכת
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;
