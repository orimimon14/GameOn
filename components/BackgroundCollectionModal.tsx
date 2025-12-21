
import React from 'react';
import { BackgroundItem } from '../types';

interface BackgroundCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownedItems: BackgroundItem[];
    onEquip: (item: BackgroundItem) => void;
}

const BackgroundCollectionModal: React.FC<BackgroundCollectionModalProps> = ({ isOpen, onClose, ownedItems, onEquip }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-dogame-bg w-full max-w-4xl max-h-[80vh] relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl">
                         <i className="fa-solid fa-xmark"></i>
                    </button>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">האוסף שלי</h2>
                        <p className="text-dogame-muted text-sm font-bold">בחר רקע להצגה בפרופיל שלך</p>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {ownedItems.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                            <i className="fa-solid fa-store text-6xl mb-4"></i>
                            <h3 className="text-xl font-bold text-white uppercase italic">האוסף שלך ריק</h3>
                            <p className="text-sm">רכוש רקעים בחנות כדי לראות אותם כאן</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ownedItems.map((item) => (
                                <div key={item.id} className="group relative rounded-3xl overflow-hidden border-2 border-white/5 hover:border-dogame-primary transition-all duration-300 shadow-xl">
                                    <div className="aspect-video relative overflow-hidden">
                                        <img src={item.previewUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                        
                                        {/* Rarity Tag */}
                                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black bg-black/50 text-white border border-white/10 uppercase italic">
                                            {item.rarity}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-dogame-surface/50 text-right">
                                        <h4 className="text-white font-bold text-sm mb-3">{item.name}</h4>
                                        <button 
                                            onClick={() => onEquip(item)}
                                            className="w-full py-2 bg-dogame-primary text-white text-[10px] font-black uppercase rounded-xl hover:bg-dogame-primary/80 transition-colors shadow-glow"
                                        >
                                            החל רקע
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-black/20 border-t border-white/5 text-center shrink-0">
                    <p className="text-xs text-dogame-muted font-bold mb-4 italic uppercase">רוצה עוד רקעים?</p>
                    <button 
                        onClick={() => { onClose(); /* Navigation to shop is handled by parent if needed */ }} 
                        className="px-8 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
                    >
                        עבור לחנות
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackgroundCollectionModal;
