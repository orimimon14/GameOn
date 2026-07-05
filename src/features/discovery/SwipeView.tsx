import React, { useState } from 'react';

import { gamerProfiles } from '@/shared/mockData';
import { GamerProfile } from '@/shared/types';

interface SwipeViewProps {
  onLike: (p: GamerProfile) => void;
  onViewProfile: (p: GamerProfile) => void;
  selectedGame: string | null;
}

export const SwipeView: React.FC<SwipeViewProps> = ({ onLike, onViewProfile, selectedGame }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const profiles = gamerProfiles;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && profiles[currentIndex]) {
      onLike(profiles[currentIndex]);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-50 relative z-10">
        <i className="fa-solid fa-ghost text-7xl mb-6 dark:text-white text-text-inverse"></i>
        <h3 className="text-2xl font-bold italic uppercase dark:text-white text-text-inverse">אין יותר שחקנים באזור שלך</h3>
        <p className="font-bold dark:text-text-muted text-gray-500">נסה לשנות פילטרים או לחזור מאוחר יותר</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const displaySkill = currentProfile.skillLevel;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
      <div className="relative w-full max-w-md aspect-[3/4.5] rounded-[40px] overflow-hidden shadow-2xl border-2 dark:border-white/10 border-gray-200 group bg-surface/20 backdrop-blur-md">
        <img src={currentProfile.image} alt={currentProfile.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

        {/* Top Bar Info Rectangle */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-2xl">
            {/* View Profile Button (Magnifying Glass - Left) */}
            <button
              onClick={() => onViewProfile(currentProfile)}
              className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-lg hover:bg-primary hover:scale-105 transition-all active:scale-95"
              title="צפה בפרופיל"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            {/* Skill Level (Center) */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">רמת מיומנות</span>
              <div className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-yellow-400 text-[8px]"></i>
                <span>{displaySkill} {selectedGame ? `ב-${selectedGame}` : ''}</span>
              </div>
            </div>

            {/* Rank (Right) */}
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">דירוג נוכחי</span>
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[13px] font-black text-primary uppercase tracking-tighter flex items-center gap-2 shadow-glow">
                <i className="fa-solid fa-ranking-star"></i>
                <span>{currentProfile.rank || 'Bronze'}</span>
              </div>
            </div>
          </div>
        </div>

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
              className="flex-1 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-2xl hover:bg-danger hover:text-white transition-all active:scale-95 shadow-lg"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="flex-1 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl hover:scale-105 transition-all active:scale-95 shadow-glow"
            >
              <i className="fa-solid fa-check"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
