
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

    // Auto-select first match on desktop
    useEffect(() => {
        if (window.innerWidth > 768 && matches.length > 0 && !selectedMatchId) {
            setSelectedMatchId(matches[0].id);
        }
    }, [matches]);

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

    // Sidebar Component (Chat List)
    const Sidebar = () => (
        <div className={`flex-col h-full bg-dogame-surface border-l border-white/5 ${selectedMatchId ? 'hidden md:flex w-full md:w-96' : 'flex w-full'}`}>
             <div className="p-4 pt-20 border-b border-white/5 flex items-center gap-3">
                 <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white shadow-sm border border-white/5">
                    <i className="fa-solid fa-arrow-right text-lg"></i>
                 </button>
                 <h2 className="text-2xl font-bold text-white pr-2">הודעות</h2>
             </div>
             <div className="overflow-y-auto flex-1 p-2 space-y-1">
                 {matches.map(m => {
                     const lastMsg = conversations[m.id]?.[conversations[m.id].length-1];
                     return (
                         <button 
                            key={m.id} 
                            onClick={() => setSelectedMatchId(m.id)}
                            className={`w-full p-4 rounded-xl flex items-center gap-4 transition-colors ${selectedMatchId === m.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                         >
                             <div className="relative w-12 h-12 shrink-0">
                                 <img src={m.image} className="w-full h-full rounded-full object-cover" />
                                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dogame-surface"></div>
                             </div>
                             <div className="flex-1 text-right min-w-0">
                                 <div className="flex justify-between items-baseline mb-1">
                                     <span className="font-bold text-white text-base">{m.name}</span>
                                     <span className="text-xs text-dogame-muted">{lastMsg?.timestamp}</span>
                                 </div>
                                 <p className="text-sm text-dogame-muted truncate">{lastMsg?.text || 'התחל שיחה...'}</p>
                             </div>
                         </button>
                     )
                 })}
             </div>
        </div>
    );

    // Chat Window Component
    const ChatWindow = () => {
        if (!activeMatch) return <div className="hidden md:flex flex-1 items-center justify-center text-dogame-muted">בחר שיחה כדי להתחיל</div>;

        return (
            <div className={`flex-col flex-1 h-full bg-dogame-bg relative ${!selectedMatchId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-20 flex items-center px-4 border-b border-white/5 bg-dogame-surface sticky top-0 z-10 pt-4 shadow-sm shrink-0">
                    <button onClick={() => setSelectedMatchId(null)} className="md:hidden ml-4 text-dogame-text hover:bg-white/10 p-2 rounded-full"><i className="fa-solid fa-arrow-right"></i></button>
                    <div className="w-10 h-10 rounded-full overflow-hidden ml-3 border border-white/10 shrink-0">
                        <img src={activeMatch.image} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">{activeMatch.name}</h3>
                        <span className="text-xs text-green-400 font-medium">מחובר כעת</span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dogame-bg">
                    {(conversations[activeMatch.id] || []).map(msg => {
                        const isMe = msg.senderId === currentUserProfile.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-base shadow-sm ${
                                    isMe 
                                    ? 'bg-dogame-primary text-white rounded-tr-none' 
                                    : 'bg-dogame-surface text-gray-100 rounded-tl-none border border-white/5'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed" dir="auto">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>{msg.timestamp}</div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={endRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-dogame-surface border-t border-white/5 shrink-0">
                    <form onSubmit={e => {e.preventDefault(); handleSend()}} className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <input 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)} 
                                placeholder="כתוב הודעה..."
                                className="w-full bg-dogame-bg border border-white/10 rounded-2xl pl-4 pr-4 py-3 text-white focus:outline-none focus:border-dogame-primary transition-colors text-right"
                                dir="auto"
                                autoComplete="off"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                newMessage.trim() 
                                ? 'bg-dogame-primary text-white shadow-glow hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-dogame-muted'
                            }`}
                        >
                            <i className={`fa-solid fa-paper-plane text-lg ${newMessage.trim() ? '' : 'opacity-50'}`}></i>
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full pt-0 md:pt-16 pb-20 md:pb-6 max-w-6xl mx-auto">
            <ChatWindow />
            <Sidebar />
        </div>
    );
};

export default ChatView;
