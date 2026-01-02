
import React from 'react';
import { BackgroundItem } from '../types';

interface BackgroundCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownedItems: BackgroundItem[];
    onEquip: (item: BackgroundItem) => void;
    currentEquippedUrl?: string;
}

const BackgroundCollectionModal: React.FC<BackgroundCollectionModalProps> = ({ 
    isOpen, 
    onClose, 
    ownedItems, 
    onEquip,
    currentEquippedUrl
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-dogame-bg w-full max-w-4xl max-h-[80vh] relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl">
                         <i className="fa-solid fa-xmark"></i>
                    </button>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">האוסף שלי</h2>
                        <p className="text-dogame-muted text-sm font-bold">נהל את הרקעים והמסגרות שלך</p>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {ownedItems.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                            <i className="fa-solid fa-store text-6xl mb-4"></i>
                            <h3 className="text-xl font-bold text-white uppercase italic">האוסף שלך ריק</h3>
                            <p className="text-sm">רכוש פריטים בחנות כדי לראות אותם כאן</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ownedItems.map((item) => {
                                const isEquipped = currentEquippedUrl === item.previewUrl;
                                const isBorder = item.itemType === 'avatar-border';

                                return (
                                    <div key={item.id} className={`group relative rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-xl ${isEquipped ? 'border-dogame-primary' : 'border-white/5 hover:border-dogame-primary/50'}`}>
                                        <div className="aspect-video relative overflow-hidden cursor-pointer" onClick={() => onEquip(item)}>
                                            {isBorder ? (
                                                <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                                    <div className="relative w-16 h-16 p-1 rounded-full overflow-hidden">
                                                        <div 
                                                            style={{ background: item.previewUrl }} 
                                                            className={`absolute inset-0 ${item.isAnimated ? item.animationClass : ''}`}
                                                        />
                                                        <div className="relative z-10 w-full h-full rounded-full border-2 border-dogame-bg bg-dogame-surface"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    style={{ background: item.previewUrl }} 
                                                    className={`w-full h-full transition-transform group-hover:scale-110 ${item.isAnimated ? item.animationClass : ''}`}
                                                />
                                            )}
                                            
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                            
                                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black bg-black/50 text-white border border-white/10 uppercase italic">
                                                {item.rarity}
                                            </div>

                                            {isEquipped && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-dogame-primary/20 backdrop-blur-[2px]">
                                                    <div className="bg-dogame-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-glow">
                                                        מיושם
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 bg-dogame-surface/50 text-right">
                                            <h4 className="text-white font-bold text-sm mb-1">{item.name}</h4>
                                            <p className="text-[9px] text-dogame-muted uppercase mb-3">{isBorder ? 'Avatar Border' : 'Background'}</p>
                                            <button 
                                                onClick={() => onEquip(item)}
                                                disabled={isEquipped}
                                                className={`w-full py-2 text-[10px] font-black uppercase rounded-xl transition-colors ${
                                                    isEquipped 
                                                    ? 'bg-white/5 text-dogame-muted border border-white/10' 
                                                    : 'bg-dogame-primary text-white hover:bg-dogame-primary/80 shadow-glow'
                                                }`}
                                            >
                                                {isEquipped ? 'מיושם' : 'החל פריט'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-black/20 border-t border-white/5 text-center shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
                    >
                        חזור לחנות
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackgroundCollectionModal;
