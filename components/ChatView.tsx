
import React, { useState, useRef, useEffect } from 'react';
import { GamerProfile, Message } from '../types';
import { mockConversations, currentUserProfile } from '../constants';

interface ChatViewProps {
    matches: GamerProfile[];
    onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ matches, onBack }) => {
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [conversations, setConversations] = useState(mockConversations);
    const [newMessage, setNewMessage] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations, selectedMatchId]);

    const handleSend = () => {
        if (!newMessage.trim() || !selectedMatchId) return;
        const msg: Message = {
            id: Date.now(),
            text: newMessage,
            senderId: currentUserProfile.id,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setConversations(prev => ({
            ...prev,
            [selectedMatchId]: [...(prev[selectedMatchId] || []), msg]
        }));
        setNewMessage('');
    };

    const activeMatch = matches.find(m => m.id === selectedMatchId);

    return (
        <div className="flex h-full w-full bg-transparent relative z-10">
            {/* Chat Window (Hidden on mobile if no match selected) */}
            <div className={`flex-1 flex flex-col h-full dark:bg-dogame-bg/40 bg-white/40 backdrop-blur-md border-l dark:border-white/5 border-gray-200 transition-all ${!selectedMatchId ? 'hidden md:flex' : 'flex'}`}>
                {activeMatch ? (
                    <>
                        {/* Header */}
                        <div className="h-20 flex items-center px-6 border-b dark:border-white/5 border-gray-200 shrink-0">
                            <button onClick={() => setSelectedMatchId(null)} className="md:hidden ml-4 dark:text-white text-dogame-lightText">
                                <i className="fa-solid fa-arrow-right text-xl"></i>
                            </button>
                            <div className="flex items-center gap-4 text-right flex-1">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-dogame-primary shadow-glow">
                                    <img src={activeMatch.image} className="w-full h-full object-cover" alt={activeMatch.name} />
                                </div>
                                <div>
                                    <h3 className="font-bold dark:text-white text-dogame-lightText text-lg">{activeMatch.name}</h3>
                                    <span className="text-xs text-green-500 font-bold">מחובר כעת</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {(conversations[activeMatch.id] || []).map(msg => {
                                const isMe = msg.senderId === currentUserProfile.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-lg ${
                                            isMe 
                                            ? 'bg-dogame-primary text-white rounded-tr-none' 
                                            : 'dark:bg-dogame-surface/80 bg-white text-dogame-lightText rounded-tl-none border dark:border-white/5 border-gray-100'
                                        }`}>
                                            <p className="text-base leading-relaxed text-right">{msg.text}</p>
                                            <div className="text-[10px] mt-1 opacity-60 text-left">{msg.timestamp}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={endRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t dark:border-white/5 border-gray-200 bg-transparent shrink-0">
                            <form onSubmit={e => {e.preventDefault(); handleSend()}} className="flex gap-3">
                                <input 
                                    value={newMessage} 
                                    onChange={e => setNewMessage(e.target.value)} 
                                    placeholder="כתוב הודעה..."
                                    className="flex-1 dark:bg-black/20 bg-white/50 border dark:border-white/10 border-gray-200 rounded-2xl px-5 py-3 dark:text-white text-dogame-lightText focus:outline-none focus:border-dogame-primary transition-all text-right shadow-inner"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                        newMessage.trim() ? 'bg-dogame-primary text-white shadow-glow' : 'bg-gray-400/20 text-gray-400'
                                    }`}
                                >
                                    <i className="fa-solid fa-paper-plane text-lg"></i>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                        <i className="fa-solid fa-comments text-7xl mb-6"></i>
                        <h3 className="text-2xl font-bold">בחר שיחה כדי להתחיל</h3>
                    </div>
                )}
            </div>

            {/* Sidebar (List of matches) */}
            <div className={`w-full md:w-96 flex flex-col h-full dark:bg-dogame-surface/20 bg-white/20 backdrop-blur-md ${selectedMatchId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 h-20 border-b dark:border-white/5 border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-black italic uppercase dark:text-white text-dogame-lightText">הודעות</h2>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-dogame-primary/20 flex items-center justify-center">
                            <i className="fa-solid fa-filter text-xs text-dogame-primary"></i>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                    {matches.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p>אין עדיין התאמות...</p>
                        </div>
                    ) : (
                        matches.map(m => {
                            const lastMsg = conversations[m.id]?.[conversations[m.id].length-1];
                            return (
                                <button 
                                    key={m.id} 
                                    onClick={() => setSelectedMatchId(m.id)}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedMatchId === m.id ? 'bg-dogame-primary text-white shadow-lg' : 'hover:bg-white/10 dark:text-white text-dogame-lightText'}`}
                                >
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                                        <img src={m.image} className="w-full h-full object-cover" alt={m.name} />
                                    </div>
                                    <div className="flex-1 text-right min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold truncate text-base">{m.name}</span>
                                            <span className={`text-[10px] ${selectedMatchId === m.id ? 'text-white/70' : 'text-dogame-muted'}`}>{lastMsg?.timestamp || 'חדש'}</span>
                                        </div>
                                        <p className={`text-sm truncate ${selectedMatchId === m.id ? 'text-white/80' : 'text-dogame-muted'}`}>
                                            {lastMsg?.text || 'התחילו לדבר עכשיו!'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatView;
