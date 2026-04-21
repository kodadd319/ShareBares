
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Dices, Users, User as UserIcon, Bot, Play, CheckCircle2, 
  X, ChevronLeft, Trophy, MessageSquare, Send,
  Circle, Square, Layers, Spade, Club, Heart, Diamond,
  Target, Zap, Flame, Sparkles, Info, Plus,
  ArrowRight, History, RotateCcw, Eye, EyeOff,
  HelpCircle, LayoutGrid, Check, MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import TenThousandGame from './TenThousandGame';
import { User, GameType, GameState, GameInvite } from '../types';
import { Socket } from 'socket.io-client';
import { APP_LOGO_URL } from '../constants';
import { calculateRummyScore, getRankValue } from '../games';

interface GameRoomProps {
  user: User;
  socket: Socket | null;
  users: User[];
  setActiveTab: (tab: string) => void;
}

const JadeCommentary = ({ game, user }: { game: any, user: any }) => {
  const [comment, setComment] = useState<string | null>(null);
  const lastTurnRef = useRef(game.turn);

  useEffect(() => {
    if (game.turn !== lastTurnRef.current) {
      lastTurnRef.current = game.turn;
      // Random chance to show a comment
      if (Math.random() > 0.7) {
        const comments = [
          "Ooh, that was a bold move, darling.",
          "Are you trying to impress me? It's working.",
          "I've seen better, but you've got potential.",
          "Careful now, don't want to lose your shirt.",
          "This is getting interesting...",
          "I'm rooting for you, don't let me down.",
          "Smooth. Very smooth.",
          "Is that your best? I hope not.",
          "The tension in here is delicious.",
          "You play like a man who knows what he wants.",
          "I love a good strategist. Keep it up.",
          "Don't get too cocky, the night is young.",
          "I'm watching your every move. No pressure.",
          "You've got a certain... flair. I like it.",
          "I've got my eye on you. Don't disappoint me.",
          "That was... unexpected. I like surprises."
        ];
        setComment(comments[Math.floor(Math.random() * comments.length)]);
        setTimeout(() => setComment(null), 5000);
      }
    }
  }, [game.turn]);

  if (!comment) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-24 left-8 z-50 max-w-xs"
    >
      <div className="bg-black/80 backdrop-blur-xl border border-[#967bb6]/30 p-4 rounded-2xl shadow-2xl relative">
        <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[#967bb6] flex items-center justify-center border border-white/20">
          <Logo className="w-5 h-5" />
        </div>
        <p className="text-[11px] font-bold text-white italic leading-relaxed">
          "{comment}"
        </p>
        <p className="text-[9px] font-black text-[#967bb6] uppercase tracking-widest mt-2">
          — Jade Vixen
        </p>
      </div>
    </motion.div>
  );
};

const GameRoom: React.FC<GameRoomProps> = ({ user, socket, users, setActiveTab }) => {
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [zoom, setZoom] = useState(1);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isWaitingForInvite, setIsWaitingForInvite] = useState<{ toId: string, gameType: GameType } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = distance / lastTouchDistance;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 4));
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('game:invite_received', (invite: GameInvite) => {
      setInvites(prev => [...prev, invite]);
    });

    socket.on('game:invite_declined', (data: { inviteId: string, toId: string }) => {
      if (isWaitingForInvite?.toId === data.toId) {
        setIsWaitingForInvite(null);
      }
      setInvites(prev => prev.filter(i => i.id !== data.inviteId));
    });

    socket.on('game:started', (game: GameState) => {
      setActiveGame(game);
      setShowInviteModal(false);
    });

    socket.on('game:updated', (game: GameState) => {
      setActiveGame(game);
    });

    socket.on('game:message', (message: any) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('game:ended', (data: { gameId: string, winner: string }) => {
      if (activeGame?.id === data.gameId) {
        setActiveGame(prev => prev ? { ...prev, status: 'finished', winner: data.winner } : null);
      }
    });

    return () => {
      socket.off('game:invite_received');
      socket.off('game:invite_declined');
      socket.off('game:started');
      socket.off('game:updated');
      socket.off('game:ended');
    };
  }, [socket, activeGame]);

  const sendInvite = (receiverId: string, gameType: GameType) => {
    if (!socket) return;
    socket.emit('game:invite_send', { 
      from: { id: user.id, displayName: user.displayName, avatar: user.avatar }, 
      toId: receiverId, 
      gameType 
    });
    setIsWaitingForInvite({ toId: receiverId, gameType });
    setShowInviteModal(false);
  };

  const acceptInvite = (invite: GameInvite) => {
    if (!socket) return;
    socket.emit('game:invite_accept', { inviteId: invite.id, user: { id: user.id, displayName: user.displayName, avatar: user.avatar } });
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  };

  const declineInvite = (invite: GameInvite) => {
    if (!socket) return;
    socket.emit('game:invite_decline', { inviteId: invite.id, toId: user.id });
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  };

  const playWithBot = (gameType: GameType) => {
    if (!socket) return;
    socket.emit('game:bot_start', { gameType, user: { id: user.id, displayName: user.displayName, avatar: user.avatar } });
    setShowInviteModal(false);
  };

  const setReady = () => {
    if (!socket || !activeGame) return;
    socket.emit('game:ready', { gameId: activeGame.id });
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !activeGame || !chatInput.trim()) return;
    socket.emit('game:message', { 
      gameId: activeGame.id, 
      userId: user.id, 
      text: chatInput.trim(),
      displayName: user.displayName
    });
    setChatInput('');
  };

  const makeMove = (move: any) => {
    if (!socket || !activeGame) return;
    socket.emit('game:move', { gameId: activeGame.id, userId: user.id, move });
  };

  const quitGame = () => {
    if (!socket || !activeGame) return;
    socket.emit('game:quit', { gameId: activeGame.id });
    setActiveGame(null);
  };

  const renderGameSelection = () => (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 flex justify-center">
        <a href="https://t.amyfc.link/408699/779/18234?aff_sub=Top+banner+%22the+game+room+page&aff_sub2=Top+banner+%22settings+page%22&bo=2779,2778,2777,2776,2775&source=sharebares&file_id=415548&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noreferrer">
          <img 
            src="https://www.imglnkx.com/779/006611AX_FCAM_18_ALL_EN_71_L.jpg" 
            width="300" 
            height="250" 
            style={{ border: 0 }} 
            referrerPolicy="no-referrer"
            alt="Banner"
            className="rounded-2xl shadow-2xl border border-white/10"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== APP_LOGO_URL) {
                target.src = APP_LOGO_URL;
              }
            }}
          />
        </a>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text">The Game Room</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Choose your game, choose your partner, enjoy the stakes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'checkers', label: 'Checkers', icon: Square, color: 'from-red-500/20 to-black', desc: 'Jump and capture. Winner takes all.' },
          { id: '10000', label: '10,000', icon: Dices, color: 'from-amber-500/20 to-black', desc: 'Roll the dice. Push your luck.' },
          { id: 'blackjack', label: 'Blackjack', icon: Spade, color: 'from-emerald-500/20 to-black', desc: 'Get to 21. Don\'t bust.' },
          { id: 'billiards', label: 'Billiards', icon: Target, color: 'from-purple-500/20 to-black', desc: 'Sink the balls. Master the angles.' },
          { id: 'rummy', label: 'Rummy', icon: Layers, color: 'from-blue-500/20 to-black', desc: 'Form sets and runs. Knock to win.' }
        ].map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative group h-64 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br ${game.color} p-8 text-left transition-all hover:border-[#967bb6]/50 shadow-2xl`}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <game.icon size={120} />
            </div>
            
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-[#967bb6]/20 transition-colors">
                  <game.icon className="text-[#967bb6]" size={24} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{game.label}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{game.desc}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setSelectedGameType(game.id as GameType);
                    setShowInviteModal(true);
                  }}
                  className="px-4 py-2 bg-[#967bb6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#967bb6]/80 transition-all shadow-lg shadow-[#967bb6]/20 flex items-center space-x-2"
                >
                  <Plus size={14} />
                  <span>Invite</span>
                </button>
                <button
                  onClick={() => playWithBot(game.id as GameType)}
                  className="px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/10"
                >
                  Vs BareBear
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl hover:border-[#967bb6]/50 transition-all chrome-border bg-black/40 mt-12">
        <a href="https://t.ajrkmx1.com/408699/8780/32516?bo=2779,2778,2777,2776,2775&file_id=616518&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002" target="_blank" rel="noopener noreferrer" className="block w-full">
          <img 
            src="https://www.imglnkx.com/8780/JM-645_DESIGN-22450_WETTSHIRT2_640360.jpg" 
            className="w-full h-auto object-cover" 
            alt="Featured Content"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== APP_LOGO_URL) {
                target.src = APP_LOGO_URL;
              }
            }}
          />
        </a>
      </div>

      {invites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Pending Invites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invites.map(invite => (
              <div key={invite.id} className="glass-panel rounded-2xl p-4 border-[#967bb6]/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#967bb6]/20 flex items-center justify-center">
                    <UserIcon className="text-[#967bb6]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{invite.from.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Invited you to {invite.gameType}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => acceptInvite(invite)}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => declineInvite(invite)}
                    className="px-3 py-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Don't Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInviteModal = () => {
    const friends = users.filter(u => user.friendIds?.includes(u.id));
    const otherUsers = users.filter(u => u.id !== user.id && !user.friendIds?.includes(u.id));

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel rounded-[2.5rem] p-8 border-[#c0c0c0]/20 shadow-2xl chrome-border"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase chrome-text">Invite Friend</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">To play {selectedGameType}</p>
            </div>
            <button onClick={() => setShowInviteModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {friends.length > 0 ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest px-2">Your Friends</p>
                {friends.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => sendInvite(u.id, selectedGameType!)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#967bb6]/10 to-transparent border border-[#967bb6]/20 hover:border-[#967bb6] transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <img 
                        src={u.avatar || APP_LOGO_URL} 
                        className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform" 
                        alt="" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== APP_LOGO_URL) {
                            target.src = APP_LOGO_URL;
                          }
                        }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-black text-white uppercase tracking-tight">{u.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{u.username}</p>
                      </div>
                    </div>
                    <Send size={20} className="text-[#967bb6] opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Users size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No friends found</p>
                <p className="text-[10px] text-slate-600 mt-1">Add friends to invite them to games!</p>
              </div>
            )}

            {otherUsers.length > 0 && (
              <div className="space-y-4 mt-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Other Online Users</p>
                {otherUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => sendInvite(u.id, selectedGameType!)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <img 
                        src={u.avatar || APP_LOGO_URL} 
                        className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform" 
                        alt="" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== APP_LOGO_URL) {
                            target.src = APP_LOGO_URL;
                          }
                        }}
                      />
                      <div className="text-left">
                        <p className="text-sm font-black text-white uppercase tracking-tight">{u.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{u.username}</p>
                      </div>
                    </div>
                    <Plus size={20} className="text-slate-500 group-hover:text-[#967bb6] transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const [showRules, setShowRules] = useState(false);

  const getRules = (type: GameType) => {
    switch (type) {
      case 'checkers': return "Move diagonally forward. Jump opponent pieces to capture. Reach the other side to become a King and move backwards.";
      case '10000': return "Roll 6 dice. 1s=100, 5s=50. Three of a kind = 100 * value (1s=1000). If no scoring dice, you Farkle and lose your turn points. First to 10,000 wins.";
      case 'blackjack': return "Get closer to 21 than the dealer without going over. Aces are 1 or 11. Face cards are 10. Dealer hits until 17.";
      case 'billiards': return "8-Ball Rules: First pot determines Solids or Stripes. Sink all your balls, then the 8-ball to win. Potting the 8-ball early is a loss.";
      case 'rummy': return "Gin Rummy Rules: Draw a card from the stock or discard pile. Discard a card to end your turn. Form sets (3-4 of a kind) or runs (3+ in sequence). Knock when your unmatched cards (deadwood) total 10 or less. Gin is 0 deadwood.";
      default: return "";
    }
  };

  const renderGameUI = () => {
    if (!activeGame) return null;

    const isMyTurn = activeGame.turn === user.id;
    const opponent = activeGame.players.find(p => p.id !== user.id);
    const me = activeGame.players.find(p => p.id === user.id);

    return (
      <div className="max-w-7xl mx-auto p-2 lg:p-4 min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
          <button 
            onClick={quitGame}
            className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors font-black uppercase tracking-widest text-[12px] group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="border-b-2 border-transparent group-hover:border-red-400">Quit Game</span>
          </button>
          
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => {
                setSelectedGameType(activeGame.type);
                setShowInviteModal(true);
              }}
              className="px-4 py-2 bg-[#967bb6]/20 text-[#967bb6] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#967bb6] hover:text-white transition-all border border-[#967bb6]/30 flex items-center space-x-2"
            >
              <Plus size={14} />
              <span>Invite</span>
            </button>

            <div className={`flex flex-col items-center space-y-2 ${activeGame.turn === me?.id ? 'scale-110' : 'opacity-50'}`}>
              <div className={`w-12 h-12 rounded-2xl border-2 p-0.5 transition-all ${activeGame.turn === me?.id ? 'border-[#967bb6] shadow-[0_0_15px_rgba(150,123,182,0.5)]' : 'border-transparent'}`}>
                <img 
                  src={me?.avatar || APP_LOGO_URL} 
                  className="w-full h-full rounded-xl object-cover" 
                  alt="" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== APP_LOGO_URL) {
                      target.src = APP_LOGO_URL;
                    }
                  }}
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">You</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-[10px] font-black text-[#967bb6] uppercase tracking-[0.3em]">VS</span>
              </div>
            </div>

            <div className={`flex flex-col items-center space-y-2 ${activeGame.turn === opponent?.id ? 'scale-110' : 'opacity-50'}`}>
              <div className={`w-12 h-12 rounded-2xl border-2 p-0.5 transition-all ${activeGame.turn === opponent?.id ? 'border-[#967bb6] shadow-[0_0_15px_rgba(150,123,182,0.5)]' : 'border-transparent'}`}>
                <img 
                  src={opponent?.avatar || APP_LOGO_URL} 
                  className="w-full h-full rounded-xl object-cover" 
                  alt="" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== APP_LOGO_URL) {
                      target.src = APP_LOGO_URL;
                    }
                  }}
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">{opponent?.displayName}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowRules(true)}
            className="flex items-center space-x-2 text-[#967bb6] hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]"
          >
            <Info size={18} />
            <span>Rules</span>
          </button>
        </div>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowRules(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel p-8 rounded-[2rem] max-w-md w-full border-[#967bb6]/20 relative"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowRules(false)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Game Rules</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {getRules(activeGame.type)}
                </p>
                <button 
                  onClick={() => setShowRules(false)}
                  className="w-full mt-8 py-4 bg-[#967bb6] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#967bb6]/20"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="flex-grow flex items-center justify-center relative">
          <JadeCommentary game={activeGame} user={user} />
          
          {/* Chat Toggle */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`absolute bottom-4 right-4 z-[110] p-4 rounded-2xl transition-all shadow-2xl flex items-center space-x-2 ${showChat ? 'bg-[#967bb6] text-white' : 'bg-black/60 text-[#967bb6] border border-white/10 hover:bg-white/5'}`}
          >
            <MessageSquare size={24} />
            {messages.length > 0 && !showChat && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black">
                {messages.length}
              </span>
            )}
          </button>

          {/* Chat Panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="absolute bottom-20 right-4 z-[100] w-80 h-[400px] glass-panel flex flex-col overflow-hidden border-[#967bb6]/30 shadow-2xl bg-black/90 backdrop-blur-2xl rounded-3xl"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                    <MessageSquare size={14} className="mr-2 text-[#967bb6]" />
                    Game Chat
                  </h3>
                  <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                      <MessageSquare size={32} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{msg.displayName}</span>
                        <div className={`px-3 py-2 rounded-2xl text-xs font-medium max-w-[80%] ${msg.userId === user.id ? 'bg-[#967bb6] text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={sendChatMessage} className="p-4 border-t border-white/10 bg-white/5 flex space-x-2">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#967bb6]/50 transition-all"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-[#967bb6] text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#967bb6]/20"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {activeGame.status === 'waiting' ? (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-[#967bb6]/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative w-32 h-32 bg-black rounded-[2.5rem] border-2 border-[#967bb6] flex items-center justify-center mx-auto chrome-border">
                  <Play size={48} className="text-[#967bb6] animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase chrome-text">Waiting for Players</h2>
                <div className="flex items-center justify-center space-x-4">
                  {activeGame.players.map(p => (
                    <div key={p.id} className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${p.isReady ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                        {p.isReady ? <CheckCircle2 className="text-emerald-500" size={24} /> : <Circle className="text-slate-700" size={24} />}
                      </div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{p.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!me?.isReady && (
                <button 
                  onClick={setReady}
                  className="px-12 py-4 bg-gradient-to-r from-[#967bb6] to-[#6b46c1] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#967bb6]/30 hover:scale-105 active:scale-95 transition-all chrome-border"
                >
                  Ready to Play
                </button>
              )}
            </div>
          ) : (activeGame.status === 'finished' && activeGame.type !== 'blackjack') ? (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
                <Trophy size={120} className="text-amber-500 mx-auto relative drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase chrome-text">Game Over</h2>
                <p className="text-xl font-black text-[#967bb6] uppercase tracking-widest">
                  {activeGame.winner === user.id ? 'You are the Master!' : `${opponent?.displayName} Won!`}
                </p>
              </div>

              <button 
                onClick={() => setActiveGame(null)}
                className="px-12 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
              >
                Back to Lobby
              </button>
            </div>
          ) : (
            <div 
              className="w-full flex-grow relative overflow-hidden p-2 lg:p-4 select-none touch-none min-h-[600px] lg:min-h-[800px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 4));
                  }
                }}
                style={{ 
                  transform: `scale(${zoom})`,
                  touchAction: 'none',
                  WebkitOverflowScrolling: 'touch',
                  userSelect: 'none'
                }}
              >
                <div className="w-full h-full flex flex-col items-center bg-black/20 rounded-[1.5rem] lg:rounded-[2.5rem] border border-white/5 shadow-2xl overflow-y-auto custom-scrollbar p-4">
                  {/* Game Specific Rendering */}
                  <div className="w-full max-w-6xl">
                    {activeGame.type === 'checkers' && <CheckersGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
                    {activeGame.type === '10000' && <TenThousandGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
                    {activeGame.type === 'blackjack' && <BlackjackGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
                    {activeGame.type === 'billiards' && <BilliardsGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} socket={socket} />}
                    {activeGame.type === 'rummy' && <RummyGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game Footer / Controls */}
        {activeGame.status === 'playing' && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-xl border transition-all ${isMyTurn ? 'bg-[#967bb6]/20 border-[#967bb6] text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                <span className="text-xs font-black uppercase tracking-widest">{isMyTurn ? 'Your Turn' : "Opponent's Turn"}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Themed visuals indicator removed as per user request */}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      {isWaitingForInvite && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#967bb6]/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-black rounded-3xl border-2 border-[#967bb6] flex items-center justify-center mx-auto chrome-border">
                <Users size={40} className="text-[#967bb6] animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Waiting for Response</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                Invited {users.find(u => u.id === isWaitingForInvite.toId)?.displayName} to {isWaitingForInvite.gameType}
              </p>
            </div>
            <button 
              onClick={() => setIsWaitingForInvite(null)}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
            >
              Cancel Invite
            </button>
          </div>
        </div>
      )}
      {activeGame ? renderGameUI() : renderGameSelection()}
      {showInviteModal && renderInviteModal()}
    </div>
  );
};

// --- Game Specific Components ---

const CheckersGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const board = game.data.board || [];
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const myColor = game.players[0].id === myId ? 1 : 2;

  // Helper to get valid moves for the selected piece
  const getValidMovesForPiece = (r: number, c: number) => {
    const piece = board[r][c];
    if (!piece || Math.floor(piece) !== myColor) return [];

    const moves: [number, number][] = [];
    const jumps: [number, number][] = [];

    // Check if ANY jump is available for the player (forced jump rule)
    const playerHasJumps = () => {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const p = board[row][col];
          if (Math.floor(p) !== myColor) continue;
          const isK = p > 2;
          const dirs = [];
          if (myColor === 1 || isK) dirs.push([-1, -1], [-1, 1]);
          if (myColor === 2 || isK) dirs.push([1, -1], [1, 1]);
          for (const [dr, dc] of dirs) {
            const jr = row + dr * 2;
            const jc = col + dc * 2;
            if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
              const mr = row + dr;
              const mc = col + dc;
              const mid = board[mr][mc];
              if (mid !== 0 && Math.floor(mid) !== myColor) return true;
            }
          }
        }
      }
      return false;
    };

    const hasJumps = playerHasJumps();
    const isKing = piece > 2;
    const directions = [];
    if (myColor === 1 || isKing) directions.push([-1, -1], [-1, 1]);
    if (myColor === 2 || isKing) directions.push([1, -1], [1, 1]);

    for (const [dr, dc] of directions) {
      // Single move
      if (!hasJumps) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === 0) {
          moves.push([nr, nc]);
        }
      }

      // Jump
      const jr = r + dr * 2;
      const jc = c + dc * 2;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
        const mr = r + dr;
        const mc = c + dc;
        const midPiece = board[mr][mc];
        if (midPiece !== 0 && Math.floor(midPiece) !== myColor) {
          jumps.push([jr, jc]);
        }
      }
    }

    return jumps.length > 0 ? jumps : moves;
  };

  const validMoves = selected ? getValidMovesForPiece(selected[0], selected[1]) : [];

  const handleClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    
    const piece = board[r][c];

    if (selected) {
      const isValid = validMoves.some(m => m[0] === r && m[1] === c);
      if (isValid) {
        onMove({ from: selected, to: [r, c] });
        setSelected(null);
      } else if (piece && Math.floor(piece) === myColor) {
        setSelected([r, c]);
      } else {
        setSelected(null);
      }
    } else if (piece && Math.floor(piece) === myColor) {
      setSelected([r, c]);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 space-y-4">
      <div className="flex items-center space-x-4 mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${myColor === 1 ? 'bg-[#967bb6]' : 'bg-slate-300'}`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">You are {myColor === 1 ? 'Purple' : 'White'}</span>
        </div>
        {isMyTurn && (
          <div className="flex items-center space-x-2 animate-pulse">
            <Sparkles size={12} className="text-[#967bb6]" />
            <span className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest">Your Turn</span>
          </div>
        )}
      </div>

      <div className="relative p-4 rounded-2xl bg-[#1a0b2e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-[#0a0a0a]">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-lg"></div>
        
        <div className="grid grid-cols-8 gap-0 border-4 border-[#000] shadow-inner">
          {board.map((row: any[], r: number) => row.map((cell: number, c: number) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={`w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center transition-all cursor-pointer relative ${
                  isDark ? 'bg-[#0a0a0a]' : 'bg-[#1a0b2e]'
                } ${isSelected ? 'ring-4 ring-inset ring-[#967bb6] z-10' : ''}`}
              >
                {isValidMove && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-[#967bb6]/40 border-2 border-[#967bb6] shadow-[0_0_10px_rgba(150,123,182,0.5)]"></div>
                  </div>
                )}

                {cell !== 0 && (
                  <motion.div 
                    layoutId={`piece-${r}-${c}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`w-8 h-8 lg:w-11 lg:h-11 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transition-transform z-10 ${
                      Math.floor(cell) === 1 
                      ? 'bg-gradient-to-br from-[#967bb6] to-[#4b3b5e] border-2 border-[#967bb6]/50 shadow-[0_0_15px_rgba(150,123,182,0.3)]' 
                      : 'bg-gradient-to-br from-slate-200 to-slate-500 border-2 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    } ${isSelected ? '-translate-y-2 scale-110 shadow-[0_15px_30px_rgba(0,0,0,0.6)]' : ''}`}
                  >
                    <div className="absolute inset-1 rounded-full border border-white/10"></div>
                    <div className="absolute inset-2 rounded-full border border-white/5"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                    
                    {cell > 2 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Trophy size={16} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};

const getBlackjackValue = (hand: any[]) => {
  let val = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') {
      aces += 1;
      val += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      val += 10;
    } else {
      const n = parseInt(card.value);
      if (!isNaN(n)) val += n;
    }
  }
  while (val > 21 && aces > 0) {
    val -= 10;
    aces -= 1;
  }
  return val;
};

const Card: React.FC<{ suit: string, value: string, hidden?: boolean, index?: number }> = ({ suit, value, hidden, index = 0 }) => {
  if (hidden) {
    return (
      <motion.div 
        layout
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="w-16 h-24 lg:w-20 lg:h-28 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl border-2 border-[#967bb6]/30 shadow-2xl flex items-center justify-center relative overflow-hidden group"
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="relative">
          <Logo size="sm" className="opacity-20 grayscale brightness-200 scale-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#967bb6] font-black text-xl opacity-40">?</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const isRed = suit === 'heart' || suit === 'diamond' || suit === '♥' || suit === '♦';
  const getSuitIcon = () => {
    const s = suit.toLowerCase();
    if (s === 'spade' || s === '♠') return Spade;
    if (s === 'club' || s === '♣') return Club;
    if (s === 'heart' || s === '♥') return Heart;
    return Diamond;
  };
  const SuitIcon = getSuitIcon();

  return (
    <motion.div 
      layout
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="w-16 h-24 lg:w-20 lg:h-28 bg-gradient-to-br from-white to-slate-100 rounded-xl border-2 border-slate-300 shadow-2xl p-2 flex flex-col justify-between relative overflow-hidden"
    >
      <div className={`flex flex-col items-start ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="text-sm lg:text-base font-black leading-none tracking-tighter">{value}</span>
        <SuitIcon size={14} strokeWidth={3} />
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center opacity-[0.08] ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <SuitIcon size={48} strokeWidth={1} />
      </div>

      <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="text-sm lg:text-base font-black leading-none tracking-tighter">{value}</span>
        <SuitIcon size={14} strokeWidth={3} />
      </div>
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
    </motion.div>
  );
};

const BlackjackGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { players = [], dealerHand = [], status = 'waiting', pot = 0, currentPlayerIndex = 0 } = game.data;
  const [showInstructions, setShowInstructions] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const isMyActualTurn = isMyTurn && status === 'playing' && currentPlayer?.id === myId;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-8 bg-[#050505] text-white font-sans overflow-auto relative">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#967bb6_0%,_transparent_70%)] pointer-events-none"></div>
      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-8 flex flex-col items-center justify-center"
          >
            <div className="max-w-md w-full space-y-6">
              <h3 className="text-3xl font-black text-[#967bb6] uppercase tracking-tighter text-center">How to Play Blackjack</h3>
              <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                <p><strong className="text-white">Objective:</strong> Get a hand value closer to 21 than the dealer without going over (busting).</p>
                <p><strong className="text-white">Values:</strong> Face cards (J, Q, K) are 10. Aces are 1 or 11. Number cards are face value.</p>
                <p><strong className="text-white">Hit:</strong> Take another card to increase your total.</p>
                <p><strong className="text-white">Stay:</strong> Keep your current total and end your turn.</p>
                <p><strong className="text-white">Dealer:</strong> Must hit until they reach at least 17.</p>
                <p><strong className="text-white">Payouts:</strong> Standard win pays 2x. Blackjack (21 with 2 cards) pays 2.5x.</p>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full py-4 bg-[#967bb6] text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[750px] w-full p-6 bg-black/20 rounded-3xl border border-white/10 shadow-2xl relative">
        <button 
          onClick={() => setShowInstructions(true)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <span className="font-bold text-xs">?</span>
        </button>

        <h2 className="text-3xl font-black text-center mb-6 uppercase tracking-tighter">♠️ Blackjack</h2>

        <div className="flex justify-center items-center space-x-8 mb-8 text-sm font-bold bg-white/5 p-4 rounded-2xl border border-white/10">
          {players.map((player: any, i: number) => (
            <React.Fragment key={player.id}>
              {i > 0 && <div className="h-8 w-px bg-white/10"></div>}
              <div className="flex flex-col items-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest">Player {i + 1}</span>
                <span className="text-xl font-black">{player.score || 0}</span>
              </div>
            </React.Fragment>
          ))}
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">Pot</span>
            <span className="text-xl font-black text-yellow-500">{pot}</span>
          </div>
        </div>

        {status === 'playing' && (
          <h3 className="text-center text-[#967bb6] font-black uppercase tracking-widest mb-8 animate-pulse">
            {players[currentPlayerIndex]?.id === myId ? "Your Turn" : `Player ${currentPlayerIndex + 1}'s Turn`}
          </h3>
        )}

        <div className="space-y-12">
          {/* Dealer Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Dealer</h4>
              <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white/60">
                {getBlackjackValue(dealerHand)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[100px] justify-center">
              {dealerHand.map((card: any, i: number) => (
                <BlackjackCard 
                  key={`dealer-${i}`} 
                  suit={card.suit} 
                  value={card.value} 
                  hidden={false} 
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Players Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {players.map((player: any, pIdx: number) => (
              <div 
                key={player.id} 
                className={`space-y-4 p-4 rounded-2xl transition-all ${
                  status === 'playing' && currentPlayerIndex === pIdx 
                  ? 'bg-white/5 ring-2 ring-[#967bb6]/50' 
                  : 'bg-black/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={game.players.find(p => p.id === player.id)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`} 
                      className="w-6 h-6 rounded-full border border-white/20"
                      alt=""
                    />
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                      {player.id === myId ? "You" : (game.players.find(p => p.id === player.id)?.displayName || "Opponent")}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#967bb6]">
                      Chips: {player.score}
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white/60">
                      {getBlackjackValue(player.hand)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[100px] justify-center">
                  {(player.hand || []).map((card: any, i: number) => (
                    <BlackjackCard 
                      key={`${player.id}-${i}`} 
                      suit={card.suit} 
                      value={card.value} 
                      index={i}
                    />
                  ))}
                </div>
                {status === 'playing' && currentPlayerIndex === pIdx && (
                  <div className="text-center">
                    <span className="text-[10px] font-black text-[#967bb6] animate-pulse uppercase">Thinking...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center space-y-6">
          <div className="flex gap-4">
            {status !== 'playing' ? (
              <button 
                onClick={() => onMove({ type: 'deal' })}
                className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Deal
              </button>
            ) : (
              <>
                <button 
                  disabled={!isMyActualTurn}
                  onClick={() => onMove({ type: 'hit' })}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                    isMyActualTurn 
                    ? 'bg-white text-black hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  Hit
                </button>
                <button 
                  disabled={!isMyActualTurn}
                  onClick={() => onMove({ type: 'stand' })}
                  className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                    isMyActualTurn 
                    ? 'bg-[#967bb6] text-white hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  Stay
                </button>
              </>
            )}
          </div>

          {status === 'finished' && (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-500">
              <p className="text-xl font-black text-emerald-400 uppercase tracking-widest animate-bounce">
                Round Complete!
              </p>
              <div className="flex flex-col items-center gap-2 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Next Hand Dealing Automatically</span>
                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                    className="absolute inset-0 bg-[#967bb6] shadow-[0_0_8px_#967bb6]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BlackjackCard: React.FC<{ 
  suit: string, 
  value: string, 
  hidden?: boolean,
  index?: number
}> = ({ suit, value, hidden, index = 0 }) => {
  return <Card suit={suit} value={value} hidden={hidden} index={index} />;
};

const RummyGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { players = [], discardPile = [], turnPhase = 'draw', deck = [] } = game.data;
  const me = players.find((p: any) => p.id === myId);
  const opponent = players.find((p: any) => p.id !== myId);
  const [sortBy, setSortBy] = useState<'suit' | 'rank'>('rank');

  if (!me || !opponent) return null;

  const scoreData = calculateRummyScore(me.hand);
  const meldedIndices = new Set(scoreData.melds.flat().map((m: any) => 
    me.hand.findIndex((c: any) => c.suit === m.suit && c.value === m.value)
  ));

  const handleDraw = (fromDiscard: boolean) => {
    if (!isMyTurn || turnPhase !== 'draw') return;
    onMove({ type: 'draw', fromDiscard });
  };

  const handleDiscard = (cardIndex: number) => {
    if (!isMyTurn || turnPhase !== 'discard') return;
    onMove({ type: 'discard', cardIndex });
  };

  const handleKnock = (cardIndex: number) => {
    if (!isMyTurn || turnPhase !== 'discard') return;
    onMove({ type: 'discard', cardIndex, knock: true });
  };

  const sortedHand = [...me.hand].map((c, i) => ({ ...c, originalIndex: i }))
    .sort((a, b) => {
      if (sortBy === 'suit') {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return getRankValue(a.value) - getRankValue(b.value);
      } else {
        if (a.value !== b.value) return getRankValue(a.value) - getRankValue(b.value);
        return a.suit.localeCompare(b.suit);
      }
    });

  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-4 lg:py-8 bg-[#0a0510] relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#2d1b4d_0%,transparent_70%)]"></div>
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Opponent Section */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex -space-x-10 lg:-space-x-14 opacity-40 scale-75 lg:scale-90">
          {(opponent.hand || []).map((_: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="w-16 h-24 lg:w-20 lg:h-28 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl border border-white/10 shadow-lg flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <Logo size="sm" className="opacity-10 grayscale brightness-200 scale-50" />
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <UserIcon size={12} className="text-[#967bb6]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {opponent.displayName || 'Opponent'}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest leading-none">
            {opponent.hand?.length} Cards
          </span>
        </div>
      </div>

      {/* Center Piles */}
      <div className="relative z-10 flex items-center gap-8 lg:gap-16">
        {/* Stock Pile */}
        <div className="relative flex flex-col items-center gap-3">
          <motion.div 
            whileHover={isMyTurn && turnPhase === 'draw' ? { scale: 1.05, translateY: -8 } : {}}
            whileTap={isMyTurn && turnPhase === 'draw' ? { scale: 0.95 } : {}}
            onClick={() => handleDraw(false)}
            className={`w-24 h-36 lg:w-32 lg:h-48 bg-gradient-to-br from-[#1a0b2e] to-black border-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
              isMyTurn && turnPhase === 'draw' 
              ? 'border-purple-500 ring-8 ring-purple-500/20' 
              : 'border-[#967bb6]/20'
            }`}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <Logo className="w-12 h-12 lg:w-16 lg:h-16 opacity-20 mb-2 grayscale brightness-200" />
            <span className="text-[10px] font-black text-purple-400/50 uppercase tracking-widest relative z-10">Deck ({deck.length})</span>
            {isMyTurn && turnPhase === 'draw' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-purple-500/10 pointer-events-none"
              />
            )}
          </motion.div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Draw Stock</span>
        </div>

        {/* Discard Pile */}
        <div className="relative flex flex-col items-center gap-3">
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={discardPile.length}
              initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              whileHover={isMyTurn && turnPhase === 'draw' && discardPile.length > 0 ? { scale: 1.05, translateY: -8 } : {}}
              whileTap={isMyTurn && turnPhase === 'draw' && discardPile.length > 0 ? { scale: 0.95 } : {}}
              onClick={() => handleDraw(true)}
              className={`w-24 h-36 lg:w-32 lg:h-48 bg-white/5 border-4 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer transition-all relative ${
                isMyTurn && turnPhase === 'draw' && discardPile.length > 0
                ? 'border-emerald-500 ring-8 ring-emerald-500/20' 
                : 'border-white/10'
              }`}
            >
              {discardPile.length > 0 ? (
                <Card suit={discardPile[discardPile.length - 1].suit} value={discardPile[discardPile.length - 1].value} />
              ) : (
                <div className="flex flex-col items-center opacity-20">
                  <RotateCcw size={32} className="text-slate-500 mb-2" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Empty</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Take Discard</span>
        </div>
      </div>

      {/* My Section */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center gap-4 lg:gap-6">
        {/* Hand Stats & Controls */}
        <div className="w-full flex items-center justify-between px-6 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Your Deadwood</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl lg:text-2xl font-black tabular-nums transition-colors ${scoreData.deadwood <= 10 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {scoreData.deadwood}
                </span>
                {scoreData.deadwood <= 10 && (
                  <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[9px] font-black text-emerald-400 uppercase animate-pulse">
                    Ready to Knock
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortBy(sortBy === 'rank' ? 'suit' : 'rank')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
            >
              <LayoutGrid size={14} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Sort {sortBy === 'rank' ? 'Suit' : 'Rank'}</span>
            </button>
          </div>
        </div>

        {/* Hand */}
        <div className="flex flex-wrap justify-center gap-2 lg:gap-3 bg-black/20 p-4 lg:p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
          {sortedHand.map((card: any, i: number) => {
            const isMelded = meldedIndices.has(card.originalIndex);
            return (
              <motion.div 
                key={`${card.suit}-${card.value}-${i}`}
                layout
                whileHover={{ translateY: -24, scale: 1.05 }}
                onClick={() => handleDiscard(card.originalIndex)}
                onContextMenu={(e) => { e.preventDefault(); handleKnock(card.originalIndex); }}
                className={`relative cursor-pointer group transition-all ${
                  isMyTurn && turnPhase === 'discard' 
                  ? 'hover:ring-4 hover:ring-purple-500/50 rounded-xl' 
                  : ''
                }`}
              >
                <div className={`transition-all duration-300 ${isMelded ? 'ring-2 ring-emerald-500/30 rounded-xl bg-emerald-500/5' : ''}`}>
                  <Card suit={card.suit} value={card.value} index={i} />
                </div>
                
                {isMelded && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-emerald-500 rounded-full p-0.5 shadow-lg shadow-emerald-500/50">
                      <Check size={8} className="text-white" />
                    </div>
                  </div>
                )}

                {isMyTurn && turnPhase === 'discard' && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-75 group-hover:scale-100">
                    <div className="flex flex-col items-center gap-1">
                      <div className="bg-white px-2 py-0.5 rounded shadow-xl">
                        <span className="text-[9px] font-black text-slate-900 uppercase whitespace-nowrap leading-none flex items-center gap-1">
                          <MousePointer2 size={8} /> Discard
                        </span>
                      </div>
                      <div className="bg-emerald-500 px-2 py-0.5 rounded shadow-xl">
                        <span className="text-[9px] font-black text-white uppercase whitespace-nowrap leading-none">
                          Right-Click Knock
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Action Feed / Status */}
        <div className="h-10">
          <AnimatePresence mode="wait">
            {!isMyTurn ? (
              <motion.div 
                key="waiting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full"
              >
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Jade Vixen is thinking...</span>
              </motion.div>
            ) : (
              <motion.div 
                key={turnPhase}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 px-6 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                <Sparkles size={14} className="text-purple-400 animate-pulse" />
                <span className="text-[10px] font-black text-purple-200 uppercase tracking-[0.2em]">
                  {turnPhase === 'draw' ? 'Draw card from Stock or Discard' : 'Select a card to Discard (Right-click to Knock)'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const BilliardsGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string, socket: Socket | null }> = ({ game, onMove, isMyTurn, myId, socket }) => {
  // New implementation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiming, setAiming] = useState(false);
  const aimAngleRef = useRef(0);
  const [power, setPower] = useState(20);
  const powerRef = useRef(20);
  const [lastMousePos, setLastMousePos] = useState<{ x: number, y: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Physics state in refs for smooth animation
  const ballsRef = useRef<any[]>([]);
  const cueBallRef = useRef<any>(null);
  const isSimulatingRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  // Synchronize powerRef with power state
  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  const FRICTION = 0.9935; // Slightly more friction for better stopping
  const WALL_BOUNCE = 0.75;
  const BALL_BOUNCE = 0.96;
  const BALL_RADIUS = 12;
  const POCKET_RADIUS = 26;
  const WIDTH = 800;
  const HEIGHT = 400;

  useEffect(() => {
    if (!socket) return;
    const handleRemoteShot = (data: { dx: number, dy: number }) => {
      if (!isSimulatingRef.current && cueBallRef.current) {
        cueBallRef.current.vx = data.dx * 0.1;
        cueBallRef.current.vy = data.dy * 0.1;
        isSimulatingRef.current = true;
        setIsSimulating(true);

        // Fail-safe to end simulation after 12 seconds
        setTimeout(() => {
          if (isSimulatingRef.current) {
            isSimulatingRef.current = false;
            setIsSimulating(false);
          }
        }, 12000);
      }
    };
    socket.on("game:billiards:shot", handleRemoteShot);
    return () => { socket.off("game:billiards:shot"); };
  }, [socket]);

  const pockets = useMemo(() => [
    { x: 0, y: 0 },
    { x: WIDTH / 2, y: 0 },
    { x: WIDTH, y: 0 },
    { x: 0, y: HEIGHT },
    { x: WIDTH / 2, y: HEIGHT },
    { x: WIDTH, y: HEIGHT }
  ], []);

  // Sync with game state from server
  useEffect(() => {
    if (!isSimulatingRef.current) {
      ballsRef.current = JSON.parse(JSON.stringify(game.data.balls));
      cueBallRef.current = JSON.parse(JSON.stringify(game.data.cueBall));
      // Reset aiming if it's my turn now
      if (game.turn === myId) {
        setPower(20);
        setAiming(false);
      }
    }
  }, [game.data.balls, game.data.cueBall, game.turn, myId]);

  const getMouse = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleShoot = () => {
    if (!isMyTurn || isSimulatingRef.current || !cueBallRef.current) return;
    
    // Power scale adjusted for better feel
    const powerScale = powerRef.current * 0.22;
    const dx = Math.cos(aimAngleRef.current) * powerScale;
    const dy = Math.sin(aimAngleRef.current) * powerScale;

    cueBallRef.current.vx = dx;
    cueBallRef.current.vy = dy;
    isSimulatingRef.current = true;
    setIsSimulating(true);

    onMove({ type: 'shoot', dx: dx * 10, dy: dy * 10 });
    setPower(20);

    // Fail-safe to end simulation after 12 seconds
    setTimeout(() => {
      if (isSimulatingRef.current) {
        isSimulatingRef.current = false;
        setIsSimulating(false);
      }
    }, 12000);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || isSimulatingRef.current || !canvasRef.current || !cueBallRef.current) return;
    
    // Touch-zoom protection
    if ('touches' in e) {
      if (e.touches.length > 1) {
        setAiming(false);
        return; // Allow parent to handle pinch zoom
      }
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }

    const mouse = getMouse(e, canvasRef.current);

    // Check if clicking power bar on canvas
    const barW = 40; // Wider hit area
    const barH = 200;
    const bx = WIDTH + 10, by = (HEIGHT - barH) / 2;
    if (mouse.x >= bx - 10 && mouse.x <= bx + barW && mouse.y >= by && mouse.y <= by + barH) {
      const newPower = Math.round(((by + barH - mouse.y) / barH) * 100);
      const clampedPower = Math.min(Math.max(newPower, 5), 100);
      setPower(clampedPower);
      powerRef.current = clampedPower;
      return;
    }

    const dx = mouse.x - cueBallRef.current.x;
    const dy = mouse.y - cueBallRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < BALL_RADIUS * 4) {
      // No automatic shooting on click near ball
      return;
    } else {
      setAiming(true);
      setLastMousePos(mouse);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !cueBallRef.current) return;
    
    // Touch-zoom protection
    if ('touches' in e) {
      if (e.touches.length > 1) {
        setAiming(false);
        return; // Allow parent to handle pinch zoom
      }
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }

    const mouse = getMouse(e, canvasRef.current);

    // Support power bar dragging
    if (('buttons' in e && e.buttons === 1) || 'touches' in e) {
      const barH = 200;
      const bx = WIDTH + 10, by = (HEIGHT - barH) / 2;
      if (mouse.x >= bx - 10 && mouse.x <= bx + 50) {
        const newPower = Math.round(((by + barH - mouse.y) / barH) * 100);
        const clampedPower = Math.min(Math.max(newPower, 5), 100);
        setPower(clampedPower);
        powerRef.current = clampedPower;
        return;
      }
    }

    if (aiming && lastMousePos) {
      const sensitivity = 0.006;
      const deltaX = mouse.x - lastMousePos.x;
      aimAngleRef.current += deltaX * sensitivity;
      setLastMousePos(mouse);
    } else if (!isSimulatingRef.current && isMyTurn) {
      // For non-touch hovering, auto-aim towards mouse
      if (!('touches' in e)) {
        const dx = mouse.x - cueBallRef.current.x;
        const dy = mouse.y - cueBallRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 50) {
          aimAngleRef.current = Math.atan2(dy, dx);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setAiming(false);
    setLastMousePos(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawTable = () => {
      // Outer Frame
      ctx.fillStyle = '#2c1e16';
      ctx.fillRect(-30, -30, WIDTH + 60, HEIGHT + 60);

      // Rails
      ctx.fillStyle = '#3d2b1f';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-20, -20, WIDTH + 40, 20); // Top
      ctx.fillRect(-20, HEIGHT, WIDTH + 40, 20); // Bottom
      ctx.fillRect(-20, -20, 20, HEIGHT + 40); // Left
      ctx.fillRect(WIDTH, -20, 20, HEIGHT + 40); // Right
      ctx.shadowBlur = 0;

      // Inlay diamonds on rails
      ctx.fillStyle = '#ddd';
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(WIDTH * i / 4, -10, 2, 0, Math.PI * 2);
        ctx.arc(WIDTH * i / 4, HEIGHT + 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Table Felt
      const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 50, WIDTH/2, HEIGHT/2, WIDTH * 0.6);
      gradient.addColorStop(0, '#2d5a2d');
      gradient.addColorStop(1, '#1a331a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Table markings
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(WIDTH * 0.22, 0);
      ctx.lineTo(WIDTH * 0.22, HEIGHT);
      ctx.stroke();
      
      // D-Zone
      ctx.beginPath();
      ctx.arc(WIDTH * 0.22, HEIGHT/2, 60, Math.PI/2, -Math.PI/2);
      ctx.stroke();

      // Pockets
      pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#050505';
        ctx.fill();
        
        // Pocket rim
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const drawBall = (ball: any) => {
      if (!ball.active) return;
      
      // Shadow
      ctx.beginPath();
      ctx.arc(ball.x + 3, ball.y + 3, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Ball body
      const ballGrad = ctx.createRadialGradient(
        ball.x - BALL_RADIUS * 0.4, 
        ball.y - BALL_RADIUS * 0.4, 
        BALL_RADIUS * 0.1,
        ball.x, 
        ball.y, 
        BALL_RADIUS
      );
      
      if (ball.type === 'cue') {
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.5, '#f0f0f0');
        ballGrad.addColorStop(1, '#cccccc');
      } else {
        ballGrad.addColorStop(0, '#fff');
        ballGrad.addColorStop(0.2, ball.color);
        ballGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
      }
      
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // Number/Stripe
      if (ball.type !== 'cue') {
        // Stripe background
        if (ball.type === 'stripe') {
          ctx.beginPath();
          ctx.rect(ball.x - BALL_RADIUS, ball.y - BALL_RADIUS * 0.4, BALL_RADIUS * 2, BALL_RADIUS * 0.8);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
        }

        // Information circle
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.font = `bold ${BALL_RADIUS * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.id.toString(), ball.x, ball.y);
      }

      // Glossy Reflection
      ctx.beginPath();
      ctx.ellipse(ball.x - BALL_RADIUS * 0.3, ball.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.4, BALL_RADIUS * 0.2, -Math.PI/4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    };

    const drawCue = () => {
      if (isSimulatingRef.current || !isMyTurn || !cueBallRef.current) return;

      const dist = 50 + powerRef.current * 0.4;
      const cueLen = 300;
      const startX = cueBallRef.current.x - Math.cos(aimAngleRef.current) * dist;
      const startY = cueBallRef.current.y - Math.sin(aimAngleRef.current) * dist;
      const endX = cueBallRef.current.x - Math.cos(aimAngleRef.current) * (dist + cueLen);
      const endY = cueBallRef.current.y - Math.sin(aimAngleRef.current) * (dist + cueLen);

      // --- Aim Line with collision detection ---
      let aimEndX = cueBallRef.current.x + Math.cos(aimAngleRef.current) * 1000;
      let aimEndY = cueBallRef.current.y + Math.sin(aimAngleRef.current) * 1000;
      let collisionPoint = null;

      // Check for first ball collision along aim line
      const dirX = Math.cos(aimAngleRef.current);
      const dirY = Math.sin(aimAngleRef.current);
      
      let minT = 1000;
      ballsRef.current.forEach(ball => {
        if (!ball.active) return;
        
        // Ray-Sphere intersection
        const ocX = cueBallRef.current.x - ball.x;
        const ocY = cueBallRef.current.y - ball.y;
        const b = 2 * (ocX * dirX + ocY * dirY);
        const c = ocX * ocX + ocY * ocY - (BALL_RADIUS * 2) * (BALL_RADIUS * 2);
        const disc = b * b - 4 * c;
        
        if (disc >= 0) {
          const t = (-b - Math.sqrt(disc)) / 2;
          if (t > 0 && t < minT) {
            minT = t;
          }
        }
      });

      // Wall collision for aim line
      const wT = [
        (BALL_RADIUS - cueBallRef.current.x) / dirX,
        (WIDTH - BALL_RADIUS - cueBallRef.current.x) / dirX,
        (BALL_RADIUS - cueBallRef.current.y) / dirY,
        (HEIGHT - BALL_RADIUS - cueBallRef.current.y) / dirY
      ];
      wT.forEach(t => {
        if (t > 0 && t < minT) minT = t;
      });

      aimEndX = cueBallRef.current.x + dirX * minT;
      aimEndY = cueBallRef.current.y + dirY * minT;

      // Draw dashed line
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(cueBallRef.current.x, cueBallRef.current.y);
      ctx.lineTo(aimEndX, aimEndY);
      ctx.stroke();

      // Ghost ball at aim end
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(aimEndX, aimEndY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();
      
      // Reflection direction hint (simple)
      ctx.beginPath();
      ctx.moveTo(aimEndX, aimEndY);
      ctx.lineTo(aimEndX + dirX * 30, aimEndY + dirY * 30);
      ctx.stroke();

      // --- Power Bar on Canvas (Side) ---
      const barW = 12;
      const barH = 200;
      const bx = WIDTH + 15, by = (HEIGHT - barH) / 2;
      
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.roundRect(bx, by, barW, barH, 6);
      ctx.fill();
      
      // Fill
      const pRatio = powerRef.current / 100;
      const fillH = barH * pRatio;
      const fillGrad = ctx.createLinearGradient(bx, by + barH, bx, by);
      fillGrad.addColorStop(0, '#4ade80');
      fillGrad.addColorStop(0.5, '#facc15');
      fillGrad.addColorStop(1, '#ef4444');
      
      ctx.fillStyle = fillGrad;
      ctx.roundRect(bx, by + barH - fillH, barW, fillH, 6);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);

      // Cue Stick
      ctx.lineWidth = 8;
      const cueGrad = ctx.createLinearGradient(startX, startY, endX, endY);
      cueGrad.addColorStop(0, '#d2b48c');
      cueGrad.addColorStop(0.2, '#8b4513');
      cueGrad.addColorStop(0.8, '#3d2b1f');
      cueGrad.addColorStop(1, '#1a1a1a');
      
      ctx.strokeStyle = cueGrad;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Cue Tip
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(aimAngleRef.current) * 5, startY + Math.sin(aimAngleRef.current) * 5);
      ctx.stroke();
    };

    const update = () => {
      if (!isSimulatingRef.current) return;

      const subSteps = 8;
      let moving = false;
      const allBalls = [cueBallRef.current, ...ballsRef.current].filter(b => b);

      for (let s = 0; s < subSteps; s++) {
        allBalls.forEach(ball => {
          if (!ball.active) return;
          
          ball.x += ball.vx / subSteps;
          ball.y += ball.vy / subSteps;
          
          // Apply friction every step (adjusted for sub-stepping)
          ball.vx *= Math.pow(FRICTION, 1 / subSteps);
          ball.vy *= Math.pow(FRICTION, 1 / subSteps);

          if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
          if (Math.abs(ball.vy) < 0.02) ball.vy = 0;
          if (ball.vx !== 0 || ball.vy !== 0) moving = true;

          // Wall collisions
          const wallPadding = BALL_RADIUS;
          if (ball.x < wallPadding) { ball.x = wallPadding; ball.vx *= -WALL_BOUNCE; }
          if (ball.x > WIDTH - wallPadding) { ball.x = WIDTH - wallPadding; ball.vx *= -WALL_BOUNCE; }
          if (ball.y < wallPadding) { ball.y = wallPadding; ball.vy *= -WALL_BOUNCE; }
          if (ball.y > HEIGHT - wallPadding) { ball.y = HEIGHT - wallPadding; ball.vy *= -WALL_BOUNCE; }

          // Pockets
          pockets.forEach(p => {
            const dx = ball.x - p.x;
            const dy = ball.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
              ball.active = false;
              ball.vx = 0;
              ball.vy = 0;
            }
          });
        });

        // Ball collisions
        for (let i = 0; i < allBalls.length; i++) {
          for (let j = i + 1; j < allBalls.length; j++) {
            const b1 = allBalls[i];
            const b2 = allBalls[j];
            if (!b1.active || !b2.active) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distSq = dx * dx + dy * dy;
            const minDist = BALL_RADIUS * 2;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              
              const rvx = b1.vx - b2.vx;
              const rvy = b1.vy - b2.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              
              if (velAlongNormal < 0) {
                // Perfect elastic collision with slight energy preservation boost
                const impulse = -(1 + BALL_BOUNCE) * velAlongNormal / 2;
                const impulseX = impulse * nx;
                const impulseY = impulse * ny;
                b1.vx += impulseX;
                b1.vy += impulseY;
                b2.vx -= impulseX;
                b2.vy -= impulseY;
              }
              
              // Prevent sticking
              const overlap = minDist - dist;
              b1.x -= nx * overlap / 2;
              b1.y -= ny * overlap / 2;
              b2.x += nx * overlap / 2;
              b2.y += ny * overlap / 2;
              moving = true;
            }
          }
        }
      }

      if (!moving) {
        if (isSimulatingRef.current) {
          // Final sync with server state when simulation ends
          ballsRef.current = JSON.parse(JSON.stringify(game.data.balls));
          cueBallRef.current = JSON.parse(JSON.stringify(game.data.cueBall));
          isSimulatingRef.current = false;
          setIsSimulating(false);
        }
      }
    };

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawTable();
      ballsRef.current.forEach(drawBall);
      if (cueBallRef.current) drawBall(cueBallRef.current);
      drawCue();
      update();
      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pockets]); // Removed game and isMyTurn to prevent loop churn

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="rounded-xl shadow-2xl cursor-crosshair border-8 border-[#3d2b1f] max-w-full bg-[#1a331a] touch-none"
          style={{ width: WIDTH + 40, height: HEIGHT }}
        />
        
        {isMyTurn && !isSimulating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold animate-pulse mb-3">
              YOUR TURN - AIM & SET POWER
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShoot();
              }}
              className="pointer-events-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-400/30 transform active:scale-95 transition-all"
            >
              Take Shot
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isMyTurn && !isSimulating ? 'bg-green-500 animate-ping' : isSimulating ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-white font-bold">
              {isSimulating ? 'Physic Simulation...' : isMyTurn ? 'Your Turn' : `${game.players.find(p => p.id === game.turn)?.displayName || 'Opponent'}'s Turn`}
            </span>
          </div>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        {isMyTurn && !isSimulating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-medium uppercase tracking-wider">Shot Power</span>
              <span className="text-white font-mono">{power}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={power}
              onChange={(e) => setPower(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#967bb6]"
            />
            <button
              onClick={handleShoot}
              disabled={isSimulating}
              className={`w-full py-4 bg-gradient-to-r from-[#967bb6] to-[#6a5acd] text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${isSimulating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-[#967bb6]/40 active:scale-95'}`}
            >
              <Sparkles size={20} />
              Fire Shot
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {game.players.map(p => (
            <div key={p.id} className={`p-4 rounded-xl border transition-all ${game.turn === p.id ? 'bg-[#967bb6]/20 border-[#967bb6]' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center gap-3 mb-2">
                <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} className="w-8 h-8 rounded-full" />
                <span className="text-white font-bold truncate">{p.displayName}</span>
              </div>
              <div className="text-xs text-white/40 uppercase font-bold">
                {game.data.playerTypes[p.id] || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>

        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-sm text-white/60 space-y-2 border-t border-white/10 pt-4"
          >
            <p>• Drag mouse horizontally to aim</p>
            <p>• Use slider to adjust shot power</p>
            <p>• Click cue ball or "Take Shot" button to fire</p>
            <p>• Sink all your balls (Solids or Stripes) then the 8-ball to win</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};


export default GameRoom;
