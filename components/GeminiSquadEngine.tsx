
import React, { useState } from 'react';
import { generateSquadStrategy } from '../services/geminiService';

const GeminiSquadEngine: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        const data = await generateSquadStrategy(input);
        setResult(data);
        setLoading(false);
    };

    return (
        <div className="p-6 pt-24 pb-32 max-w-4xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
            <div className="text-right mb-10 flex flex-col items-end">
                <div className="flex items-center justify-end gap-3 mb-2">
                    <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter">מנוע הסקוואד</h2>
                    <div className="w-10 h-10 rounded-xl bg-dogame-primary/20 flex items-center justify-center border border-dogame-primary/30">
                        <i className="fa-solid fa-microchip text-dogame-primary animate-pulse"></i>
                    </div>
                </div>
                <p className="dark:text-dogame-muted text-gray-500 font-bold max-w-sm">בינה מלאכותית שמנתחת את סגנון המשחק שלך ובונה לך את הקבוצה המנצחת</p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-dogame-primary to-dogame-accent rounded-[36px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative dark:bg-dogame-surface/40 bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border dark:border-white/10 border-gray-200 shadow-2xl mb-12">
                    <h3 className="text-white font-black italic uppercase mb-4 text-right flex items-center justify-end gap-2">
                        <span>הזן סגנון משחק</span>
                        <i className="fa-solid fa-terminal text-dogame-primary text-xs"></i>
                    </h3>
                    <div className="relative">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="למשל: אני אוהב לשחק אגרסיבי ב-Warzone, צריך מישהו שיחפה עליי מרחוק ומישהו שמומחה בנהיגה..."
                            className="w-full h-36 dark:bg-black/40 bg-white/50 border dark:border-white/10 border-gray-200 rounded-2xl p-6 dark:text-white text-dogame-lightText focus:outline-none focus:border-dogame-primary transition-all text-right shadow-inner placeholder:opacity-30"
                        />
                        <div className="absolute left-4 bottom-4 flex gap-2">
                            <button 
                                onClick={handleGenerate}
                                disabled={loading || !input.trim()}
                                className={`px-10 py-4 rounded-2xl font-black italic uppercase transition-all flex items-center gap-3 overflow-hidden group ${loading ? 'bg-gray-500/50 opacity-50 cursor-not-allowed' : 'bg-dogame-primary text-white shadow-glow hover:scale-105 hover:shadow-indigo-500/50'}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="relative z-10">מנתח מערכות...</span>
                                        <i className="fa-solid fa-sync animate-spin relative z-10"></i>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10">ג׳נרט אסטרטגיה</span>
                                        <i className="fa-solid fa-wand-magic-sparkles relative z-10"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-dogame-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-dogame-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-4 border-2 border-dogame-accent/40 border-b-transparent rounded-full animate-spin-slow"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-black italic uppercase animate-pulse dark:text-dogame-primary text-xl tracking-tighter">המערכת מעבדת נתונים</p>
                        <p className="text-dogame-muted text-sm mt-1">מתחבר לשרתי Gemini...</p>
                    </div>
                </div>
            )}

            {result && !loading && (
                <div className="animate-pop space-y-8 pb-10">
                    {/* Strategy Banner */}
                    <div className="relative overflow-hidden dark:bg-dogame-primary/10 bg-dogame-primary/5 border border-dogame-primary/30 p-10 rounded-[40px] text-right">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-dogame-primary blur-[100px] opacity-20"></div>
                        <span className="bg-dogame-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-glow">תוצאת בינה מלאכותית</span>
                        <h3 className="text-4xl font-black text-dogame-primary italic uppercase mb-4 drop-shadow-sm">{result.strategyName}</h3>
                        <p className="dark:text-white text-dogame-lightText text-xl font-bold leading-relaxed">{result.description}</p>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.roles.map((role: any, idx: number) => (
                            <div key={idx} className="group dark:bg-dogame-surface/40 bg-white/70 p-8 rounded-[32px] border dark:border-white/5 border-gray-100 text-right hover:border-dogame-primary transition-all duration-500 hover:shadow-2xl">
                                <div className="flex justify-between items-center mb-5">
                                    <div className="bg-dogame-primary/10 text-dogame-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider group-hover:bg-dogame-primary group-hover:text-white transition-colors">
                                        {role.heroType}
                                    </div>
                                    <h4 className="font-black text-white italic text-2xl group-hover:text-dogame-primary transition-colors">{role.role}</h4>
                                </div>
                                <p className="text-dogame-muted text-lg font-medium leading-relaxed group-hover:text-gray-200 transition-colors">{role.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pro Tips Section */}
                    <div className="dark:bg-black/30 bg-white/40 p-10 rounded-[40px] border dark:border-white/5 border-gray-200 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-dogame-accent blur-[120px] opacity-10"></div>
                        <h4 className="font-black text-white italic uppercase mb-6 text-right flex items-center justify-end gap-3 text-2xl">
                            <span>פרו-טיפס לניצחון</span>
                            <i className="fa-solid fa-lightbulb text-yellow-400"></i>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.tips.map((tip: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-end gap-4 p-4 dark:bg-white/5 bg-black/5 rounded-2xl border border-transparent hover:border-white/10 transition-all">
                                    <span className="dark:text-gray-300 text-gray-700 font-bold text-right">{tip}</span>
                                    <div className="w-6 h-6 rounded-full bg-dogame-success/20 flex items-center justify-center shrink-0">
                                        <i className="fa-solid fa-check text-dogame-success text-[10px]"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Empty State / Suggestions */}
            {!result && !loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-50">
                    {['סגנון התקפי מהיר', 'סגנון הגנתי וטקטי', 'משחק קבוצתי מבוסס תמיכה'].map((text, i) => (
                        <button key={i} onClick={() => setInput(text)} className="p-4 border border-dashed border-white/20 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold italic uppercase text-center">
                            {text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GeminiSquadEngine;
