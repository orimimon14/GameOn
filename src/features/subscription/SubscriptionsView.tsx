
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SubscriptionsViewProps {
    onSelectPlan: (planName: string) => void;
}

// Real-money coin packs are out of MVP scope (ADR-018/ADR-034): coins are
// granted (signup bonus) and spent on cosmetics only — never bought with money.
export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onSelectPlan }) => {
    const { t } = useTranslation();
    const comparisonPlans = [
        {
            name: 'Basic',
            status: t('subscriptions.basicStatus'),
            price: t('subscriptions.free'),
            isCurrent: true,
            features: [
                { text: t('subscriptions.basicFeatures.chat'), included: true },
                { text: t('subscriptions.basicFeatures.calls'), included: true },
                { text: t('subscriptions.basicFeatures.gallery'), included: true },
            ],
            color: 'gray'
        },
        {
            name: 'Pro Gamer',
            status: t('subscriptions.proStatus'),
            price: '₪29.90',
            period: t('subscriptions.perMonth'),
            isCurrent: false,
            recommended: true,
            features: [
                { text: t('subscriptions.proFeatures.everything'), included: true },
                { text: t('subscriptions.proFeatures.media'), included: true },
                { text: t('subscriptions.proFeatures.gallery'), included: true },
                { text: t('subscriptions.proFeatures.badge'), included: true },
                { text: t('subscriptions.proFeatures.swipes'), included: true },
            ],
            color: 'gold'
        }
    ];

    return (
        <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
            <div className="text-center mb-16">
                <h2 className="text-6xl font-black dark:text-white text-text-inverse italic uppercase tracking-tighter mb-4 drop-shadow-2xl">
                    {t('subscriptions.title')}
                </h2>
                <p className="dark:text-text-muted text-gray-500 font-bold text-xl">
                    {t('subscriptions.subtitle')}
                </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                {comparisonPlans.map((plan) => (
                    <div 
                        key={plan.name}
                        className={`relative rounded-[40px] p-10 border-2 transition-all duration-500 flex flex-col ${
                            plan.recommended 
                            ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.15)] scale-105 z-10' 
                            : 'bg-white/5 border-white/10 dark:bg-surface/40'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full text-xs font-black uppercase italic tracking-widest shadow-lg">
                                {t('subscriptions.recommended')}
                            </div>
                        )}

                        <div className="text-right mb-10">
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${plan.recommended ? 'text-yellow-500' : 'text-text-muted'}`}>
                                {plan.status}
                            </span>
                            <h3 className={`text-4xl font-black italic uppercase mb-2 ${plan.recommended ? 'text-white' : 'text-text-muted'}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline justify-end gap-1">
                                {plan.period && <span className="text-text-muted text-sm">{plan.period}</span>}
                                <span className="text-4xl font-black text-white">{plan.price}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 mb-12">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center justify-end gap-4 text-right animate-pop" style={{ animationDelay: `${i * 100}ms` }}>
                                    <span className={`font-bold ${feature.included ? 'text-gray-200' : 'text-gray-500 line-through'}`}>
                                        {feature.text}
                                    </span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        feature.included 
                                        ? plan.recommended ? 'bg-yellow-500 text-black' : 'bg-primary/20 text-primary'
                                        : 'bg-white/5 text-gray-600'
                                    }`}>
                                        <i className={`fa-solid ${feature.included ? 'fa-check' : 'fa-xmark'} text-[10px]`}></i>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => !plan.isCurrent && onSelectPlan(plan.name)}
                            disabled={plan.isCurrent}
                            className={`w-full py-5 rounded-2xl font-black text-xl italic uppercase transition-all ${
                                plan.isCurrent 
                                ? 'bg-white/5 text-gray-500 cursor-default border border-white/10' 
                                : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-glow active:scale-95'
                            }`}
                        >
                            {plan.isCurrent ? t('subscriptions.currentPlan') : t('subscriptions.upgradeNow')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer / Trusted Badges */}
            <div className="mt-20 flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 grayscale opacity-30">
                    <i className="fa-brands fa-cc-visa text-5xl"></i>
                    <i className="fa-brands fa-cc-mastercard text-5xl"></i>
                    <i className="fa-brands fa-google-pay text-5xl"></i>
                    <i className="fa-brands fa-apple-pay text-5xl"></i>
                    <i className="fa-brands fa-cc-paypal text-5xl"></i>
                </div>
                <p className="mt-8 text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                    SECURE ENCRYPTED PAYMENTS
                </p>
            </div>
        </div>
    );
};

