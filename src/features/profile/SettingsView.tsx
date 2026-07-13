
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { updateMyDiscoverable, updateMyPreferredLocale } from './profileApi';

import { getFirebase } from '@/config/firebase';
import { useAuthStore } from '@/features/auth/authStore';
import { useLocale } from '@/shared/i18n/useLocale';
import { useUserStore } from '@/shared/store/userStore';


interface SettingsViewProps {
    isDarkMode: boolean;
    onToggleTheme: () => void;
    isGlobalBgEnabled: boolean;
    onToggleGlobalBg: () => void;
    onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    isDarkMode,
    onToggleTheme,
    isGlobalBgEnabled,
    onToggleGlobalBg,
    onLogout
}) => {
    const { t, i18n } = useTranslation();
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(false);

    // ADR-038 — mandatory in-app account deletion, double-confirmed.
    const handleDeleteAccount = async () => {
        if (deleting) return;
        if (!window.confirm(t('settings.deleteConfirm1'))) return;
        if (!window.confirm(t('settings.deleteConfirm2'))) return;
        setDeleting(true);
        setDeleteError(false);
        try {
            const { functions } = getFirebase();
            await httpsCallable(functions, 'deleteAccount')({ confirm: true });
            onLogout();
        } catch {
            setDeleteError(true);
            setDeleting(false);
        }
    };
    const { locale, setLocale } = useLocale();
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const userDoc = useUserStore((s) => s.userDoc);
    // Privacy panel: isDiscoverable is client-writable (DATA_MODEL §4.1).
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [privacyBusy, setPrivacyBusy] = useState(false);
    const [privacyError, setPrivacyError] = useState(false);
    const isDiscoverable = userDoc?.isDiscoverable !== false;

    const toggleDiscoverable = async () => {
        if (!user || privacyBusy) return;
        setPrivacyBusy(true);
        setPrivacyError(false);
        try {
            await updateMyDiscoverable(user.uid, !isDiscoverable);
        } catch {
            setPrivacyError(true);
        } finally {
            setPrivacyBusy(false);
        }
    };

    const chooseLocale = (next: 'he' | 'en') => {
        setLocale(next);
        // Persist to users/{uid}.preferredLocale (client-writable, ADR-035) — best effort.
        if (user) void updateMyPreferredLocale(user.uid, next).catch(() => undefined);
    };

    return (
        <div className="pt-24 px-6 h-full overflow-y-auto pb-32 max-w-2xl mx-auto relative z-10">
            <div className="text-right mb-10">
                <h2 className="text-4xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter mb-2">{t('settings.title')}</h2>
                <p className="dark:text-text-muted text-gray-500 text-lg">{t('settings.subtitle')}</p>
            </div>

            <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="dark:bg-surface/60 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-gray-200 shadow-xl flex items-center justify-between">
                    <button 
                        onClick={onToggleTheme}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md flex items-center justify-center ${isDarkMode ? 'left-9' : 'left-1'}`}>
                            <i className={`fa-solid ${isDarkMode ? 'fa-moon text-primary' : 'fa-sun text-yellow-500'} text-xs`}></i>
                        </div>
                    </button>
                    <div className="text-right">
                        <h4 className="dark:text-white text-text-inverse font-bold text-lg">{t('settings.themeTitle')}</h4>
                        <p className="dark:text-text-muted text-gray-500 text-sm">{t('settings.themeNote')}</p>
                    </div>
                </div>

                {/* Global Background Toggle */}
                <div className="dark:bg-surface/60 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-gray-200 shadow-xl flex items-center justify-between">
                    <button 
                        onClick={onToggleGlobalBg}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isGlobalBgEnabled ? 'bg-success' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${isGlobalBgEnabled ? 'left-9' : 'left-1'}`}></div>
                    </button>
                    <div className="text-right">
                        <h4 className="dark:text-white text-text-inverse font-bold text-lg">{t('settings.globalBgTitle')}</h4>
                        <p className="dark:text-text-muted text-gray-500 text-sm">{t('settings.globalBgNote')}</p>
                    </div>
                </div>

                {/* Language Switcher (ADR-035) */}
                <div className="dark:bg-surface/60 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border dark:border-white/10 border-gray-200 shadow-xl flex items-center justify-between">
                    <div className="flex gap-2" data-testid="language-switcher">
                        <button
                            onClick={() => chooseLocale('he')}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${locale === 'he' ? 'bg-primary text-white shadow-glow' : 'dark:bg-white/5 bg-gray-100 dark:text-text-muted text-gray-500 hover:bg-white/10'}`}
                        >
                            {t('settings.hebrew')}
                        </button>
                        <button
                            onClick={() => chooseLocale('en')}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${locale === 'en' ? 'bg-primary text-white shadow-glow' : 'dark:bg-white/5 bg-gray-100 dark:text-text-muted text-gray-500 hover:bg-white/10'}`}
                        >
                            {t('settings.english')}
                        </button>
                    </div>
                    <div className="text-start">
                        <h4 className="dark:text-white text-text-inverse font-bold text-lg">{t('settings.language')}</h4>
                        <p className="dark:text-text-muted text-gray-500 text-sm">{t('settings.languageNote')}</p>
                    </div>
                </div>

                {/* Account Section */}
                <div className="dark:bg-surface/40 bg-white/40 p-6 rounded-[32px] border dark:border-white/5 border-gray-200">
                    <h4 className="dark:text-white text-text-inverse font-black text-sm italic uppercase mb-4 opacity-50">{t('settings.accountSection')}</h4>
                    <button
                        onClick={() => navigate('/profile?edit=1')}
                        className="w-full text-right py-4 px-2 hover:bg-white/5 rounded-xl transition-colors dark:text-white text-text-inverse flex items-center justify-between border-b dark:border-white/5 border-gray-200"
                    >
                        <i className="fa-solid fa-chevron-left text-xs opacity-30 rtl:rotate-0 ltr:rotate-180"></i>
                        <span>{t('settings.editProfile')}</span>
                    </button>
                    <button
                        onClick={() => setPrivacyOpen((v) => !v)}
                        className="w-full text-right py-4 px-2 hover:bg-white/5 rounded-xl transition-colors dark:text-white text-text-inverse flex items-center justify-between border-b dark:border-white/5 border-gray-200"
                    >
                        <i className={`fa-solid fa-chevron-down text-xs opacity-30 transition-transform ${privacyOpen ? 'rotate-180' : ''}`}></i>
                        <span>{t('settings.privacy')}</span>
                    </button>
                    {privacyOpen && (
                        <div className="py-4 px-2 flex items-center justify-between gap-4 border-b dark:border-white/5 border-gray-200">
                            <button
                                onClick={() => void toggleDiscoverable()}
                                disabled={privacyBusy}
                                aria-label={t('settings.discoverableTitle')}
                                className={`relative w-16 h-8 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${isDiscoverable ? 'bg-success' : 'bg-gray-500'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md ${isDiscoverable ? 'left-9' : 'left-1'}`}></div>
                            </button>
                            <div className="text-right min-w-0">
                                <h5 className="dark:text-white text-text-inverse font-bold">{t('settings.discoverableTitle')}</h5>
                                <p className="dark:text-text-muted text-gray-500 text-sm">
                                    {isDiscoverable ? t('settings.discoverableOnNote') : t('settings.discoverableOffNote')}
                                </p>
                                {privacyError && (
                                    <p role="alert" className="text-danger text-sm font-bold mt-1">{t('settings.privacyError')}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <button onClick={onLogout} className="w-full text-right py-4 px-2 text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center justify-between border-b dark:border-white/5 border-gray-200">
                         <i className="fa-solid fa-right-from-bracket text-xs"></i>
                         <span>{t('auth.logout')}</span>
                    </button>
                    <button
                        onClick={() => void handleDeleteAccount()}
                        disabled={deleting}
                        className="w-full text-right py-4 px-2 text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center justify-between disabled:opacity-50"
                    >
                         <i className="fa-solid fa-trash text-xs"></i>
                         <span>{deleting ? t('settings.deletingAccount') : t('settings.deleteAccount')}</span>
                    </button>
                    {deleteError && (
                        <p role="alert" className="text-danger font-bold text-sm mt-2 text-center">{t('settings.deleteError')}</p>
                    )}
                </div>
            </div>

            <div className="mt-12 text-center opacity-30">
                <p className="text-xs dark:text-white text-text-inverse uppercase font-black italic">Swish & Game</p>
                {/* Real build stamp — instantly tells support whether this phone runs a stale bundle */}
                <p className="text-xs dark:text-white text-text-inverse mt-1" dir="auto">
                    {t('settings.buildVersion', {
                        date: new Date(Number(__BUILD_ID__)).toLocaleString(
                            i18n.language === 'he' ? 'he-IL' : 'en-GB',
                            { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
                        ),
                    })}
                </p>
            </div>
        </div>
    );
};

