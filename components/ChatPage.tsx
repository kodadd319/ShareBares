
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { 
  Plus, Send, MessageSquare, Search, MoreVertical, 
  Phone, Video, Info, Smile, Image as ImageIcon,
  Check, CheckCheck, Clock, ArrowLeft
} from 'lucide-react';

interface ChatPageProps {
  me: User;
  users: User[];
  chatMessages: Record<string, Message[]>;
  selectedUserId: string | null;
  notifications: string[];
  onSelectUser: (userId: string | null) => void;
  onSendMessage: (text: string) => void;
  onStartCall: (userId: string, type: 'voice' | 'video') => void;
  isTyping?: boolean;
  onExit?: () => void;
  onProfileClick?: (userId: string) => void;
  onDeleteConversation?: (userId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ 
  me, 
  users, 
  chatMessages, 
  selectedUserId, 
  notifications,
  onSelectUser, 
  onSendMessage,
  onStartCall,
  isTyping,
  onExit,
  onProfileClick,
  onDeleteConversation
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [longPressedUserId, setLongPressedUserId] = useState<string | null>(null);
  const timerRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (userId: string) => {
    timerRef.current = setTimeout(() => {
      setLongPressedUserId(userId);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseDown = (userId: string) => {
    timerRef.current = setTimeout(() => {
      setLongPressedUserId(userId);
    }, 600);
  };

  const handleMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  const activeMessages = selectedUserId ? chatMessages[selectedUserId] || [] : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUserId, activeMessages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  const filteredUsers = users.filter(u => 
    u.id !== me.id && 
    (searchQuery.length > 0 || chatMessages[u.id] || u.id === selectedUserId) &&
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Top Banner */}
      <div className="w-full flex justify-center py-6 px-4 shrink-0">
        <a href="https://t.aenhance.link/408699/7106/0?aff_sub=Main+page+top+bamner&aff_sub2=Chat+page+top+banner&source=sharebares&file_id=438055&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noopener noreferrer" className="block hover:scale-[1.02] transition-transform">
          <img 
            src="https://www.imglnkx.com/7106/009227A_EXTZ_18_ALL_EN_71_L.jpg" 
            width="300" 
            height="250" 
            className="rounded-2xl shadow-2xl border border-white/10" 
            alt="Promotional Banner" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/chat_banner_fallback/300/250';
            }}
          />
        </a>
      </div>

      <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex bg-black/40 md:rounded-[2.5rem] overflow-hidden glass-panel border-[#c0c0c0]/10 md:m-4 chrome-border shadow-2xl relative shrink-0">
      {/* Sidebar - Hidden on mobile if a user is selected */}
      <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-white/5 flex-col min-w-[320px] bg-black/20`}>
        <div className="p-6 border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onExit}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-tighter chrome-text">Messages</h2>
            </div>
            <button 
              onClick={() => searchInputRef.current?.focus()}
              className="p-2 bg-[#967bb6]/10 text-[#967bb6] rounded-xl hover:bg-[#967bb6]/20 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#967bb6] transition-colors" size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#967bb6] transition-all text-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-1 p-2 scrollbar-hide">
          {filteredUsers.map(user => {
            const lastMsg = chatMessages[user.id]?.[chatMessages[user.id].length - 1];
            const isActive = selectedUserId === user.id;
            const hasUnread = notifications.includes(user.id);
            
            return (
              <div 
                key={user.id} 
                onClick={() => !longPressedUserId && onSelectUser(user.id)}
                onMouseDown={() => handleMouseDown(user.id)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleTouchStart(user.id)}
                onTouchEnd={handleTouchEnd}
                className={`flex items-center space-x-4 p-4 rounded-[2rem] cursor-pointer transition-all group relative ${
                  isActive ? 'bg-[#967bb6]/10 border border-[#967bb6]/20' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                {longPressedUserId === user.id && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 rounded-[2rem] flex items-center justify-center animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation?.(user.id);
                          setLongPressedUserId(null);
                        }}
                        className="bg-red-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLongPressedUserId(null);
                        }}
                        className="bg-white/10 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="relative shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); onProfileClick?.(user.id); }}>
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-[#967bb6]' : 'border-white/10 group-hover:border-white/30'}`}>
                    <img 
                      src={user.avatar} 
                      className="w-full h-full object-cover" 
                      alt="" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${user.id}/100`;
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-black"></div>
                  {hasUnread && !isActive && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#967bb6] rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-black uppercase tracking-tighter text-sm truncate ${isActive ? 'text-[#967bb6]' : 'text-slate-200 group-hover:text-[#967bb6]'}`}>
                      {user.displayName}
                    </span>
                    <span className={`text-[10px] font-bold ${hasUnread && !isActive ? 'text-[#967bb6]' : 'text-slate-500'}`}>
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${isActive ? 'text-slate-300' : hasUnread ? 'text-slate-100 font-bold' : 'text-slate-500'}`}>
                      {lastMsg ? lastMsg.text : 'Start a conversation...'}
                    </p>
                    {(isActive || hasUnread) && <div className="w-2 h-2 bg-[#967bb6] rounded-full shadow-[0_0_8px_#967bb6]"></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area - Hidden on mobile if no user is selected */}
      <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-grow flex-col bg-gradient-to-b from-black/40 to-black/60`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 px-4 md:px-8 border-b border-white/5 flex items-center justify-between z-20 bg-black/40 backdrop-blur-xl sticky top-0">
              <div className="flex items-center space-x-4">
                {/* Back button for mobile/navigation */}
                <button 
                  onClick={() => onSelectUser(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all md:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="relative cursor-pointer" onClick={() => onProfileClick?.(selectedUser.id)}>
                  <img 
                    src={selectedUser.avatar} 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border border-[#967bb6]/30 shadow-lg" 
                    alt="" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedUser.id}/100`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                </div>
                <div className="cursor-pointer" onClick={() => onProfileClick?.(selectedUser.id)}>
                  <h3 className="font-black text-white hover:text-[#967bb6] transition-colors uppercase tracking-widest text-xs md:text-sm">{selectedUser.displayName}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] md:text-[10px] text-[#967bb6] font-black uppercase tracking-[0.2em]">Active Now</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 md:space-x-2">
                <button 
                  onClick={() => selectedUserId && onStartCall(selectedUserId, 'voice')}
                  className="p-2 md:p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <Phone size={20} />
                </button>
                <button 
                  onClick={() => selectedUserId && onStartCall(selectedUserId, 'video')}
                  className="p-2 md:p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <Video size={20} />
                </button>
                <button className="p-2 md:p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all hidden sm:block"><Info size={20} /></button>
                <button className="p-2 md:p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><MoreVertical size={20} /></button>
              </div>
            </div>
            
            {/* Messages List */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
              <div className="flex justify-center mb-8">
                <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Today</span>
                </div>
              </div>
              
              {activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === me.id;
                const showAvatar = idx === 0 || activeMessages[idx-1].senderId !== msg.senderId;
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                    {!isMe && (
                      <div className="w-8 h-8 shrink-0 mb-1 cursor-pointer" onClick={() => onProfileClick?.(selectedUser.id)}>
                        {showAvatar ? (
                          <img 
                            src={selectedUser.avatar} 
                            className="w-full h-full rounded-lg object-cover border border-white/10" 
                            alt="" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedUser.id}/100`;
                            }}
                          />
                        ) : <div className="w-8" />}
                      </div>
                    )}
                    
                    <div className={`group relative max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] shadow-xl break-words overflow-hidden ${
                        isMe 
                          ? 'bg-gradient-to-br from-[#967bb6] to-[#6b46c1] text-white rounded-br-none chrome-border' 
                          : 'bg-white/5 text-slate-100 border border-white/10 rounded-bl-none'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      
                      <div className={`flex items-center mt-1.5 space-x-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.isRead ? (
                            <CheckCheck size={12} className="text-[#967bb6]" />
                          ) : (
                            <Check size={12} className="text-slate-500" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start items-end space-x-2">
                  <div className="w-8 h-8 shrink-0 mb-1">
                    <img 
                      src={selectedUser.avatar} 
                      className="w-full h-full rounded-lg object-cover border border-white/10" 
                      alt="" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedUser.id}/100`;
                      }}
                    />
                  </div>
                  <div className="bg-white/5 p-4 rounded-[2rem] rounded-bl-none border border-white/10 flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-[#967bb6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#967bb6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#967bb6] rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 md:p-8 pt-0 sticky bottom-0 bg-black/40 backdrop-blur-xl z-20">
              <div className="relative glass-panel rounded-[2rem] p-1 md:p-2 border-[#c0c0c0]/10 chrome-border flex items-center space-x-1 md:space-x-2 shadow-2xl">
                <div className="flex items-center px-1 md:px-2 space-x-1">
                  <button className="p-2 md:p-3 text-slate-500 hover:text-[#967bb6] transition-all"><ImageIcon size={20} /></button>
                  <button className="p-2 md:p-3 text-slate-500 hover:text-[#967bb6] transition-all hidden sm:block"><Smile size={20} /></button>
                </div>
                
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${selectedUser.displayName}...`} 
                  className="flex-grow bg-transparent border-none focus:ring-0 text-slate-200 placeholder:text-slate-600 text-sm py-3 md:py-4"
                />
                
                <button 
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="p-3 md:p-4 bg-gradient-to-tr from-[#967bb6] to-[#6b46c1] rounded-2xl text-white hover:brightness-110 transition-all shadow-xl shadow-[#967bb6]/30 disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#967bb6]/20 to-transparent rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mb-8 border border-[#967bb6]/10">
              <MessageSquare size={64} className="text-[#967bb6] opacity-50" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black chrome-text uppercase tracking-tighter mb-4">Your Private Space</h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              Connect with creators privately. Send messages, share media, and build deeper connections in a secure environment.
            </p>
            
            <div className="mt-12 w-full max-w-md rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl hover:border-[#967bb6]/50 transition-all chrome-border bg-black/40">
              <a href="https://t.ajrkmx1.com/408699/8780/32516?bo=2779,2778,2777,2776,2775&file_id=616518&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noopener noreferrer" className="block w-full">
                <img 
                  src="https://www.imglnkx.com/8780/JM-645_DESIGN-22450_WETTSHIRT2_640360.jpg" 
                  className="w-full h-auto object-cover" 
                  alt="Featured Content"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/chat_empty_fallback/640/360';
                  }}
                />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              <button 
                onClick={() => searchInputRef.current?.focus()}
                className="px-8 py-3 bg-gradient-to-tr from-[#967bb6] to-[#6b46c1] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-[#967bb6]/20"
              >
                Start a New Chat
              </button>
              <button 
                onClick={onExit}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/10"
              >
                Back to Feed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default ChatPage;
