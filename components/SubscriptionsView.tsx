
import React, { useState } from 'react';

interface SubscriptionsViewProps {
    onSelectPlan: (planName: string) => void;
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onSelectPlan }) => {
    const [boostTarget, setBoostTarget] = useState(100);
    const costPerTen = 1; // 1 dollar per 10 people
    const totalCost = (boostTarget / 10) * costPerTen;

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

            {/* Profile Boost: Separate action */}
            <div className="relative overflow-hidden dark:bg-dogame-surface/80 bg-white/90 backdrop-blur-2xl rounded-[40px] p-8 lg:p-14 border border-white/10 shadow-2xl mb-16">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2 text-right">
                        <div className="inline-flex items-center gap-2 bg-dogame-primary/20 text-dogame-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <i className="fa-solid fa-bolt"></i>
                            <span>BOOST YOUR PROFILE</span>
                        </div>
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">הקפצה חד פעמית</h3>
                        <p className="text-dogame-muted text-lg font-bold leading-relaxed mb-8">
                            לא רוצה מנוי? אין בעיה. שלם רק כשאתה צריך חשיפה מטורפת לזמן מוגבל.
                        </p>
                        <div className="bg-black/20 p-6 rounded-[24px] border border-white/5 flex items-center justify-between">
                            <span className="text-2xl font-black text-dogame-primary tracking-tight">PAY PER USE</span>
                            <div className="text-right">
                                <span className="text-[10px] text-dogame-muted font-black uppercase block mb-1">מחיר הוגן</span>
                                <span className="text-xl font-black text-white">$1 / 10 חשיפות</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 w-full bg-black/30 backdrop-blur-md p-10 rounded-[36px] border border-white/5 shadow-inner">
                        <div className="text-center mb-8">
                            <div className="text-6xl font-black text-white italic tracking-tighter mb-2">{boostTarget}</div>
                            <p className="text-dogame-primary font-bold uppercase text-xs tracking-widest">חשיפות ממוקדות</p>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="1000" 
                            step="10" 
                            value={boostTarget} 
                            onChange={(e) => setBoostTarget(parseInt(e.target.value))}
                            className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-dogame-primary mb-10"
                        />
                        <div className="flex items-center justify-between mb-8 bg-white/5 p-5 rounded-2xl">
                            <span className="text-2xl font-black text-white">${totalCost.toFixed(2)}</span>
                            <span className="text-sm font-bold text-dogame-muted">סה"כ לתשלום</span>
                        </div>
                        <button 
                            onClick={() => alert(`הקפצת את הפרופיל ל-${boostTarget} משתמשים!`)}
                            className="w-full py-6 bg-gradient-to-r from-dogame-primary to-dogame-accent text-white font-black text-2xl italic uppercase rounded-2xl shadow-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                        >
                            <span>הקפץ עכשיו</span>
                            <i className="fa-solid fa-rocket"></i>
                        </button>
                    </div>
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
