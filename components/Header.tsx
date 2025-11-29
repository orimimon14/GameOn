
import React, { useState } from 'react';

interface HeaderProps {
  viewTitle: string;
  onOpenSubscriptions: () => void;
  onOpenProfile: () => void;
  onOpenChat: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  viewTitle, 
  onOpenSubscriptions, 
  onOpenProfile, 
  onOpenChat, 
  showBackButton, 
  onBack 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mock Notifications
  const notifications = [
    { id: 1, text: "יש לך התאמה חדשה עם דני!", read: false },
    { id: 2, text: "יעל עשתה לך לייק", read: false },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    // Header is now positioned relative to the main content container, NOT fixed to window right edge
    <header className="relative w-full h-16 bg-dogame-bg/95 backdrop-blur-md border-b border-white/5 shadow-sm shrink-0 flex items-center justify-between px-4 z-40">
      
        {/* Right Side Controls (Menu & Bell) */}
        <div className="flex items-center gap-2"> 
          {showBackButton ? (
              <button 
                onClick={onBack} 
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              >
                  <i className="fa-solid fa-arrow-right text-xl"></i>
              </button>
          ) : (
            <>
               {/* Menu Button */}
               <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              >
                  <i className="fa-solid fa-bars text-xl"></i>
              </button>

               {/* Notification Bell */}
               <button 
                onClick={onOpenChat}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center relative transition-colors text-white"
              >
                 <i className="fa-solid fa-bell text-xl"></i>
                 {unreadCount > 0 && (
                   <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-dogame-danger rounded-full border-2 border-dogame-bg"></span>
                 )}
              </button>
            </>
          )}

          {/* Menu Dropdown */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute top-14 right-2 w-64 bg-dogame-surface rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-pop origin-top-right ring-1 ring-black/5">
                  <div className="p-4 flex flex-col gap-2">
                    <button onClick={() => {onOpenProfile(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-xl hover:bg-white/5 flex items-center justify-between gap-3 text-lg text-white font-medium transition-colors border border-transparent hover:border-white/5">
                      <span>הפרופיל שלי</span>
                      <i className="fa-solid fa-user text-dogame-primary bg-dogame-bg p-2 rounded-lg text-xl"></i>
                    </button>
                    <button onClick={() => {onOpenChat(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-xl hover:bg-white/5 flex items-center justify-between gap-3 text-lg text-white font-medium transition-colors border border-transparent hover:border-white/5">
                      <span>הודעות</span>
                      <i className="fa-solid fa-comment text-dogame-accent bg-dogame-bg p-2 rounded-lg text-xl"></i>
                    </button>
                    <div className="h-px bg-white/10 my-2"></div>
                    <button onClick={() => {onOpenSubscriptions(); setIsMenuOpen(false)}} className="text-right px-4 py-4 rounded-xl bg-gradient-to-l from-dogame-primary/20 to-transparent flex items-center justify-between gap-3 text-lg text-white font-bold hover:from-dogame-primary/30 transition-colors border border-dogame-primary/20">
                      <span>שדרג ל-Pro</span>
                      <i className="fa-solid fa-crown text-yellow-400 text-xl"></i>
                    </button>
                  </div>
              </div>
            </>
          )}
        </div>
        
        {/* Brand - Center */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <div className="w-8 h-8 bg-dogame-primary rounded-lg flex items-center justify-center shadow-glow">
                <i className="fa-solid fa-gamepad text-white text-sm"></i>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white drop-shadow-md">
                DOGAME
            </h1>
        </div>

    </header>
  );
};

export default Header;
