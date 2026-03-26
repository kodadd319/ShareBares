
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Dices, Users, User as UserIcon, Bot, Play, CheckCircle2, 
  X, ChevronLeft, Trophy, MessageSquare, Send,
  Circle, Square, Layers, Spade, Club, Heart, Diamond,
  Target, Zap, Flame, Sparkles, Info, Plus,
  ArrowRight, History, RotateCcw, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { User, GameType, GameState, GameInvite } from '../types';
import { Socket } from 'socket.io-client';

interface GameRoomProps {
  user: User;
  socket: Socket | null;
  users: User[];
  setActiveTab: (tab: string) => void;
}

const GameRoom: React.FC<GameRoomProps> = ({ user, socket, users, setActiveTab }) => {
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const [isWaitingForInvite, setIsWaitingForInvite] = useState<{ toId: string, gameType: GameType } | null>(null);

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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text">The Game Room</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Choose your game, choose your partner, enjoy the stakes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'checkers', label: 'Checkers', icon: Square, color: 'from-red-500/20 to-black', desc: 'Jump and capture. Winner takes all.' },
          { id: '10000', label: '10,000', icon: Dices, color: 'from-amber-500/20 to-black', desc: 'Roll the dice. Push your luck.' },
          { id: 'rummy', label: 'Rummy', icon: Layers, color: 'from-blue-500/20 to-black', desc: 'Melts and sets. A game of skill.' },
          { id: 'blackjack', label: 'Blackjack', icon: Spade, color: 'from-emerald-500/20 to-black', desc: 'Get to 21. Don\'t bust.' },
          { id: 'billiards', label: 'Billiards', icon: Target, color: 'from-purple-500/20 to-black', desc: 'Sink the balls. Master the angles.' }
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
                      <img src={u.avatar || undefined} className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform" alt="" />
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
                      <img src={u.avatar || undefined} className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform" alt="" />
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
      case 'rummy': return "Form sets (3+ of same rank) or runs (3+ of same suit in sequence). Draw from deck or discard. Discard one card to end turn. Empty hand to win.";
      case 'billiards': return "8-Ball Rules: First pot determines Solids or Stripes. Sink all your balls, then the 8-ball to win. Potting the 8-ball early is a loss.";
      default: return "";
    }
  };

  const renderGameUI = () => {
    if (!activeGame) return null;

    const isMyTurn = activeGame.turn === user.id;
    const opponent = activeGame.players.find(p => p.id !== user.id);
    const me = activeGame.players.find(p => p.id === user.id);

    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-8 min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={quitGame}
            className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]"
          >
            <ChevronLeft size={18} />
            <span>Quit Game</span>
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
                <img src={me?.avatar || undefined} className="w-full h-full rounded-xl object-cover" alt="" />
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
                <img src={opponent?.avatar || undefined} className="w-full h-full rounded-xl object-cover" alt="" />
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
        <div className="flex-grow flex items-center justify-center">
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
          ) : activeGame.status === 'finished' ? (
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
            <div className="w-full max-w-4xl aspect-square lg:aspect-video bg-black/40 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden chrome-border p-8">
              {/* Game Specific Rendering */}
              {activeGame.type === 'checkers' && <CheckersGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
              {activeGame.type === '10000' && <DiceGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
              {activeGame.type === 'rummy' && <RummyGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
              {activeGame.type === 'blackjack' && <BlackjackGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
              {activeGame.type === 'billiards' && <BilliardsGame game={activeGame} onMove={makeMove} isMyTurn={isMyTurn} myId={user.id} />}
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
          <div className={`w-4 h-4 rounded-full ${myColor === 1 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">You are {myColor === 1 ? 'Red' : 'White'}</span>
        </div>
        {isMyTurn && (
          <div className="flex items-center space-x-2 animate-pulse">
            <Sparkles size={12} className="text-[#967bb6]" />
            <span className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest">Your Turn</span>
          </div>
        )}
      </div>

      <div className="relative p-4 rounded-2xl bg-[#3d2b1f] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-[#2a1d15]">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] rounded-lg"></div>
        
        <div className="grid grid-cols-8 gap-0 border-4 border-[#1a110a] shadow-inner">
          {board.map((row: any[], r: number) => row.map((cell: number, c: number) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={`w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center transition-all cursor-pointer relative ${
                  isDark ? 'bg-[#5d4037]' : 'bg-[#d7ccc8]'
                } ${isSelected ? 'ring-4 ring-inset ring-[#967bb6] z-10' : ''}`}
              >
                {isValidMove && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-[#967bb6]/40 border-2 border-[#967bb6]"></div>
                  </div>
                )}

                {cell !== 0 && (
                  <motion.div 
                    layoutId={`piece-${r}-${c}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`w-8 h-8 lg:w-11 lg:h-11 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.4)] flex items-center justify-center relative overflow-hidden transition-transform z-10 ${
                      Math.floor(cell) === 1 
                      ? 'bg-gradient-to-br from-red-500 to-red-800 border-2 border-red-400/30' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-400 border-2 border-white/40'
                    } ${isSelected ? '-translate-y-2 scale-110 shadow-[0_10px_20px_rgba(0,0,0,0.4)]' : ''}`}
                  >
                    <div className="absolute inset-1 rounded-full border border-black/10"></div>
                    <div className="absolute inset-2 rounded-full border border-black/10"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                    
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

const calculateDiceScore = (dice: number[]) => {
  if (dice.length === 0) return { score: 0, usedCount: 0 };
  
  const counts: Record<number, number> = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  
  let score = 0;
  let usedCount = 0;
  
  const values = Object.keys(counts).map(Number).sort();
  
  // 1-6 Straight
  if (values.length === 6) {
    return { score: 1500, usedCount: 6 };
  }
  
  // Three pairs
  const pairs = values.filter(v => counts[v] === 2);
  if (pairs.length === 3) {
    return { score: 1500, usedCount: 6 };
  }

  // Standard scoring
  for (const val of [1, 5, 2, 3, 4, 6]) {
    let count = counts[val] || 0;
    if (count >= 3) {
      let base = (val === 1) ? 1000 : val * 100;
      // Double for each die over 3
      score += base * Math.pow(2, count - 3);
      usedCount += count;
      count = 0; // All used for the triplet/quad/etc
    }
    
    if (val === 1) {
      score += count * 100;
      usedCount += count;
    } else if (val === 5) {
      score += count * 50;
      usedCount += count;
    }
  }
  
  return { score, usedCount };
};

const Die: React.FC<{ value: number; isSelected: boolean; isSaved: boolean; onClick: () => void; disabled: boolean }> = ({ value, isSelected, isSaved, onClick, disabled }) => {
  const dotPositions = [
    [], // 0
    [4], // 1: center
    [2, 6], // 2: top-right, bottom-left
    [2, 4, 6], // 3: top-right, center, bottom-left
    [0, 2, 6, 8], // 4: top-left, top-right, bottom-left, bottom-right
    [0, 2, 4, 6, 8], // 5: top-left, top-right, center, bottom-left, bottom-right
    [0, 2, 3, 5, 6, 8], // 6: top-left, top-right, center-left, center-right, bottom-left, bottom-right
  ];

  return (
    <motion.div
      whileHover={!disabled && !isSaved ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={!disabled && !isSaved ? { scale: 0.9 } : {}}
      onClick={!disabled && !isSaved ? onClick : undefined}
      className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center shadow-2xl transition-all relative ${
        isSaved
        ? 'bg-slate-800 border-2 border-slate-700 opacity-60 cursor-default'
        : isSelected 
        ? 'bg-[#967bb6] border-4 border-white/40 -translate-y-4 cursor-pointer' 
        : 'bg-white border-2 border-slate-200 cursor-pointer'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-3/4 h-3/4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[value].includes(i) && (
              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isSelected || isSaved ? 'bg-white' : 'bg-black'}`} />
            )}
          </div>
        ))}
      </div>
      {isSaved && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 shadow-lg">
          <CheckCircle2 size={12} className="text-white" />
        </div>
      )}
    </motion.div>
  );
};

const DiceGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { 
    dice = [], 
    savedDice = [],
    score = {}, 
    currentTurnScore = 0,
    isFirstRoll = true,
    farkled = false,
  } = game.data;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  useEffect(() => {
    setSelectedIndices([]);
  }, [dice]);

  const opponent = game.players.find(p => p.id !== myId);
  const opponentScore = score[opponent?.id || ''] || 0;
  const myScore = score[myId] || 0;

  const toggleSelection = (index: number) => {
    if (!isMyTurn) return;
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectedDice = selectedIndices.map(i => dice[i]);
  const { score: potentialScore, usedCount } = calculateDiceScore(selectedDice);
  const isValidSelection = selectedDice.length > 0 && usedCount === selectedDice.length;
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-8 relative">
      <div className="glass-panel p-8 rounded-[2rem] border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">🎲 10,000 Dice Game</h2>
          <div className="flex justify-center items-center space-x-4 text-sm font-bold">
            <div className={`px-4 py-2 rounded-xl transition-all ${isMyTurn ? 'bg-[#967bb6] text-white' : 'bg-white/5 text-white/40'}`}>
              Player 1: {myScore} {isMyTurn && "⬅️"}
            </div>
            <div className={`px-4 py-2 rounded-xl transition-all ${!isMyTurn ? 'bg-[#967bb6] text-white' : 'bg-white/5 text-white/40'}`}>
              Player 2: {opponentScore} {!isMyTurn && "⬅️"}
            </div>
          </div>
        </div>

        {/* Saved Dice Display */}
        {savedDice.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="w-full text-[10px] font-black text-white/40 uppercase tracking-widest text-center mb-2">Saved Dice</p>
            {savedDice.map((val: number, i: number) => (
              <Die key={`saved-${i}`} value={val} isSelected={false} isSaved={true} onClick={() => {}} disabled={true} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-8 min-h-[80px]">
          {dice.length > 0 ? (
            dice.map((val: number, i: number) => (
              <Die 
                key={i} 
                value={val} 
                isSelected={selectedIndices.includes(i)} 
                isSaved={false} 
                onClick={() => toggleSelection(i)} 
                disabled={!isMyTurn} 
              />
            ))
          ) : (
            <div className="w-full h-20 flex items-center justify-center text-white/20 font-black uppercase tracking-widest border-2 border-dashed border-white/10 rounded-2xl">
              {isFirstRoll ? "Roll to start turn" : "Waiting..."}
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Turn Score</p>
            <p className="text-4xl font-black text-[#967bb6] tracking-tighter">
              {currentTurnScore + potentialScore}
            </p>
            {potentialScore > 0 && (
              <p className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">
                +{potentialScore} from selection
              </p>
            )}
          </div>
          {farkled && (
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-red-400 text-sm font-black mt-4 uppercase tracking-[0.2em] animate-pulse"
            >
              FARKLE!
            </motion.p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button 
            disabled={!isMyTurn || (!isFirstRoll && !isValidSelection)}
            onClick={() => onMove({ type: 'roll', selectedIndices })}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
              isMyTurn && (isFirstRoll || isValidSelection)
              ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {isFirstRoll ? "Roll Dice" : "Keep & Roll Again"}
          </button>
          <button 
            disabled={!isMyTurn || (currentTurnScore + potentialScore === 0) || (selectedDice.length > 0 && !isValidSelection)}
            onClick={() => onMove({ type: 'bank', selectedIndices })}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
              isMyTurn && (currentTurnScore + potentialScore > 0) && (selectedDice.length === 0 || isValidSelection)
              ? 'bg-[#967bb6] text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            Bank Points
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <details className="group">
            <summary className="text-xs font-black text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors list-none flex items-center justify-center space-x-2">
              <span>📜 Rules & Scoring</span>
              <motion.span animate={{ rotate: 0 }} className="group-open:rotate-180 transition-transform">▼</motion.span>
            </summary>
            <div className="mt-4 text-[10px] text-white/60 leading-relaxed space-y-2 font-medium bg-white/5 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <p>• Single 1: 100 pts</p>
                <p>• Single 5: 50 pts</p>
                <p>• Three 1s: 1000 pts</p>
                <p>• Three 2-6s: 100x val</p>
                <p>• Straight (1-6): 1500 pts</p>
                <p>• Three Pairs: 1500 pts</p>
              </div>
              <p className="border-t border-white/5 pt-2">• 4/5/6 of a kind: Double the 3-of-a-kind for each extra die.</p>
              <p>• Hot Dice: If all 6 dice score, you can roll them all again!</p>
              <p>• Farkle: If a roll has no scoring dice, you lose all points for that turn.</p>
            </div>
          </details>
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
      className="w-16 h-24 lg:w-20 lg:h-28 bg-white rounded-xl border-2 border-slate-200 shadow-2xl p-2 flex flex-col justify-between relative overflow-hidden"
    >
      <div className={`flex flex-col items-start ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <span className="text-sm lg:text-base font-black leading-none tracking-tighter">{value}</span>
        <SuitIcon size={12} strokeWidth={3} />
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center opacity-[0.05] ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <SuitIcon size={48} strokeWidth={1} />
      </div>

      <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <span className="text-sm lg:text-base font-black leading-none tracking-tighter">{value}</span>
        <SuitIcon size={12} strokeWidth={3} />
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
    <div className="h-full w-full flex flex-col items-center justify-center py-8 bg-[#0b1a12] text-white font-sans overflow-auto relative">
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
            <p className="text-xl font-black text-emerald-400 uppercase tracking-widest animate-bounce">
              Round Complete!
            </p>
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

const RummyCard: React.FC<{ 
  suit: string, 
  value: string, 
  hidden?: boolean, 
  selected?: boolean, 
  onClick?: () => void,
  className?: string,
  isSmall?: boolean,
  index?: number
}> = ({ suit, value, hidden, selected, onClick, className = "", isSmall, index = 0 }) => {
  if (hidden) {
    return (
      <motion.div 
        layout
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`${isSmall ? 'w-10 h-14' : 'w-16 h-24 lg:w-20 lg:h-28'} bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl border-2 border-[#967bb6]/30 shadow-2xl flex items-center justify-center relative overflow-hidden group ${className}`}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#967bb6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Logo size="sm" className="opacity-20 grayscale brightness-200 scale-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#967bb6] font-black text-xl opacity-40">?</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const isRed = suit === 'heart' || suit === 'diamond';
  const SuitIcon = suit === 'spade' ? Spade : suit === 'club' ? Club : suit === 'heart' ? Heart : Diamond;

  return (
    <motion.div 
      layout
      initial={{ y: 50, opacity: 0, rotate: -5 }}
      animate={{ 
        y: selected ? -20 : 0, 
        opacity: 1, 
        rotate: 0,
        scale: selected ? 1.05 : 1
      }}
      whileHover={onClick ? { y: selected ? -25 : -10, scale: 1.05, zIndex: 50 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`${isSmall ? 'w-10 h-14 p-1' : 'w-16 h-24 lg:w-20 lg:h-28 p-2'} bg-white rounded-xl border-2 shadow-2xl flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all duration-300 ${selected ? 'border-[#967bb6] ring-4 ring-[#967bb6]/30 z-50 shadow-[#967bb6]/40' : 'border-slate-200'} ${className}`}
    >
      <div className={`flex flex-col items-start ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <span className={`${isSmall ? 'text-[10px]' : 'text-sm lg:text-base'} font-black leading-none tracking-tighter`}>{value}</span>
        <SuitIcon size={isSmall ? 8 : 12} strokeWidth={3} />
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center opacity-[0.05] ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <SuitIcon size={isSmall ? 24 : 56} strokeWidth={1} />
      </div>

      <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-500' : 'text-slate-900'}`}>
        <span className={`${isSmall ? 'text-[10px]' : 'text-sm lg:text-base'} font-black leading-none tracking-tighter`}>{value}</span>
        <SuitIcon size={isSmall ? 8 : 12} strokeWidth={3} />
      </div>

      {/* Subtle texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
    </motion.div>
  );
};

const RummyGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { hands = {}, discardPile = [], melds = [], hasDrawn = false, score = {}, deckCount = 52 } = game.data;
  const hand = hands[myId] || [];
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Clear selection when hand changes (e.g., after a successful meld or discard)
  useEffect(() => {
    setSelectedCards([]);
  }, [hand.length]);

  const handleMove = (move: any) => {
    onMove(move);
    setSelectedCards([]);
    setLastAction(move.type);
    setTimeout(() => setLastAction(null), 2000);
  };

  const toggleCard = (index: number) => {
    setSelectedCards(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const opponent = game.players.find(p => p.id !== myId);
  const opponentId = opponent?.id || 'bot';
  const opponentHand = hands[opponentId] || [];
  const opponentHandCount = opponentHand.length;
  const opponentScore = score[opponentId] || 0;
  const myScore = score[myId] || 0;

  const isGameOver = game.status === 'finished';

  return (
    <div className="h-full flex flex-col items-center justify-between py-6 relative overflow-hidden w-full select-none">
      {/* Table Felt Background */}
      <div className="absolute inset-0 bg-[#0a3d1a] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {/* Table Border */}
        <div className="absolute inset-4 border-8 border-black/20 rounded-[3rem] pointer-events-none"></div>
      </div>

      {/* Header: Scores & Status */}
      <div className="relative z-10 w-full px-10 flex justify-between items-start">
        <div className="flex space-x-4">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`glass-panel px-6 py-3 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl flex items-center space-x-4 ${isMyTurn ? 'ring-2 ring-[#967bb6]/50' : ''}`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-[#967bb6] overflow-hidden">
              <img src={game.players.find(p => p.id === myId)?.avatar || ''} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-0.5">Your Score</p>
              <p className="text-2xl font-black text-white tracking-tighter leading-none">{myScore}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`glass-panel px-6 py-3 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl flex items-center space-x-4 ${!isMyTurn ? 'ring-2 ring-[#967bb6]/50' : ''}`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden">
              <img src={opponent?.avatar || ''} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-0.5">{opponent?.displayName || 'Opponent'}</p>
              <p className="text-2xl font-black text-white tracking-tighter leading-none">{opponentScore}</p>
            </div>
          </motion.div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleMove({ type: 'sort' })}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl group"
            title="Sort Hand"
          >
            <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#967bb6] hover:bg-[#967bb6] hover:text-white transition-all shadow-xl"
            title="How to Play"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              className="max-w-md w-full glass-panel p-8 rounded-[2.5rem] border-[#967bb6]/30 bg-black/90 backdrop-blur-2xl shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowInstructions(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center chrome-text">
                <Spade size={24} className="mr-3 text-[#967bb6]" />
                Rummy Rules
              </h4>
              <div className="space-y-4 text-sm text-slate-300 font-medium leading-relaxed">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#967bb6]/20 flex items-center justify-center text-[#967bb6] font-black text-[10px] shrink-0 mt-0.5">1</div>
                  <p><strong className="text-white">Draw:</strong> Start your turn by drawing from the Stock or Discard pile.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#967bb6]/20 flex items-center justify-center text-[#967bb6] font-black text-[10px] shrink-0 mt-0.5">2</div>
                  <p><strong className="text-white">Melds:</strong> Create sets (3+ cards of same rank) or runs (3+ cards of same suit in sequence).</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#967bb6]/20 flex items-center justify-center text-[#967bb6] font-black text-[10px] shrink-0 mt-0.5">3</div>
                  <p><strong className="text-white">Discard:</strong> End your turn by placing one card on the discard pile.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#967bb6]/20 flex items-center justify-center text-[#967bb6] font-black text-[10px] shrink-0 mt-0.5">4</div>
                  <p><strong className="text-white">Win:</strong> Empty your hand to win the round and collect points from your opponent's hand.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full mt-8 py-4 bg-[#967bb6] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#967bb6]/20 hover:scale-[1.02] transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opponent Area */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex -space-x-12 lg:-space-x-14 opacity-40 hover:opacity-100 transition-opacity duration-500">
          {isGameOver ? (
            opponentHand.map((card: any, i: number) => (
              <RummyCard key={i} suit={card.suit} value={card.value} isSmall className="scale-75" index={i} />
            ))
          ) : (
            Array.from({ length: opponentHandCount }).map((_, i) => (
              <RummyCard key={i} suit="" value="" hidden isSmall className="scale-75" index={i} />
            ))
          )}
        </div>
        <div className="mt-2 px-4 py-1 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
            {opponent?.displayName || 'Opponent'}'s Hand ({opponentHandCount})
          </p>
        </div>
      </div>
      
      {/* Table Melds Area */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-4 px-10">
        <div className="w-full flex flex-wrap justify-center gap-6 overflow-y-auto max-h-[180px] p-8 bg-black/20 rounded-[3rem] border border-white/5 shadow-inner backdrop-blur-sm custom-scrollbar">
          {melds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-20">
              <Layers size={32} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No melds on table</p>
            </div>
          ) : (
            melds.map((meld: any[], i: number) => (
              <motion.div 
                key={i} 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex -space-x-12 p-3 bg-white/5 rounded-2xl border border-white/10 scale-90 hover:scale-100 transition-transform shadow-2xl group relative"
              >
                <div className="absolute -top-2 -right-2 bg-[#967bb6] text-white text-[8px] font-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  MELD
                </div>
                {meld.map((card, j) => <RummyCard key={j} suit={card.suit} value={card.value} isSmall />)}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Center: Stock & Discard */}
      <div className="relative z-10 flex items-center space-x-24">
        <div className="text-center space-y-4">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -8 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn || isGameOver}
            onClick={() => handleMove({ type: 'draw' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn || isGameOver) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-8 bg-[#967bb6]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <RummyCard suit="" value="" hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl group-hover:scale-110 transition-transform">
                <Plus className="text-[#967bb6]" size={28} />
              </div>
            </div>
            {deckCount > 0 && (
              <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-[#967bb6] rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-2xl">
                {deckCount}
              </div>
            )}
          </motion.button>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Stock Pile</p>
        </div>

        <div className="text-center space-y-4">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -8 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn || isGameOver}
            onClick={() => handleMove({ type: 'draw_discard' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn || isGameOver) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-8 bg-[#967bb6]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {discardPile.length > 0 ? (
              <RummyCard suit={discardPile[discardPile.length-1].suit} value={discardPile[discardPile.length-1].value} />
            ) : (
              <div className="w-16 h-24 lg:w-20 lg:h-28 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
              </div>
            )}
            {discardPile.length > 0 && (
              <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-black/60 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-black text-white backdrop-blur-md">
                {discardPile.length}
              </div>
            )}
          </motion.button>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Discard Pile</p>
        </div>
      </div>

      {/* Player Hand & Controls */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-10 pb-6">
        <div className="relative group">
          <div className="flex -space-x-12 lg:-space-x-14 hover:-space-x-4 lg:hover:-space-x-6 transition-all duration-700 p-10 bg-black/30 rounded-[3.5rem] border border-white/10 backdrop-blur-xl max-w-full overflow-x-auto custom-scrollbar shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            {hand.length === 0 ? (
              <div className="w-64 h-28 flex items-center justify-center">
                <p className="text-xs font-black text-white/20 uppercase tracking-widest">Empty Hand</p>
              </div>
            ) : (
              hand.map((card: any, i: number) => (
                <RummyCard 
                  key={i} 
                  suit={card.suit} 
                  value={card.value} 
                  selected={selectedCards.includes(i)}
                  onClick={() => toggleCard(i)}
                  index={i}
                />
              ))
            )}
          </div>
          
          {/* Hand Info Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[#967bb6] rounded-full border-2 border-white shadow-xl z-50">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">
              Your Hand ({hand.length})
            </p>
          </div>
        </div>

        {isMyTurn && !isGameOver && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className="flex space-x-4">
              <button 
                disabled={selectedCards.length === 0}
                onClick={() => setSelectedCards([])}
                className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all disabled:opacity-30 flex items-center space-x-2"
              >
                <X size={14} />
                <span>Clear Selection</span>
              </button>
              
              <button 
                disabled={!hasDrawn || selectedCards.length < 3}
                onClick={() => handleMove({ type: 'meld', indices: selectedCards })}
                className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center space-x-2"
              >
                <Layers size={18} />
                <span>Meld Selected</span>
              </button>
              
              <button 
                disabled={!hasDrawn || selectedCards.length !== 1}
                onClick={() => handleMove({ type: 'discard', index: selectedCards[0] })}
                className="px-12 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center space-x-2"
              >
                <Send size={18} />
                <span>Discard</span>
              </button>
            </div>
            
            <div className="px-8 py-3 bg-black/60 rounded-full border border-[#967bb6]/30 backdrop-blur-xl shadow-2xl">
              <p className="text-xs font-black text-[#967bb6] uppercase tracking-[0.3em] animate-pulse">
                {hasDrawn ? 'Select 1 card to discard or meld' : 'Draw from Stock or Discard Pile'}
              </p>
            </div>
          </motion.div>
        )}

        {!isMyTurn && !isGameOver && (
          <div className="px-10 py-4 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">
              Waiting for {opponent?.displayName || 'Opponent'}...
            </p>
          </div>
        )}
      </div>

      {/* Action Feedback */}
      <AnimatePresence>
        {lastAction && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 0 }}
            animate={{ scale: 1.5, opacity: 1, y: -100 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          >
            <span className="text-4xl font-black text-white uppercase tracking-tighter chrome-text drop-shadow-2xl">
              {lastAction === 'draw' ? 'DRAW!' : lastAction === 'meld' ? 'MELD!' : lastAction === 'discard' ? 'DISCARD!' : 'SORTED!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BilliardsGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiming, setAiming] = useState(false);
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(50);
  const [lastMousePos, setLastMousePos] = useState<{ x: number, y: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Physics state in refs for smooth animation
  const ballsRef = useRef<any[]>([]);
  const cueBallRef = useRef<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  const FRICTION = 0.985;
  const WALL_BOUNCE = 0.6;
  const BALL_BOUNCE = 0.95;
  const BALL_RADIUS = 12;
  const POCKET_RADIUS = 22;
  const WIDTH = 800;
  const HEIGHT = 400;

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
    if (!isSimulating) {
      ballsRef.current = JSON.parse(JSON.stringify(game.data.balls));
      cueBallRef.current = JSON.parse(JSON.stringify(game.data.cueBall));
    }
  }, [game.data.balls, game.data.cueBall, isSimulating]);

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
    
    // Calculate velocity based on aim angle and power
    const powerScale = power * 0.15; // Adjusted for better feel
    const dx = Math.cos(aimAngle) * powerScale;
    const dy = Math.sin(aimAngle) * powerScale;

    // Start local simulation
    cueBallRef.current.vx = dx;
    cueBallRef.current.vy = dy;
    isSimulatingRef.current = true;
    setIsSimulating(true);

    // Send move to server
    onMove({ type: 'shoot', dx: dx * 10, dy: dy * 10 }); // Multiply back for server compatibility
    
    // Reset power after shot
    setPower(20);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || isSimulatingRef.current || !canvasRef.current || !cueBallRef.current) return;
    const mouse = getMouse(e, canvasRef.current);
    const dx = mouse.x - cueBallRef.current.x;
    const dy = mouse.y - cueBallRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // If tapping near cue ball, shoot
    if (dist < BALL_RADIUS * 3) {
      handleShoot();
    } else {
      // Otherwise, start aiming
      setAiming(true);
      setLastMousePos(mouse);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!aiming || !canvasRef.current || !lastMousePos) return;
    const mouse = getMouse(e, canvasRef.current);
    
    // Aiming logic: horizontal movement rotates the aim
    // We use a sensitivity factor to make it feel smooth
    const sensitivity = 0.005;
    const deltaX = mouse.x - lastMousePos.x;
    setAimAngle(prev => prev + deltaX * sensitivity);
    setLastMousePos(mouse);
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

    const drawBall = (ball: any) => {
      if (!ball.active) return;
      
      // Shadow
      ctx.beginPath();
      ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Ball body
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();

      // Number/Stripe for non-cue balls
      if (ball.type !== 'cue') {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        if (ball.type === 'stripe') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = 'white';
          ctx.fillRect(ball.x - BALL_RADIUS, ball.y - BALL_RADIUS * 0.4, BALL_RADIUS * 2, BALL_RADIUS * 0.8);
          ctx.restore();
          
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }

        ctx.fillStyle = 'black';
        ctx.font = `bold ${BALL_RADIUS * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.id.toString(), ball.x, ball.y);
      }

      // Highlight
      const gradient = ctx.createRadialGradient(
        ball.x - BALL_RADIUS * 0.3, 
        ball.y - BALL_RADIUS * 0.3, 
        BALL_RADIUS * 0.1,
        ball.x, 
        ball.y, 
        BALL_RADIUS
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const updatePhysics = () => {
      if (!isSimulatingRef.current) return false;

      const allBalls = [cueBallRef.current, ...ballsRef.current];
      let moving = false;

      allBalls.forEach(ball => {
        if (!ball.active) return;
        
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;

        if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05) {
          ball.vx = 0;
          ball.vy = 0;
        }

        if (ball.vx !== 0 || ball.vy !== 0) moving = true;

        if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx *= -WALL_BOUNCE; }
        if (ball.x > WIDTH - BALL_RADIUS) { ball.x = WIDTH - BALL_RADIUS; ball.vx *= -WALL_BOUNCE; }
        if (ball.y < BALL_RADIUS) { ball.y = BALL_RADIUS; ball.vy *= -WALL_BOUNCE; }
        if (ball.y > HEIGHT - BALL_RADIUS) { ball.y = HEIGHT - BALL_RADIUS; ball.vy *= -WALL_BOUNCE; }

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

      for (let i = 0; i < allBalls.length; i++) {
        for (let j = i + 1; j < allBalls.length; j++) {
          const b1 = allBalls[i];
          const b2 = allBalls[j];
          if (!b1.active || !b2.active) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < BALL_RADIUS * 2) {
            const nx = dx / dist;
            const ny = dy / dist;
            const rvx = b1.vx - b2.vx;
            const rvy = b1.vy - b2.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            
            if (velAlongNormal < 0) {
              const impulse = -(1 + BALL_BOUNCE) * velAlongNormal / 2;
              const impulseX = impulse * nx;
              const impulseY = impulse * ny;
              
              b1.vx += impulseX;
              b1.vy += impulseY;
              b2.vx -= impulseX;
              b2.vy -= impulseY;
            }
            
            const overlap = BALL_RADIUS * 2 - dist;
            b1.x -= nx * overlap / 2;
            b1.y -= ny * overlap / 2;
            b2.x += nx * overlap / 2;
            b2.y += ny * overlap / 2;
            
            moving = true;
          }
        }
      }

      if (!moving) {
        isSimulatingRef.current = false;
        setIsSimulating(false);
      }
      return moving;
    };

    const draw = () => {
      updatePhysics();

      // Table Felt
      const feltGradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 0, WIDTH/2, HEIGHT/2, WIDTH);
      feltGradient.addColorStop(0, '#27ae60');
      feltGradient.addColorStop(1, '#1e8449');
      ctx.fillStyle = feltGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Table Markings
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(WIDTH * 0.25, 0);
      ctx.lineTo(WIDTH * 0.25, HEIGHT);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(WIDTH * 0.25, HEIGHT/2, 40, -Math.PI/2, Math.PI/2);
      ctx.stroke();

      // Draw pockets
      pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        const grad = ctx.createRadialGradient(p.x, p.y, POCKET_RADIUS * 0.7, p.x, p.y, POCKET_RADIUS);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Draw balls
      if (cueBallRef.current) drawBall(cueBallRef.current);
      ballsRef.current.forEach(drawBall);

      // Draw aiming line
      if (isMyTurn && cueBallRef.current && !isSimulatingRef.current) {
        // Aim line
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cueBallRef.current.x, cueBallRef.current.y);
        
        let aimX = cueBallRef.current.x;
        let aimY = cueBallRef.current.y;
        const stepX = Math.cos(aimAngle) * 2;
        const stepY = Math.sin(aimAngle) * 2;
        
        for (let i = 0; i < 600; i++) {
          aimX += stepX;
          aimY += stepY;
          if (aimX < BALL_RADIUS || aimX > WIDTH - BALL_RADIUS || aimY < BALL_RADIUS || aimY > HEIGHT - BALL_RADIUS) break;
          let hitBall = false;
          for (const ball of ballsRef.current) {
            if (!ball.active) continue;
            const bdx = ball.x - aimX;
            const bdy = ball.y - aimY;
            if (Math.sqrt(bdx * bdx + bdy * bdy) < BALL_RADIUS * 2) {
              hitBall = true;
              break;
            }
          }
          if (hitBall) break;
        }
        
        ctx.lineTo(aimX, aimY);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Ghost ball
        ctx.beginPath();
        ctx.arc(aimX, aimY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();

        // Cue stick
        const cueLen = 300;
        const cueOffset = 25 + (power * 0.5);
        const cueX = cueBallRef.current.x - Math.cos(aimAngle) * cueOffset;
        const cueY = cueBallRef.current.y - Math.sin(aimAngle) * cueOffset;
        const cueEndX = cueBallRef.current.x - Math.cos(aimAngle) * (cueOffset + cueLen);
        const cueEndY = cueBallRef.current.y - Math.sin(aimAngle) * (cueOffset + cueLen);

        const cueGrad = ctx.createLinearGradient(cueX, cueY, cueEndX, cueEndY);
        cueGrad.addColorStop(0, '#f3e5ab');
        cueGrad.addColorStop(0.1, '#d4a017');
        cueGrad.addColorStop(0.8, '#5a3e1b');
        cueGrad.addColorStop(1, '#3d2b1f');

        ctx.beginPath();
        ctx.moveTo(cueX, cueY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.strokeStyle = cueGrad;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isMyTurn, aimAngle, power, pockets]);

  const myType = game.data.playerTypes[myId];

  return (
    <div className="h-full flex flex-col items-center justify-between py-4 relative overflow-hidden bg-[#0a2e1a]">
      {/* Header */}
      <div className="relative z-10 w-full px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Target className="text-emerald-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Pro 8-Ball</h2>
            <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Master Series</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
            <div className={`w-3 h-3 rounded-full ${myType === 'solid' ? 'bg-[#e74c3c]' : myType === 'stripe' ? 'bg-[#f1c40f]' : 'bg-slate-600'}`}></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {myType ? `${myType}s` : 'Unassigned'}
            </span>
          </div>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10 transition-all shadow-xl"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-24 right-8 z-50 w-72 glass-panel p-6 rounded-2xl border-emerald-500/30 bg-black/90 backdrop-blur-xl shadow-2xl"
          >
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-emerald-400" />
              8-Ball Rules
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-3 font-medium leading-relaxed">
              <li>• <span className="text-emerald-400 font-bold">Aim:</span> Drag anywhere on the table to rotate the aim line.</li>
              <li>• <span className="text-emerald-400 font-bold">Power:</span> Use the slider on the right to set shot strength.</li>
              <li>• <span className="text-emerald-400 font-bold">Shoot:</span> Tap the white cue ball to strike.</li>
              <li>• <span className="text-emerald-400 font-bold">Goal:</span> Pot all your balls then the 8-ball to win.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-[950px] flex items-center justify-center px-12">
        {/* Power Meter (Left Side) */}
        {isMyTurn && !isSimulating && (
          <div className="absolute left-0 h-80 flex flex-col items-center space-y-4">
            <div className="h-full w-12 bg-black/60 rounded-3xl border-2 border-white/10 relative overflow-hidden flex flex-col-reverse shadow-2xl">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${power}%` }}
                className="w-full bg-gradient-to-t from-red-600 via-yellow-500 to-emerald-500 transition-all duration-100"
              ></motion.div>
              
              {/* Power Marks */}
              <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-full h-[1px] bg-white"></div>
                ))}
              </div>

              <input 
                type="range"
                min="5"
                max="100"
                step="1"
                value={power}
                onChange={(e) => setPower(parseInt(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer [writing-mode:bt-lr] appearance-slider-vertical w-full h-full"
                style={{ transform: 'rotate(-90deg)', width: '320px', height: '48px', position: 'absolute', top: '136px', left: '-136px' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <Zap className="text-yellow-400 mb-1" size={16} />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Power</span>
              <span className="text-lg font-black text-white leading-none mt-1">{power}%</span>
            </div>
          </div>
        )}

        <div 
          className="relative group p-6 bg-[#3d2b1f] rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.7)] border-b-8 border-[#2c1e15]"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleMouseMove}
        >
          {/* Table Frame Details */}
          <div className="absolute inset-0 border-[20px] border-[#4e3629] rounded-[3rem] pointer-events-none"></div>
          <div className="absolute inset-5 border-2 border-[#2c1e15] rounded-[2.5rem] pointer-events-none"></div>
          
          {/* Diamond Markings on rails */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex space-x-20 opacity-30">
            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-white rotate-45"></div>)}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-20 opacity-30">
            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-white rotate-45"></div>)}
          </div>
          
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="w-full bg-[#27ae60] rounded-[2rem] cursor-crosshair shadow-inner"
          />
          
          <div className="absolute inset-6 pointer-events-none rounded-[2rem] shadow-[inset_0_0_60px_rgba(0,0,0,0.7)]"></div>

          {/* Aiming Hint */}
          {isMyTurn && !isSimulating && !aiming && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
                Drag to Aim • Tap Ball to Shoot
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="glass-panel px-10 py-4 rounded-[2rem] border-white/10 bg-black/40 backdrop-blur-md text-center shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">
            {isMyTurn ? "Your Shot" : "Opponent's Turn"}
          </p>
          <p className={`text-sm font-black uppercase tracking-widest transition-colors ${isMyTurn ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isMyTurn ? (isSimulating ? "Ball in Motion" : "Tap Cue Ball to Shoot") : "Waiting for move..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
