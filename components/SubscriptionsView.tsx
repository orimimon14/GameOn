
import React from 'react';

interface SubscriptionsViewProps {
    onSelectPlan: (planName: string) => void;
    onUpdateCoins: (amount: number) => void;
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onSelectPlan, onUpdateCoins }) => {
    const coinPackages = [
        { amount: 100, price: 1, label: 'חבילת בסיס' },
        { amount: 550, price: 5, label: 'חבילת גיימר', bonus: '50+ בונוס' },
        { amount: 1200, price: 10, label: 'חבילת פרו', bonus: '200+ בונוס' },
        { amount: 3000, price: 20, label: 'חבילת סקוואד', bonus: '1000+ בונוס' },
    ];

    const comparisonPlans = [
        {
            name: 'Basic',
            status: 'המנוי הנוכחי שלך',
            price: 'חינם',
            isCurrent: true,
            // Only keeping the included features for the current plan
            features: [
                { text: 'צ׳אט בסיסי', included: true },
                { text: 'העלאת קבצים עד 10mb', included: true },
                { text: 'אימוג׳ים אקסקלוסיביים של האתר', included: true },
            ],
            color: 'gray'
        },
        {
            name: 'Pro Gamer',
            status: 'הבחירה של המקצוענים',
            price: '₪29.90',
            period: '/ חודש',
            isCurrent: false,
            recommended: true,
            features: [
                { text: 'צ׳אט בסיסי ופתיחת קבוצות', included: true },
                { text: 'העלאת קבצים עד 100MB', included: true },
                { text: 'אימוג׳ים ללא הגבלת האתר', included: true },
                { text: 'עיצוב פרופיל משודרג', included: true },
                { text: 'בחירה חופשית לצבע השם', included: true },
            ],
            color: 'gold'
        }
    ];

    return (
        <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
            <div className="text-center mb-16">
                <h2 className="text-6xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter mb-4 drop-shadow-2xl">
                    השוואת מנויים
                </h2>
                <p className="dark:text-dogame-muted text-gray-500 font-bold text-xl">
                    בדוק מה יש לך עכשיו ומה אתה יכול לקבל
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
                            : 'bg-white/5 border-white/10 dark:bg-dogame-surface/40'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full text-xs font-black uppercase italic tracking-widest shadow-lg">
                                מומלץ ביותר
                            </div>
                        )}

                        <div className="text-right mb-10">
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${plan.recommended ? 'text-yellow-500' : 'text-dogame-muted'}`}>
                                {plan.status}
                            </span>
                            <h3 className={`text-4xl font-black italic uppercase mb-2 ${plan.recommended ? 'text-white' : 'text-dogame-muted'}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline justify-end gap-1">
                                {plan.period && <span className="text-dogame-muted text-sm">{plan.period}</span>}
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
                                        ? plan.recommended ? 'bg-yellow-500 text-black' : 'bg-dogame-primary/20 text-dogame-primary'
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
                            {plan.isCurrent ? 'זה המנוי שלך' : 'שדרג ל-PRO עכשיו'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Buy Coins Section */}
            <div className="mb-16">
                <div className="text-right mb-8">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">קנה מטבעות</h3>
                    <p className="text-dogame-muted font-bold">המר דולרים למטבעות (1$ = 100 מטבעות)</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {coinPackages.map((pkg, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                onUpdateCoins(pkg.amount);
                                alert(`רכשת ${pkg.amount} מטבעות ב-$${pkg.price}!`);
                            }}
                            className="group relative bg-dogame-surface/40 backdrop-blur-md p-6 rounded-[32px] border border-white/5 hover:border-dogame-primary/50 transition-all text-right flex flex-col items-center lg:items-end overflow-hidden"
                        >
                            <div className="absolute -left-4 -top-4 w-20 h-20 bg-dogame-primary/10 rounded-full blur-2xl group-hover:bg-dogame-primary/20 transition-all"></div>
                            
                            <div className="relative z-10 flex items-center gap-3 mb-4">
                                <span className="text-3xl font-black text-white">{pkg.amount.toLocaleString()}</span>
                                <i className="fa-solid fa-coins text-yellow-400 text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"></i>
                            </div>
                            
                            <div className="relative z-10 text-right mb-6">
                                <span className="text-xs font-black text-dogame-muted uppercase block">{pkg.label}</span>
                                {pkg.bonus && <span className="text-[10px] font-black text-dogame-success uppercase">{pkg.bonus}</span>}
                            </div>

                            <div className="relative z-10 w-full py-3 bg-white text-dogame-bg rounded-xl font-black text-center group-hover:bg-dogame-primary group-hover:text-white transition-all">
                                ${pkg.price}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / Trusted Badges */}
            <div className="mt-20 flex flex-col items-center">
                <div className="flex gap-10 grayscale opacity-30">
                    <i className="fa-brands fa-cc-visa text-5xl"></i>
                    <i className="fa-brands fa-cc-mastercard text-5xl"></i>
                    <i className="fa-brands fa-google-pay text-5xl"></i>
                    <i className="fa-brands fa-apple-pay text-5xl"></i>
                    <i className="fa-brands fa-cc-paypal text-5xl"></i>
                </div>
                <p className="mt-8 text-dogame-muted text-[10px] font-black uppercase tracking-[0.2em]">
                    SECURE ENCRYPTED PAYMENTS
                </p>
            </div>
        </div>
    );
};

export default SubscriptionsView;
