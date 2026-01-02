
import React, { useState, useMemo } from 'react';
import { backgroundShopItems } from '../constants';
import { BackgroundItem } from '../types';

interface ShopViewProps {
    onPurchase: (item: BackgroundItem) => void;
    userCoins: number;
    ownedItems: BackgroundItem[];
}

type Category = 'All' | 'Borders' | 'Cyber' | 'Space' | 'Nature' | 'Abstract';

const ShopView: React.FC<ShopViewProps> = ({ onPurchase, userCoins, ownedItems }) => {
    const [previewItem, setPreviewItem] = useState<BackgroundItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'All') return backgroundShopItems;
        return backgroundShopItems.filter(item => item.category === selectedCategory);
    }, [selectedCategory]);

    const isOwned = (id: string) => ownedItems.some(item => item.id === id);

    const getRarityStyles = (rarity: BackgroundItem['rarity']) => {
        switch (rarity) {
            case 'Legendary': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
            case 'Epic': return 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
            case 'Rare': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    const categories: Category[] = ['All', 'Borders', 'Cyber', 'Space', 'Nature', 'Abstract'];

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Full Screen Live Preview Background (Only for background types) */}
            {previewItem && previewItem.itemType === 'background' && (
                <div 
                    className={`absolute inset-0 z-0 transition-all duration-1000 opacity-30 pointer-events-none ${previewItem.isAnimated ? previewItem.animationClass : ''}`}
                    style={{ background: previewItem.previewUrl }}
                />
            )}

            <div className="relative z-10 pt-24 px-6 h-full overflow-y-auto pb-32 max-w-7xl mx-auto no-scrollbar">
                {/* Top Bar: Stats & Welcome */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-6">
                    <div className="text-right w-full lg:w-auto">
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">חנות הצבעים</h2>
                        <p className="text-dogame-muted text-lg">בחר את האווירה שלך עם צבעים, גרדיאנטים ומסגרות פרופיל</p>
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
                                    {cat === 'All' ? 'הכל' : cat === 'Borders' ? 'מסגרות' : cat}
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

                {/* Status Message for Preview */}
                {previewItem && (
                    <div className="mb-8 animate-pop text-center bg-white/5 backdrop-blur-md py-6 rounded-3xl border border-white/10 flex flex-col items-center">
                        <p className="text-white font-black italic uppercase text-lg tracking-wider mb-4">
                            <span className="text-dogame-primary ml-2">מציג כעת:</span>
                            {previewItem.name}
                        </p>
                        
                        {/* If it's a border, show a special preview */}
                        {previewItem.itemType === 'avatar-border' ? (
                            <div className="relative w-32 h-32 mb-4 p-1.5 rounded-full overflow-hidden flex items-center justify-center">
                                <div 
                                    style={{ background: previewItem.previewUrl }} 
                                    className={`absolute inset-0 z-0 ${previewItem.isAnimated ? previewItem.animationClass : ''}`}
                                />
                                <div className="relative z-10 w-full h-full rounded-full border-[6px] border-dogame-bg overflow-hidden bg-dogame-surface">
                                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop" className="w-full h-full object-cover" alt="Avatar Preview" />
                                </div>
                            </div>
                        ) : null}

                        <button 
                            onClick={() => setPreviewItem(null)}
                            className="text-xs font-bold text-dogame-danger hover:underline uppercase"
                        >
                            בטל תצוגה מקדימה
                        </button>
                    </div>
                )}

                {/* Shop Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredItems.map((item) => {
                        const owned = isOwned(item.id);
                        const isBeingPreviewed = previewItem?.id === item.id;
                        const isBorder = item.itemType === 'avatar-border';
                        
                        return (
                            <div 
                                key={item.id} 
                                className={`group relative bg-dogame-surface/40 backdrop-blur-sm rounded-[32px] overflow-hidden border transition-all duration-500 shadow-xl flex flex-col ${
                                    isBeingPreviewed ? 'border-dogame-primary scale-[1.02] shadow-glow' : 'border-white/5 hover:border-dogame-primary/50'
                                }`}
                            >
                                {/* Color Swatch Section */}
                                <div className="relative aspect-[16/9] overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
                                    {isBorder ? (
                                        /* Border Preview in Grid */
                                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                            <div className="relative w-24 h-24 p-1 rounded-full overflow-hidden">
                                                <div 
                                                    style={{ background: item.previewUrl }} 
                                                    className={`absolute inset-0 ${item.isAnimated ? item.animationClass : ''}`}
                                                />
                                                <div className="relative z-10 w-full h-full rounded-full border-4 border-dogame-bg flex items-center justify-center bg-dogame-surface text-dogame-muted">
                                                    <i className="fa-solid fa-user text-3xl"></i>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Background Preview in Grid */
                                        <div 
                                            style={{ background: item.previewUrl }}
                                            className={`w-full h-full transition-transform duration-1000 group-hover:scale-110 ${item.isAnimated ? item.animationClass : ''}`}
                                        />
                                    )}
                                    
                                    {/* Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-dogame-surface/40 via-transparent to-transparent opacity-60"></div>
                                    
                                    {/* Badge: Live vs Static */}
                                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black text-white flex items-center gap-1.5 shadow-lg border border-white/10 ${item.isAnimated ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                        {item.isAnimated ? (
                                            <>
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                </span>
                                                דינמי
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-palette text-[10px]"></i>
                                                סטטי
                                            </>
                                        )}
                                    </div>

                                    {/* Badge: Rarity */}
                                    <div className={`absolute top-4 right-4 px-4 py-1 rounded-full text-[10px] font-black border backdrop-blur-md ${getRarityStyles(item.rarity)}`}>
                                        {item.rarity.toUpperCase()}
                                    </div>

                                    {/* Try On Overlay */}
                                    <div className={`absolute inset-0 bg-dogame-primary/20 flex items-center justify-center transition-opacity duration-300 ${isBeingPreviewed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <div className="bg-white text-dogame-bg font-black px-6 py-2 rounded-full transform transition-transform">
                                            {isBeingPreviewed ? 'בתצוגה מקדימה' : isBorder ? 'נסה מסגרת' : 'נסה על המסך'}
                                        </div>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-black/20 text-right">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                                            <span className="text-yellow-400 font-black text-lg leading-none">{item.price.toLocaleString()}</span>
                                            <i className="fa-solid fa-coins text-xs text-yellow-400"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-xl italic uppercase tracking-tight">{item.name}</h4>
                                            <span className="text-dogame-muted text-xs font-bold">{isBorder ? 'Avatar Border' : item.category + ' Palette'}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => !owned && onPurchase(item)}
                                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 ${
                                            owned 
                                            ? 'bg-dogame-success/20 text-dogame-success border border-dogame-success/30 cursor-default'
                                            : userCoins >= item.price
                                            ? 'bg-white text-dogame-bg hover:bg-dogame-primary hover:text-white'
                                            : 'bg-white/5 text-dogame-muted cursor-not-allowed border border-white/10'
                                        }`}
                                        disabled={!owned && userCoins < item.price}
                                    >
                                        {owned ? (
                                            <>
                                                <span>כבר בבעלותך</span>
                                                <i className="fa-solid fa-circle-check text-sm"></i>
                                            </>
                                        ) : userCoins >= item.price ? (
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
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ShopView;
