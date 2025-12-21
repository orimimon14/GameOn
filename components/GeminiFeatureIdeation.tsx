
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
            <div className="text-right mb-10">
                <div className="flex items-center justify-end gap-3 mb-2">
                    <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter">מנוע הסקוואד</h2>
                    <i className="fa-solid fa-microchip text-dogame-primary animate-pulse text-3xl"></i>
                </div>
                <p className="dark:text-dogame-muted text-gray-500 font-bold">בינה מלאכותית שתעזור לך לבנות את הקבוצה המנצחת</p>
            </div>

            <div className="dark:bg-dogame-surface/40 bg-white/40 backdrop-blur-xl rounded-[32px] p-8 border dark:border-white/10 border-gray-200 shadow-2xl mb-8">
                <h3 className="text-white font-bold mb-4 text-right">איך אתה אוהב לשחק?</h3>
                <div className="relative">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="למשל: אני אוהב לשחק אגרסיבי, עם צלפים, וצריך מישהו שיחפה עליי..."
                        className="w-full h-32 dark:bg-black/30 bg-white/50 border dark:border-white/10 border-gray-200 rounded-2xl p-6 dark:text-white text-dogame-lightText focus:outline-none focus:border-dogame-primary transition-all text-right shadow-inner"
                    />
                    <div className="absolute left-4 bottom-4 flex gap-2">
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !input.trim()}
                            className={`px-8 py-3 rounded-xl font-black italic uppercase transition-all flex items-center gap-2 ${loading ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-dogame-primary text-white shadow-glow hover:scale-105'}`}
                        >
                            {loading ? (
                                <>
                                    <span>סורק...</span>
                                    <i className="fa-solid fa-spinner animate-spin"></i>
                                </>
                            ) : (
                                <>
                                    <span>הפעל מנוע</span>
                                    <i className="fa-solid fa-bolt"></i>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 border-4 border-dogame-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black italic uppercase animate-pulse dark:text-dogame-primary">מנתח סגנון משחק...</p>
                </div>
            )}

            {result && !loading && (
                <div className="animate-pop space-y-6">
                    <div className="dark:bg-dogame-primary/10 bg-dogame-primary/5 border border-dogame-primary/30 p-8 rounded-[32px] text-right">
                        <h3 className="text-3xl font-black text-dogame-primary italic uppercase mb-2">{result.strategyName}</h3>
                        <p className="dark:text-white text-dogame-lightText text-lg font-bold">{result.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.roles.map((role: any, idx: number) => (
                            <div key={idx} className="dark:bg-dogame-surface/60 bg-white/80 p-6 rounded-2xl border dark:border-white/5 border-gray-200 text-right hover:border-dogame-primary transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] bg-dogame-primary/20 text-dogame-primary px-3 py-1 rounded-full font-black uppercase">{role.heroType}</span>
                                    <h4 className="font-black text-white italic text-xl">{role.role}</h4>
                                </div>
                                <p className="text-dogame-muted text-sm">{role.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="dark:bg-black/20 bg-white/20 p-6 rounded-2xl border dark:border-white/5 border-gray-200">
                        <h4 className="font-black text-white italic uppercase mb-4 text-right">טיפים לניצחון</h4>
                        <ul className="space-y-2">
                            {result.tips.map((tip: string, idx: number) => (
                                <li key={idx} className="flex items-center justify-end gap-3 dark:text-gray-300 text-gray-600 text-sm">
                                    <span>{tip}</span>
                                    <i className="fa-solid fa-check-circle text-dogame-success"></i>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeminiSquadEngine;
