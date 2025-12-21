
import React, { useState, useMemo } from 'react';
import { backgroundShopItems } from '../constants';
import { BackgroundItem } from '../types';

interface ShopViewProps {
    onPurchase: (item: BackgroundItem) => void;
    userCoins: number;
}

type Category = 'All' | 'Cyber' | 'Space' | 'Nature' | 'Abstract';

const ShopView: React.FC<ShopViewProps> = ({ onPurchase, userCoins }) => {
    const [previewItem, setPreviewItem] = useState<BackgroundItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'All') return backgroundShopItems;
        return backgroundShopItems.filter(item => item.category === selectedCategory);
    }, [selectedCategory]);

    const getRarityStyles = (rarity: BackgroundItem['rarity']) => {
        switch (rarity) {
            case 'Legendary': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
            case 'Epic': return 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
            case 'Rare': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    const categories: Category[] = ['All', 'Cyber', 'Space', 'Nature', 'Abstract'];

    return (
        <div className="pt-24 px-6 h-full overflow-y-auto pb-32 max-w-7xl mx-auto">
            {/* Top Bar: Stats & Welcome */}
            <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-6">
                <div className="text-right w-full lg:w-auto">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">חנות השדרוגים</h2>
                    <p className="text-dogame-muted text-lg">בטא את עצמך עם רקעים ייחודיים לפרופיל</p>
                </div>
                
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
                    {/* Category Selector */}
                    <div className="flex bg-dogame-surface/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                    selectedCategory === cat 
                                    ? 'bg-dogame-primary text-white shadow-glow' 
                                    : 'text-dogame-muted hover:text-white'
                                }`}
                            >
                                {cat === 'All' ? 'הכל' : cat}
                            </button>
                        ))}
                    </div>

                    {/* Coins Display */}
                    <div className="bg-gradient-to-br from-dogame-surface to-dogame-bg px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-dogame-muted font-bold uppercase tracking-widest">יתרה</span>
                            <span className="text-2xl font-black text-white leading-none">{userCoins.toLocaleString()}</span>
                        </div>
                        <i className="fa-solid fa-coins text-yellow-400 text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"></i>
                    </div>
                </div>
            </div>

            {/* Live Preview Area */}
            {previewItem && (
                <div className="mb-12 animate-pop">
                    <div className="flex items-center justify-between mb-3 px-1">
                         <button 
                            onClick={() => setPreviewItem(null)}
                            className="text-xs font-bold text-dogame-danger hover:underline"
                        >
                            סגור תצוגה מקדימה
                        </button>
                        <h3 className="text-sm font-bold text-white text-right">תצוגה מקדימה: {previewItem.name} {previewItem.isAnimated ? '(זז)' : '(סטטי)'}</h3>
                    </div>
                    <div className="relative h-56 w-full rounded-[32px] overflow-hidden border-4 border-dogame-primary/30 shadow-2xl group">
                        <img 
                            src={previewItem.previewUrl} 
                            className={`w-full h-full object-cover ${previewItem.animationClass || ''}`} 
                            alt="preview"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-6 right-8 flex items-end gap-6">
                            <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-dogame-surface shadow-2xl overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop" className="w-full h-full object-cover" />
                            </div>
                            <div className="mb-2">
                                <h4 className="text-2xl font-black text-white italic uppercase leading-none mb-1">{previewItem.name}</h4>
                                <span className="text-dogame-primary font-bold text-sm tracking-widest">
                                    {previewItem.isAnimated ? 'LIVE ANIMATION ACTIVE' : 'STATIC ARTWORK'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                    <div 
                        key={item.id} 
                        className="group relative bg-dogame-surface/40 backdrop-blur-sm rounded-[32px] overflow-hidden border border-white/5 hover:border-dogame-primary/50 transition-all duration-500 shadow-xl flex flex-col"
                    >
                        {/* Image Section */}
                        <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
                            <img 
                                src={item.previewUrl} 
                                className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${item.isAnimated ? item.animationClass : ''}`}
                                alt={item.name} 
                            />
                            
                            {/* Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-dogame-surface via-transparent to-transparent opacity-60"></div>
                            
                            {/* Badge: Live vs Static */}
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black text-white flex items-center gap-1.5 shadow-lg border border-white/10 ${item.isAnimated ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                {item.isAnimated ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        רקע זז
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-image text-[10px]"></i>
                                        רקע סטטי
                                    </>
                                )}
                            </div>

                            {/* Badge: Rarity */}
                            <div className={`absolute top-4 right-4 px-4 py-1 rounded-full text-[10px] font-black border backdrop-blur-md ${getRarityStyles(item.rarity)}`}>
                                {item.rarity.toUpperCase()}
                            </div>

                            {/* Hover Preview Overlay */}
                            <div className="absolute inset-0 bg-dogame-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white text-dogame-bg font-black px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    תצוגה מקדימה
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-black/20">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-right">
                                    <h4 className="text-white font-black text-xl italic uppercase tracking-tight">{item.name}</h4>
                                    <span className="text-dogame-muted text-xs font-bold">{item.category} Collection</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                    <span className="text-yellow-400 font-black text-lg leading-none">{item.price.toLocaleString()}</span>
                                    <i className="fa-solid fa-coins text-xs text-yellow-400"></i>
                                </div>
                            </div>

                            <button 
                                onClick={() => onPurchase(item)}
                                className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 ${
                                    userCoins >= item.price
                                    ? 'bg-white text-dogame-bg hover:bg-dogame-primary hover:text-white'
                                    : 'bg-white/5 text-dogame-muted cursor-not-allowed border border-white/10'
                                }`}
                                disabled={userCoins < item.price}
                            >
                                {userCoins >= item.price ? (
                                    <>
                                        <span>רכוש עכשיו</span>
                                        <i className="fa-solid fa-cart-shopping text-sm"></i>
                                    </>
                                ) : (
                                    'אין מספיק מטבעות'
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <i className="fa-solid fa-magnifying-glass text-6xl text-dogame-muted mb-6 opacity-20"></i>
                    <h3 className="text-2xl font-bold text-white mb-2">לא נמצאו פריטים בקטגוריה זו</h3>
                    <p className="text-dogame-muted">נסה לבחור קטגוריה אחרת או לחזור ל-"הכל"</p>
                </div>
            )}
        </div>
    );
};

export default ShopView;
