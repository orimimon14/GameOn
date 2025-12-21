
import React from 'react';

interface GamesViewProps {
    onSelectGame: (gameName: string) => void;
}

const GamesView: React.FC<GamesViewProps> = ({ onSelectGame }) => {
    const popularGames = [
        {
            name: 'Call of Duty: Warzone',
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
            players: '1.2k מחוברים',
            color: 'bg-orange-500'
        },
        {
            name: 'FIFA 24 / FC 24',
            image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop',
            players: '850 מחוברים',
            color: 'bg-blue-600'
        },
        {
            name: 'Minecraft',
            image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1974&auto=format&fit=crop',
            players: '2.5k מחוברים',
            color: 'bg-green-600'
        },
        {
            name: 'Apex Legends',
            image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop',
            players: '900 מחוברים',
            color: 'bg-red-600'
        },
        {
            name: 'Fortnite',
            image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?q=80&w=1974&auto=format&fit=crop',
            players: '5k מחוברים',
            color: 'bg-indigo-600'
        },
        {
            name: 'League of Legends',
            image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop',
            players: '10k מחוברים',
            color: 'bg-sky-700'
        }
    ];

    return (
        <div className="p-6 pt-24 pb-32 max-w-6xl mx-auto relative z-10 no-scrollbar overflow-y-auto h-full">
            <div className="text-right mb-12">
                <h2 className="text-4xl font-black dark:text-white text-dogame-lightText italic uppercase tracking-tighter mb-2">בחר משחק</h2>
                <p className="dark:text-dogame-muted text-gray-500 font-bold">מצא שותפים למשחק הספציפי שאתה אוהב</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularGames.map((game, index) => (
                    <button 
                        key={index}
                        onClick={() => onSelectGame(game.name)}
                        className="group relative h-64 rounded-[32px] overflow-hidden border-2 border-transparent hover:border-dogame-primary transition-all duration-300 shadow-2xl active:scale-95"
                    >
                        <img 
                            src={game.image} 
                            alt={game.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        
                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{game.players}</span>
                            <h3 className="text-2xl font-black text-white italic uppercase drop-shadow-lg">{game.name}</h3>
                            
                            <div className="mt-4 flex items-center justify-end gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <span className="text-xs font-bold text-dogame-primary uppercase italic">הצג שחקנים</span>
                                <div className="w-8 h-8 rounded-full bg-dogame-primary text-white flex items-center justify-center shadow-glow">
                                    <i className="fa-solid fa-arrow-left text-[10px]"></i>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-16 bg-white/5 border border-dashed border-white/10 rounded-[32px] p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-plus text-2xl text-dogame-muted"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">לא מוצא את המשחק שלך?</h3>
                <p className="text-dogame-muted text-sm max-w-sm mx-auto">אנחנו מוסיפים משחקים חדשים בכל שבוע. שלח לנו הצעה ונשמח להוסיף אותה!</p>
                <button className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all">
                    הצע משחק חדש
                </button>
            </div>
        </div>
    );
};

export default GamesView;
