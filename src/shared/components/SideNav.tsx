import React from 'react';
import { useTranslation } from 'react-i18next';

import { GamerProfile } from '@/shared/types';

interface SideNavProps {
  activePath: string;
  userProfile: GamerProfile;
  onNavigate: (path: string) => void;
  hasUnreadChat?: boolean;
}

const NAV_ITEMS = [
  { path: '/discover', icon: 'fa-gamepad', labelKey: 'nav.discover', bg: 'hover:bg-indigo-500' },
  { path: '/games', icon: 'fa-layer-group', labelKey: 'nav.games', bg: 'hover:bg-emerald-500' },
  { path: '/shop', icon: 'fa-shopping-bag', labelKey: 'nav.shop', bg: 'hover:bg-yellow-500' },
  { path: '/likes', icon: 'fa-fire', labelKey: 'nav.likes', bg: 'hover:bg-orange-500' },
  { path: '/chat', icon: 'fa-comment', labelKey: 'nav.chat', bg: 'hover:bg-sky-500' },
  { path: '/settings', icon: 'fa-gear', labelKey: 'nav.settings', bg: 'hover:bg-gray-500' },
];

export const SideNav: React.FC<SideNavProps> = ({ activePath, userProfile, onNavigate, hasUnreadChat }) => {
  const { t } = useTranslation();

  return (
    <>
    <div className="hidden md:flex fixed top-0 end-0 bottom-0 w-[100px] dark:bg-[#1E1F22]/95 bg-white/95 backdrop-blur-xl z-[60] flex-col items-center py-8 gap-5 border-s dark:border-white/5 border-gray-200 shadow-2xl">
      <button
        onClick={() => onNavigate('/profile')}
        className={`w-16 h-16 rounded-[24px] overflow-hidden transition-all duration-300 hover:rounded-[16px] mb-6 relative p-0.5 ${activePath === '/profile' ? 'rounded-[16px] ring-2 ring-primary shadow-glow' : 'opacity-80 hover:opacity-100'}`}
      >
        {userProfile.avatarBorder && (
          <div style={{ background: userProfile.avatarBorder }} className="absolute inset-0 z-0 bg-moving" />
        )}
        <div className="relative z-10 w-full h-full rounded-full border-2 border-background overflow-hidden bg-primary/40 flex items-center justify-center">
          {userProfile.image ? (
            <img src={userProfile.image} alt="Me" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-2xl">{(userProfile.name || '?').charAt(0)}</span>
          )}
        </div>
      </button>

      <div className="w-12 h-[2px] dark:bg-white/10 bg-gray-200 rounded-full mb-4"></div>

      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        return (
          <div key={item.path} className="relative flex flex-col items-center justify-center group w-full px-2">
            <button
              onClick={() => onNavigate(item.path)}
              data-unread={item.path === '/chat' && hasUnreadChat ? 'true' : undefined}
              className={`w-16 h-16 flex items-center justify-center transition-all duration-300
                ${isActive ? 'rounded-[16px] bg-primary text-white shadow-glow' : 'rounded-[24px] dark:bg-surface bg-gray-100 dark:text-gray-400 text-gray-500 hover:rounded-[16px] ' + item.bg + ' hover:text-white'}`}
            >
              {item.path === '/chat' && hasUnreadChat && (
                <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span>
              )}
              <i className={`fa-solid ${item.icon} text-2xl`}></i>
            </button>
            <span className={`text-[10px] font-black mt-1.5 transition-all duration-300 uppercase tracking-tighter ${isActive ? 'text-primary opacity-100' : 'text-text-muted opacity-0 group-hover:opacity-100'}`}>
              {t(item.labelKey)}
            </span>
            <div className={`absolute end-0 w-1 bg-primary rounded-s-lg transition-all duration-300 ${isActive ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-50'}`}></div>
          </div>
        );
      })}
    </div>

    {/* Mobile bottom tab bar (like Instagram) — desktop keeps the side rail */}
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[60] dark:bg-[#1E1F22]/95 bg-white/95 backdrop-blur-xl border-t dark:border-white/10 border-gray-200 flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            aria-label={t(item.labelKey)}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 flex-1 transition-colors ${isActive ? 'text-primary' : 'dark:text-white/60 text-gray-500'}`}
          >
            <span className="relative">
              {item.path === '/chat' && hasUnreadChat && (
                <span className="absolute -top-1 -end-1.5 w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              )}
              <i className={`fa-solid ${item.icon} text-lg`}></i>
            </span>
            <span className="text-[9px] font-black">{t(item.labelKey)}</span>
          </button>
        );
      })}
      <button
        onClick={() => onNavigate('/profile')}
        aria-label={t('titles.profile')}
        className={`flex flex-col items-center justify-center gap-1 py-2.5 flex-1 transition-colors ${activePath === '/profile' ? 'text-primary' : 'dark:text-white/60 text-gray-500'}`}
      >
        <div
          className="w-6 h-6 rounded-full overflow-hidden bg-primary/40 flex items-center justify-center"
          style={userProfile.avatarBorder ? { boxShadow: '0 0 0 2px transparent', border: '2px solid transparent', backgroundImage: `linear-gradient(#1E1F22,#1E1F22), ${userProfile.avatarBorder}`, backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box' } : undefined}
        >
          {userProfile.image ? (
            <img src={userProfile.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-[10px]">{(userProfile.name || '?').charAt(0)}</span>
          )}
        </div>
        <span className="text-[9px] font-black">{t('titles.profile')}</span>
      </button>
    </nav>
    </>
  );
};
