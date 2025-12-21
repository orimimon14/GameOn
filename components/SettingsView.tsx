
import React from 'react';

interface SettingsViewProps {
    isDarkMode: boolean;
    onToggleTheme: () => void;
    isGlobalBgEnabled: boolean;
    onToggleGlobalBg: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    isDarkMode, 
    onToggleTheme, 
    isGlobalBgEnabled, 
    onToggleGlobalBg 
}) => {
    return (
        <div className="pt-24 px-6 h-full overflow-y-auto pb-32 max-w-2xl mx-auto relative z-10">
            <div className="text-right mb-10">
                <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter mb-2">הגדרות</h2>
                <p className="dark:text-dogame-muted text-gray-500 text-lg">התאם את החוויה שלך</p>
            </div>

            <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="dark:bg-dogame-surface/60 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-gray-200 shadow-xl flex items-center justify-between">
                    <button 
                        onClick={onToggleTheme}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-dogame-primary' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md flex items-center justify-center ${isDarkMode ? 'left-9' : 'left-1'}`}>
                            <i className={`fa-solid ${isDarkMode ? 'fa-moon text-dogame-primary' : 'fa-sun text-yellow-500'} text-xs`}></i>
                        </div>
                    </button>
                    <div className="text-right">
                        <h4 className="dark:text-white text-dogame-lightText font-bold text-lg">מצב כהה / בהיר</h4>
                        <p className="dark:text-dogame-muted text-gray-500 text-sm">החלף בין ערכות הנושא של האתר</p>
                    </div>
                </div>

                {/* Global Background Toggle */}
                <div className="dark:bg-dogame-surface/60 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-gray-200 shadow-xl flex items-center justify-between">
                    <button 
                        onClick={onToggleGlobalBg}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isGlobalBgEnabled ? 'bg-dogame-success' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${isGlobalBgEnabled ? 'left-9' : 'left-1'}`}></div>
                    </button>
                    <div className="text-right">
                        <h4 className="dark:text-white text-dogame-lightText font-bold text-lg">רקע גלובלי</h4>
                        <p className="dark:text-dogame-muted text-gray-500 text-sm">הצג את רקע הפרופיל שלך בכל דפי האתר</p>
                    </div>
                </div>

                {/* Account Section */}
                <div className="dark:bg-dogame-surface/40 bg-white/40 p-6 rounded-[32px] border dark:border-white/5 border-gray-200">
                    <h4 className="dark:text-white text-dogame-lightText font-black text-sm italic uppercase mb-4 opacity-50">חשבון</h4>
                    <button className="w-full text-right py-4 px-2 hover:bg-white/5 rounded-xl transition-colors dark:text-white text-dogame-lightText flex items-center justify-between border-b dark:border-white/5 border-gray-200">
                        <i className="fa-solid fa-chevron-left text-xs opacity-30"></i>
                        <span>ערוך פרטי משתמש</span>
                    </button>
                    <button className="w-full text-right py-4 px-2 hover:bg-white/5 rounded-xl transition-colors dark:text-white text-dogame-lightText flex items-center justify-between border-b dark:border-white/5 border-gray-200">
                        <i className="fa-solid fa-chevron-left text-xs opacity-30"></i>
                        <span>הגדרות פרטיות</span>
                    </button>
                    <button className="w-full text-right py-4 px-2 text-dogame-danger hover:bg-dogame-danger/10 rounded-xl transition-colors flex items-center justify-between">
                         <i className="fa-solid fa-right-from-bracket text-xs"></i>
                         <span>התנתק</span>
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center opacity-30">
                <p className="text-xs dark:text-white text-dogame-lightText uppercase font-black italic">swish & game v2.4.0</p>
            </div>
        </div>
    );
};

export default SettingsView;
