import React from 'react';

import { GamerProfile } from '@/shared/types';

interface SideNavProps {
  activePath: string;
  userProfile: GamerProfile;
  onNavigate: (path: string) => void;
}

const NAV_ITEMS = [
  { path: '/discover', icon: 'fa-gamepad', label: 'התאמות', bg: 'hover:bg-indigo-500' },
  { path: '/games', icon: 'fa-layer-group', label: 'משחקים', bg: 'hover:bg-emerald-500' },
  { path: '/shop', icon: 'fa-shopping-bag', label: 'חנות', bg: 'hover:bg-yellow-500' },
  { path: '/likes', icon: 'fa-heart', label: 'לייקים', bg: 'hover:bg-rose-500' },
  { path: '/chat', icon: 'fa-comment', label: 'צ׳אט', bg: 'hover:bg-sky-500' },
  { path: '/settings', icon: 'fa-gear', label: 'הגדרות', bg: 'hover:bg-gray-500' },
];

export const SideNav: React.FC<SideNavProps> = ({ activePath, userProfile, onNavigate }) => {
  return (
    <div className="fixed top-0 right-0 bottom-0 w-[100px] dark:bg-[#1E1F22]/95 bg-white/95 backdrop-blur-xl z-[60] flex flex-col items-center py-8 gap-5 border-l dark:border-white/5 border-gray-200 shadow-2xl">
      <button
        onClick={() => onNavigate('/profile')}
        className={`w-16 h-16 rounded-[24px] overflow-hidden transition-all duration-300 hover:rounded-[16px] mb-6 relative p-0.5 ${activePath === '/profile' ? 'rounded-[16px] ring-2 ring-primary shadow-glow' : 'opacity-80 hover:opacity-100'}`}
      >
        {userProfile.avatarBorder && (
          <div style={{ background: userProfile.avatarBorder }} className="absolute inset-0 z-0 bg-moving" />
        )}
        <div className="relative z-10 w-full h-full rounded-full border-2 border-background overflow-hidden">
          <img src={userProfile.image} alt="Me" className="w-full h-full object-cover" />
        </div>
      </button>

      <div className="w-12 h-[2px] dark:bg-white/10 bg-gray-200 rounded-full mb-4"></div>

      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        return (
          <div key={item.path} className="relative flex flex-col items-center justify-center group w-full px-2">
            <button
              onClick={() => onNavigate(item.path)}
              className={`w-16 h-16 flex items-center justify-center transition-all duration-300
                ${isActive ? 'rounded-[16px] bg-primary text-white shadow-glow' : 'rounded-[24px] dark:bg-surface bg-gray-100 dark:text-gray-400 text-gray-500 hover:rounded-[16px] ' + item.bg + ' hover:text-white'}`}
            >
              <i className={`fa-solid ${item.icon} text-2xl`}></i>
            </button>
            <span className={`text-[10px] font-black mt-1.5 transition-all duration-300 uppercase tracking-tighter ${isActive ? 'text-primary opacity-100' : 'text-text-muted opacity-0 group-hover:opacity-100'}`}>
              {item.label}
            </span>
            <div className={`absolute right-0 w-1 bg-primary rounded-l-lg transition-all duration-300 ${isActive ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-50'}`}></div>
          </div>
        );
      })}
    </div>
  );
};
