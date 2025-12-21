
import React from 'react';

interface SubscriptionsViewProps {
    onSelectPlan: (planName: string) => void;
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onSelectPlan }) => {
    const plans = [
        {
            name: 'Basic',
            price: 'חינם',
            period: '',
            features: [
                '10 סוואייפים ביום',
                'צ׳אט עם התאמות',
                'מנוע אסטרטגיה בסיסי',
                'חיפוש שחקנים בסיסי'
            ],
            color: 'gray',
            buttonText: 'התוכנית הנוכחית',
            isCurrent: true,
            icon: 'fa-user'
        },
        {
            name: 'Pro',
            price: '₪29',
            period: '/ חודש',
            features: [
                'סוואייפים ללא הגבלה',
                'ראה מי עשה לך לייק',
                'הצמד פרופיל לראש הרשימה',
                'רקעי פרופיל Epic בלעדיים',
                'ללא פרסומות'
            ],
            color: 'indigo',
            buttonText: 'בחר בתוכנית Pro',
            recommended: true,
            icon: 'fa-shield-halved'
        },
        {
            name: 'Elite',
            price: '₪59',
            period: '/ חודש',
            features: [
                'כל היתרונות של Pro',
                'מנוע אסטרטגיה AI ללא הגבלה',
                'רקעי Legendary זזים בלעדיים',
                'תג "שחקן מובחר" בפרופיל',
                'תמיכה בעדיפות עליונה'
            ],
            color: 'yellow',
            buttonText: 'בחר בתוכנית Elite',
            isElite: true,
            icon: 'fa-crown'
        }
    ];

    return (
        <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter mb-4 drop-shadow-xl">שדרג את החוויה שלך</h2>
                <p className="dark:text-dogame-muted text-gray-500 font-bold text-xl">קבל יותר כלים, יותר סטייל ויותר התאמות</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.name}
                        className={`relative group flex flex-col rounded-[40px] p-8 border-2 transition-all duration-500 hover:scale-[1.03] ${
                            plan.recommended 
                            ? 'dark:bg-dogame-primary/10 bg-indigo-50 border-dogame-primary shadow-glow scale-105' 
                            : plan.isElite 
                            ? 'dark:bg-yellow-400/10 bg-yellow-50 border-yellow-500 shadow-xl shadow-yellow-500/10'
                            : 'dark:bg-dogame-surface/40 bg-white border-white/10 dark:border-white/5 shadow-2xl'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-dogame-primary text-white text-[10px] font-black px-6 py-2 rounded-full uppercase italic tracking-widest shadow-glow">
                                הכי פופולרי
                            </div>
                        )}
                        {plan.isElite && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-6 py-2 rounded-full uppercase italic tracking-widest shadow-lg">
                                השחקן המושלם
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                                 plan.color === 'indigo' ? 'bg-indigo-500 text-white' : 
                                 plan.color === 'yellow' ? 'bg-yellow-500 text-black' : 
                                 'bg-gray-500 text-white'
                             }`}>
                                 <i className={`fa-solid ${plan.icon}`}></i>
                             </div>
                             <div className="text-right">
                                 <h3 className="text-2xl font-black dark:text-white text-dogame-lightText italic uppercase">{plan.name}</h3>
                                 <div className="flex items-end justify-end gap-1">
                                    <span className="text-xs dark:text-dogame-muted text-gray-500 mb-1">{plan.period}</span>
                                    <span className="text-3xl font-black dark:text-white text-dogame-lightText tracking-tighter">{plan.price}</span>
                                 </div>
                             </div>
                        </div>

                        <div className="flex-1">
                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center justify-end gap-3 text-right">
                                        <span className="dark:text-gray-200 text-gray-700 font-bold text-sm">{feature}</span>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                            plan.isCurrent ? 'bg-gray-500/20 text-gray-500' : 
                                            plan.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' : 
                                            'bg-dogame-primary/20 text-dogame-primary'
                                        }`}>
                                            <i className="fa-solid fa-check text-[10px]"></i>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button 
                            onClick={() => !plan.isCurrent && onSelectPlan(plan.name)}
                            disabled={plan.isCurrent}
                            className={`w-full py-5 rounded-2xl font-black italic uppercase transition-all active:scale-95 shadow-lg ${
                                plan.isCurrent 
                                ? 'bg-gray-500/20 text-gray-500 cursor-default' 
                                : plan.color === 'yellow'
                                ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/30'
                                : 'bg-dogame-primary text-white hover:bg-indigo-400 shadow-indigo-500/30 shadow-glow'
                            }`}
                        >
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            {/* Trusted Badges */}
            <div className="mt-16 pt-12 border-t dark:border-white/5 border-gray-100 flex flex-col items-center">
                <p className="text-dogame-muted font-bold text-sm uppercase tracking-widest mb-6">תשלום מאובטח באמצעות</p>
                <div className="flex gap-8 grayscale opacity-50">
                    <i className="fa-brands fa-cc-visa text-4xl"></i>
                    <i className="fa-brands fa-cc-mastercard text-4xl"></i>
                    <i className="fa-brands fa-google-pay text-4xl"></i>
                    <i className="fa-brands fa-apple-pay text-4xl"></i>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsView;
