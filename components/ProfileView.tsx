import React, { useState } from 'react';
import { GamerProfile } from '../types';
import ImageEditModal from './ImageEditModal';

interface ProfileViewProps {
    profile: GamerProfile;
    onSave: (updatedProfile: GamerProfile) => void;
    isOwnProfile: boolean;
    onReturnToLobby: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onSave, isOwnProfile, onReturnToLobby }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<GamerProfile>(profile);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageTarget, setImageTarget] = useState<'image' | 'bannerImage'>('image');

    const handleSave = () => {
        onSave(editedProfile);
        setIsEditing(false);
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-dogame-bg pb-32">
            <ImageEditModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} onSave={(url) => { setEditedProfile({...editedProfile, [imageTarget]: url}); setIsImageModalOpen(false); }} />
            
            {/* Banner Area */}
            <div className="relative h-56 w-full group">
                <img src={editedProfile.bannerImage || 'https://via.placeholder.com/800x400'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dogame-bg to-transparent"></div>
                
                {isOwnProfile && isEditing && (
                    <button onClick={() => { setImageTarget('bannerImage'); setIsImageModalOpen(true); }} className="absolute top-20 right-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-black/80 transition-colors">
                        <i className="fa-solid fa-camera mr-2"></i> שינוי רקע
                    </button>
                )}
            </div>

            {/* Profile Content */}
            <div className="px-4 max-w-2xl mx-auto relative -mt-16">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative w-32 h-32 mb-4">
                        <div className="w-full h-full rounded-full border-4 border-dogame-bg overflow-hidden shadow-lg bg-dogame-surface">
                            <img src={editedProfile.image} className="w-full h-full object-cover" />
                        </div>
                        {isOwnProfile && isEditing && (
                            <button onClick={() => { setImageTarget('image'); setIsImageModalOpen(true); }} className="absolute bottom-0 right-0 w-10 h-10 bg-dogame-primary text-white rounded-full flex items-center justify-center border-4 border-dogame-bg hover:scale-110 transition-transform">
                                <i className="fa-solid fa-camera text-sm"></i>
                            </button>
                        )}
                    </div>

                    <div className="w-full">
                        {isEditing ? (
                            <input value={editedProfile.name} onChange={e => setEditedProfile({...editedProfile, name: e.target.value})} className="bg-transparent border-b border-white/20 text-3xl font-bold text-white text-center focus:outline-none focus:border-dogame-primary w-full py-1 mb-2" />
                        ) : (
                            <h1 className="text-3xl font-bold text-white mb-1">{editedProfile.name}</h1>
                        )}
                        <p className="text-dogame-muted text-lg">בן {editedProfile.age}</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-dogame-surface rounded-2xl p-6 shadow-soft border border-white/5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">אודות</h3>
                        {isOwnProfile && !isEditing && (
                             <button onClick={() => setIsEditing(true)} className="text-dogame-primary text-sm font-bold hover:underline">עריכה</button>
                        )}
                    </div>

                    {isEditing ? (
                        <textarea value={editedProfile.bio} onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})} className="w-full bg-dogame-bg border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-dogame-primary" rows={4} />
                    ) : (
                        <p className="text-gray-300 leading-relaxed text-right">
                            {editedProfile.bio}
                        </p>
                    )}

                    {isOwnProfile && isEditing && (
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleSave} className="flex-1 py-3 bg-dogame-primary text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">שמור</button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">ביטול</button>
                        </div>
                    )}
                </div>

                {/* Stats / Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-dogame-surface p-4 rounded-2xl border border-white/5 text-center">
                         <span className="text-dogame-muted text-sm block mb-1">רמה</span>
                         <span className="text-xl font-bold text-white">{profile.skillLevel}</span>
                     </div>
                     <div className="bg-dogame-surface p-4 rounded-2xl border border-white/5 text-center">
                         <span className="text-dogame-muted text-sm block mb-1">משחקים</span>
                         <span className="text-xl font-bold text-white">{profile.games.length}</span>
                     </div>
                </div>

                {/* Games List */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 text-right px-1">המשחקים שלי</h3>
                    <div className="space-y-3">
                        {editedProfile.games.map((game, idx) => (
                            <div key={idx} className="bg-dogame-surface p-4 rounded-2xl border border-white/5 flex items-start gap-4 hover:bg-white/5 transition-colors text-right">
                                <div className="w-10 h-10 rounded-full bg-dogame-bg flex items-center justify-center shrink-0">
                                    <i className={`fa-solid ${game.icon} text-dogame-primary`}></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{game.name}</h4>
                                    <p className="text-sm text-dogame-muted mt-1">{game.lookingFor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Settings & Logout */}
                {isOwnProfile && !isEditing && (
                    <div className="space-y-3 mb-8">
                        <button 
                            onClick={onReturnToLobby}
                            className="w-full py-4 bg-white/5 rounded-2xl text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-home"></i> חזרה ללובי
                        </button>
                         <button className="w-full py-4 text-dogame-danger font-medium hover:bg-dogame-danger/10 rounded-2xl transition-colors">
                            התנתק מהמערכת
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;