import React from 'react';

import { GamerProfile } from '@/shared/types';

interface LikesGridProps {
  profiles: GamerProfile[];
  onProfileClick: (p: GamerProfile) => void;
  onMatch: (p: GamerProfile) => void;
}

export const LikesGrid: React.FC<LikesGridProps> = ({ profiles, onProfileClick, onMatch }) => (
  <div className="p-6 pt-24 pb-32 overflow-y-auto h-full max-w-6xl mx-auto relative z-10 no-scrollbar">
    <div className="text-right mb-8">
      <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter">מי שעשה לך לייק</h2>
      <p className="dark:text-text-muted text-gray-500 font-bold">החזר להם לייק כדי להתחיל לדבר!</p>
    </div>

    {profiles.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <i className="fa-solid fa-heart-crack text-7xl mb-4"></i>
        <p className="text-xl font-bold italic uppercase">עדיין אין לייקים חדשים</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="group relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-soft hover:scale-[1.03] transition-all duration-300 border-2 border-transparent hover:border-primary/40">
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
                  className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-glow hover:scale-110 transition-transform"
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
