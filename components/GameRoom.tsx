
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dices, Users, User as UserIcon, Bot, Play, CheckCircle2, 
  X, ChevronLeft, Trophy, MessageSquare, Send,
  Circle, Square, Layers, Spade, Club, Heart, Diamond,
  Target, Zap, Flame, Sparkles, Info, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    if (!socket) return;

    socket.on('game:invite', (invite: GameInvite) => {
      setInvites(prev => [...prev, invite]);
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
      socket.off('game:invite');
      socket.off('game:started');
      socket.off('game:updated');
      socket.off('game:ended');
    };
  }, [socket, activeGame]);

  const sendInvite = (receiverId: string, gameType: GameType) => {
    if (!socket) return;
    socket.emit('game:invite_send', { receiverId, gameType });
    setShowInviteModal(false);
  };

  const acceptInvite = (invite: GameInvite) => {
    if (!socket) return;
    socket.emit('game:invite_accept', { inviteId: invite.id });
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  };

  const playWithBot = (gameType: GameType) => {
    if (!socket) return;
    socket.emit('game:bot_start', { gameType });
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
          { id: 'billiards', label: 'Billiards', icon: Circle, color: 'from-purple-500/20 to-black', desc: 'Sink the balls. Master the table.' }
        ].map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedGameType(game.id as GameType);
              setShowInviteModal(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedGameType(game.id as GameType);
                setShowInviteModal(true);
              }
            }}
            className={`relative group h-64 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br ${game.color} p-8 text-left transition-all hover:border-[#967bb6]/50 shadow-2xl cursor-pointer`}
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
                <div className="flex items-center space-x-2 text-[#967bb6] font-black text-[10px] uppercase tracking-widest">
                  <span>Play Now</span>
                  <ChevronLeft className="rotate-180" size={14} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playWithBot(game.id as GameType);
                  }}
                  className="px-3 py-1 bg-[#967bb6]/20 text-[#967bb6] rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#967bb6] hover:text-white transition-all border border-[#967bb6]/30"
                >
                  Vs BareBear
                </button>
              </div>
            </div>
          </motion.div>
        ))}
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
                    onClick={() => setInvites(prev => prev.filter(i => i.id !== invite.id))}
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

  const renderInviteModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel rounded-[2.5rem] p-8 border-[#c0c0c0]/20 shadow-2xl chrome-border"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase chrome-text">Select Opponent</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">For {selectedGameType}</p>
          </div>
          <button onClick={() => setShowInviteModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <button 
            onClick={() => playWithBot(selectedGameType!)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#967bb6]/20 to-transparent border border-[#967bb6]/30 hover:border-[#967bb6] transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#967bb6]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="text-[#967bb6]" size={24} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-white uppercase tracking-tight">BareBear</p>
                <p className="text-[10px] text-[#967bb6] font-bold uppercase tracking-widest">Always Ready</p>
              </div>
            </div>
            <Play size={20} className="text-[#967bb6]" />
          </button>

          <div className="h-px bg-white/5 my-4"></div>

          {users.filter(u => u.id !== user.id).map(u => (
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
              <Users size={20} className="text-slate-500 group-hover:text-[#967bb6] transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const [showRules, setShowRules] = useState(false);

  const getRules = (type: GameType) => {
    switch (type) {
      case 'checkers': return "Move diagonally forward. Jump opponent pieces to capture. Reach the other side to become a King and move backwards.";
      case '10000': return "Roll 6 dice. 1s=100, 5s=50. Three of a kind = 100 * value (1s=1000). Straight=1500. Must score 500 to bank first time. First to 10,000 wins.";
      case 'blackjack': return "Get closer to 21 than the dealer without going over. Aces are 1 or 11. Face cards are 10. Dealer hits until 17.";
      case 'rummy': return "Form sets (3+ of same rank) or runs (3+ of same suit in sequence). Draw from deck or discard. Discard one card to end turn. Empty hand to win.";
      case 'billiards': return "Pocket all your balls (solids or stripes) and then the 8-ball to win. Don't pocket the 8-ball early!";
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
            <div className={`flex flex-col items-center space-y-2 ${activeGame.turn === me?.id ? 'scale-110' : 'opacity-50'}`}>
              <div className={`w-12 h-12 rounded-2xl border-2 p-0.5 transition-all ${activeGame.turn === me?.id ? 'border-[#967bb6] shadow-[0_0_15px_rgba(150,123,182,0.5)]' : 'border-transparent'}`}>
                <img src={me?.avatar || undefined} className="w-full h-full rounded-xl object-cover" alt="" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">You</span>
                {activeGame.type === 'billiards' && activeGame.data.playerType?.[user.id] && (
                  <span className="text-[8px] font-bold text-[#967bb6] uppercase tracking-tighter">{activeGame.data.playerType[user.id]}s</span>
                )}
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
                {activeGame.type === 'billiards' && activeGame.data.playerType?.[opponent?.id || 'bot'] && (
                  <span className="text-[8px] font-bold text-[#967bb6] uppercase tracking-tighter">{activeGame.data.playerType[opponent?.id || 'bot']}s</span>
                )}
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
              <div className="flex items-center space-x-2 text-slate-500">
                <Sparkles size={16} className="text-[#967bb6]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Themed Visuals Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      {activeGame ? renderGameUI() : renderGameSelection()}
      {showInviteModal && renderInviteModal()}
    </div>
  );
};

// --- Game Specific Components ---

const CheckersGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const board = game.data.board || [];
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const handleClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    
    const piece = board[r][c];
    const myColor = game.players[0].id === myId ? 1 : 2;

    if (selected) {
      if (selected[0] === r && selected[1] === c) {
        setSelected(null);
      } else {
        onMove({ from: selected, to: [r, c] });
        setSelected(null);
      }
    } else if (piece && Math.floor(piece) === myColor) {
      setSelected([r, c]);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="relative p-4 rounded-2xl bg-[#3d2b1f] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-[#2a1d15]">
        {/* Wood Texture Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] rounded-lg"></div>
        
        <div className="grid grid-cols-8 gap-0 border-4 border-[#1a110a] shadow-inner">
          {board.map((row: any[], r: number) => row.map((cell: number, c: number) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={`w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center transition-all cursor-pointer relative ${
                  isDark ? 'bg-[#5d4037]' : 'bg-[#d7ccc8]'
                } ${isSelected ? 'ring-4 ring-inset ring-[#967bb6] z-10' : ''}`}
              >
                {cell !== 0 && (
                  <motion.div 
                    layoutId={`piece-${r}-${c}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`w-8 h-8 lg:w-11 lg:h-11 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.4)] flex items-center justify-center relative overflow-hidden transition-transform ${
                      Math.floor(cell) === 1 
                      ? 'bg-gradient-to-br from-red-500 to-red-800 border-2 border-red-400/30' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-400 border-2 border-white/40'
                    } ${isSelected ? '-translate-y-2 scale-110' : ''}`}
                  >
                    {/* Concentric circles for classic checker look */}
                    <div className="absolute inset-1 rounded-full border border-black/10"></div>
                    <div className="absolute inset-2 rounded-full border border-black/10"></div>
                    
                    {cell > 2 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Trophy size={16} className="text-amber-400 drop-shadow-md" />
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

const Die: React.FC<{ value: number; isSelected: boolean; onClick: () => void; disabled: boolean }> = ({ value, isSelected, onClick, disabled }) => {
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
      whileHover={!disabled ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center shadow-2xl cursor-pointer transition-all relative ${
        isSelected 
        ? 'bg-[#967bb6] border-4 border-white/40 -translate-y-4' 
        : 'bg-white border-2 border-slate-200'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-3/4 h-3/4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[value].includes(i) && (
              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-black'}`} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const DiceGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { dice = [1, 2, 3, 4, 5, 6], score = {}, currentTurnScore = 0, savedDice = [], canBank = false } = game.data;
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-8 relative">
      {/* Green Felt Backdrop */}
      <div className="absolute inset-0 bg-[#1a472a] opacity-40 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
      
      <div className="relative z-10 w-full flex flex-col items-center space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text mb-2">10,000</h2>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">The High Stakes Dice Game</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-4">
          {dice.map((d: number, i: number) => (
            <Die 
              key={i} 
              value={d} 
              isSelected={savedDice.includes(i)} 
              onClick={() => onMove({ type: 'toggle_dice', index: i })}
              disabled={!isMyTurn}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-md px-4">
          <div className="glass-panel p-6 rounded-3xl border-white/10 text-center bg-black/40 backdrop-blur-md">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Score</p>
            <p className="text-4xl font-black text-white tracking-tighter">{score[myId] || 0}</p>
          </div>
          <div className="glass-panel p-6 rounded-3xl border-[#967bb6]/20 text-center bg-black/40 backdrop-blur-md">
            <p className="text-[10px] font-black text-[#967bb6] uppercase tracking-widest mb-1">Current Turn</p>
            <p className="text-4xl font-black text-[#967bb6] tracking-tighter">{currentTurnScore || 0}</p>
          </div>
        </div>
      </div>

      {isMyTurn && (
        <div className="relative z-10 flex space-x-6">
          <button 
            onClick={() => onMove({ type: 'roll' })}
            className="group relative px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#967bb6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center space-x-2">
              <Dices size={20} />
              <span>Roll Dice</span>
            </span>
          </button>
          <button 
            disabled={!canBank || currentTurnScore === 0}
            onClick={() => onMove({ type: 'bank' })}
            className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all ${
              canBank && currentTurnScore > 0
              ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-105 active:scale-95' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            Bank Points
          </button>
        </div>
      )}
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

const Card: React.FC<{ suit: string, value: string, hidden?: boolean }> = ({ suit, value, hidden }) => {
  const isRed = suit === 'heart' || suit === 'diamond';
  const SuitIcon = suit === 'spade' ? Spade : suit === 'club' ? Club : suit === 'heart' ? Heart : Diamond;

  if (hidden) {
    return (
      <div className="w-20 h-28 lg:w-24 lg:h-36 bg-gradient-to-br from-[#967bb6] to-[#6b46c1] rounded-xl border-2 border-white/20 shadow-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-4 gap-2 p-2">
            {Array(12).fill(0).map((_, i) => <Flame key={i} size={12} />)}
          </div>
        </div>
        <Sparkles className="text-white/40" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      className="w-20 h-28 lg:w-24 lg:h-36 bg-white rounded-xl border-2 border-white/20 shadow-2xl p-2 flex flex-col justify-between relative overflow-hidden"
    >
      <div className={`flex flex-col items-start ${isRed ? 'text-red-500' : 'text-black'}`}>
        <span className="text-lg font-black leading-none">{value}</span>
        <SuitIcon size={14} />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <SuitIcon size={48} />
      </div>

      <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-500' : 'text-black'}`}>
        <span className="text-lg font-black leading-none">{value}</span>
        <SuitIcon size={14} />
      </div>
    </motion.div>
  );
};

const BlackjackGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { playerHand, dealerHand, status } = game.data;
  
  return (
    <div className="h-full flex flex-col items-center justify-between py-8 relative">
      {/* Table Felt */}
      <div className="absolute inset-0 bg-[#076324] opacity-40 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
      
      {/* Dealer Hand */}
      <div className="relative z-10 space-y-4 text-center">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.3em]">Dealer's Hand</p>
          {status !== 'playing' && (
            <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10">
              <span className="text-xs font-black text-white">{getBlackjackValue(dealerHand)}</span>
            </div>
          )}
        </div>
        <div className="flex -space-x-12 lg:-space-x-16">
          {dealerHand.map((card: any, i: number) => (
            <Card key={i} suit={card.suit} value={card.value} hidden={i === 0 && status === 'playing'} />
          ))}
        </div>
      </div>

      {/* Center Chips Visual */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Place Bets</p>
            <Sparkles className="text-white/10 mx-auto mt-1" size={20} />
          </div>
        </div>
      </div>

      {/* Player Hand */}
      <div className="relative z-10 space-y-4 text-center">
        <div className="flex -space-x-12 lg:-space-x-16">
          {playerHand.map((card: any, i: number) => (
            <Card key={i} suit={card.suit} value={card.value} />
          ))}
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="px-3 py-1 bg-[#967bb6]/20 rounded-full border border-[#967bb6]/30">
            <span className="text-xs font-black text-white">{getBlackjackValue(playerHand)}</span>
          </div>
          <p className="text-[10px] font-black text-[#967bb6] uppercase tracking-[0.3em]">Your Hand</p>
        </div>
      </div>

      {isMyTurn && status === 'playing' && (
        <div className="relative z-10 flex space-x-6">
          <button 
            onClick={() => onMove({ type: 'hit' })}
            className="group relative px-12 py-4 bg-[#967bb6] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#967bb6]/30 hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Hit</span>
          </button>
          <button 
            onClick={() => onMove({ type: 'stand' })}
            className="px-12 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
          >
            Stand
          </button>
        </div>
      )}
    </div>
  );
};

const RummyGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { hand, discardPile, melds, hasDrawn } = game.data;
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setSelectedCards(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="h-full flex flex-col items-center justify-between py-4 relative">
      {/* Table Felt */}
      <div className="absolute inset-0 bg-[#1a2a3a] opacity-40 mix-blend-overlay pointer-events-none"></div>
      
      {/* Melds Area */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Table Melds</p>
        <div className="w-full flex flex-wrap justify-center gap-4 overflow-y-auto max-h-[120px] p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
          {melds.length === 0 && <p className="text-[10px] text-white/10 italic">No melds on table</p>}
          {melds.map((meld: any[], i: number) => (
            <div key={i} className="flex -space-x-12 p-2 bg-white/5 rounded-xl border border-white/10 scale-75 hover:scale-90 transition-transform">
              {meld.map((card, j) => <Card key={j} suit={card.suit} value={card.value} />)}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Draw & Discard */}
      <div className="relative z-10 flex items-center space-x-16">
        <div className="text-center space-y-3">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -5 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn}
            onClick={() => onMove({ type: 'draw' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-2 bg-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Card suit="" value="" hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="text-white/20" size={32} />
            </div>
          </motion.button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Draw Pile</p>
        </div>

        <div className="text-center space-y-3">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -5 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn}
            onClick={() => onMove({ type: 'draw_discard' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-2 bg-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {discardPile.length > 0 ? (
              <Card suit={discardPile[discardPile.length-1].suit} value={discardPile[discardPile.length-1].value} />
            ) : (
              <div className="w-20 h-28 lg:w-24 lg:h-36 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
              </div>
            )}
          </motion.button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Discard Pile</p>
        </div>
      </div>

      {/* Player Hand */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-6">
        <div className="flex -space-x-12 lg:-space-x-16 hover:-space-x-8 lg:hover:-space-x-12 transition-all duration-500 p-4">
          {hand.map((card: any, i: number) => (
            <div 
              key={i} 
              onClick={() => toggleCard(i)}
              className={`transition-all duration-300 cursor-pointer ${selectedCards.includes(i) ? '-translate-y-12 scale-110 z-50' : 'hover:-translate-y-4'}`}
            >
              <Card suit={card.suit} value={card.value} />
            </div>
          ))}
        </div>

        {isMyTurn && (
          <div className="flex space-x-4">
            {selectedCards.length > 0 && (
              <>
                <button 
                  disabled={selectedCards.length < 3}
                  onClick={() => {
                    onMove({ type: 'meld', indices: selectedCards });
                    setSelectedCards([]);
                  }}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  Meld
                </button>
                {selectedCards.length === 1 && (
                  <button 
                    disabled={!hasDrawn}
                    onClick={() => {
                      onMove({ type: 'discard', index: selectedCards[0] });
                      setSelectedCards([]);
                    }}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Discard
                  </button>
                )}
              </>
            )}
            <p className="text-[10px] font-black text-[#967bb6] uppercase tracking-[0.3em] self-center">
              {hasDrawn ? 'Select card to discard' : 'Draw a card to begin'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const BilliardsGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { balls, cueBall, power, angle, pocketed } = game.data;
  
  return (
    <div className="h-full flex flex-col items-center justify-center py-4 relative">
      {/* Table Felt Background */}
      <div className="absolute inset-0 bg-[#0a3d1a] opacity-20 pointer-events-none"></div>
      
      <div className="relative w-full max-w-3xl aspect-[2/1] bg-[#0a5c2a] rounded-[3rem] border-[16px] border-[#3d2b1f] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-visible">
        {/* Table Rail Inner Shadow */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] rounded-[2rem] pointer-events-none"></div>
        
        {/* Pockets */}
        {[
          { top: '-2%', left: '-2%' },
          { top: '-4%', left: '50%', transform: 'translateX(-50%)' },
          { top: '-2%', right: '-2%' },
          { bottom: '-2%', left: '-2%' },
          { bottom: '-4%', left: '50%', transform: 'translateX(-50%)' },
          { bottom: '-2%', right: '-2%' }
        ].map((style, i) => (
          <div 
            key={i} 
            style={style}
            className="absolute w-14 h-14 bg-[#050505] rounded-full shadow-[inset_0_4px_10px_rgba(255,255,255,0.1)] z-20"
          />
        ))}

        {/* Aiming Line */}
        {isMyTurn && (
          <div 
            className="absolute h-0.5 bg-white/20 border-t border-dashed border-white/40 origin-left z-10 pointer-events-none"
            style={{ 
              left: `${cueBall.x}%`, 
              top: `${cueBall.y}%`,
              width: '1000px',
              transform: `rotate(${angle}deg)`
            }}
          />
        )}

        {/* Balls */}
        {balls.map((ball: any, i: number) => (
          <motion.div 
            key={i}
            animate={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            className={`absolute w-7 h-7 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.4)] flex items-center justify-center text-[10px] font-black z-30 ${
              ball.type === 'solid' ? 'bg-blue-600' : ball.type === 'black' ? 'bg-black' : 'bg-amber-400'
            } border border-white/20 overflow-hidden`}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent"></div>
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black shadow-inner">
              {ball.number}
            </div>
          </motion.div>
        ))}

        {/* Cue Ball */}
        <motion.div 
          animate={{ left: `${cueBall.x}%`, top: `${cueBall.y}%` }}
          className="absolute w-7 h-7 rounded-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.4)] border border-black/10 z-30 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-slate-300"></div>
          <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60 blur-[1px]"></div>
        </motion.div>

        {/* Cue Stick */}
        {isMyTurn && (
          <motion.div 
            className="absolute w-2 h-64 bg-gradient-to-b from-[#3d2b1f] via-[#8b5e3c] to-[#d4a373] origin-bottom z-40 rounded-full shadow-2xl"
            style={{ 
              left: `${cueBall.x}%`, 
              top: `${cueBall.y}%`,
              transform: `translate(-50%, -100%) translateY(-20px) rotate(${angle}deg)`
            }}
            animate={{ translateY: `-${20 + (power / 2)}px` }}
          />
        )}
      </div>

      {/* Pocketed Balls Display */}
      <div className="mt-12 flex flex-col items-center space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pocketed</p>
        <div className="flex flex-wrap justify-center gap-2 p-3 bg-black/20 rounded-2xl border border-white/5">
          {pocketed.length === 0 && <p className="text-[8px] text-white/10 italic">No balls pocketed yet</p>}
          {pocketed.map((ball: any, i: number) => (
            <div 
              key={i}
              className={`w-5 h-5 rounded-full shadow-lg ${
                ball.type === 'solid' ? 'bg-blue-600' : ball.type === 'black' ? 'bg-black' : 'bg-amber-400'
              } border border-white/10`}
            />
          ))}
        </div>
      </div>

      {isMyTurn && (
        <div className="mt-8 flex flex-col items-center space-y-6 w-full max-w-lg px-8">
          <div className="w-full space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aim Angle</p>
              </div>
              <span className="text-sm font-black text-[#967bb6] bg-[#967bb6]/10 px-3 py-1 rounded-lg border border-[#967bb6]/20">{angle}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={angle} 
              onChange={(e) => onMove({ type: 'aim', angle: parseInt(e.target.value) })}
              className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#967bb6]"
            />
          </div>

          <div className="w-full space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shot Power</p>
              <span className="text-sm font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20">{power}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={power} 
              onChange={(e) => onMove({ type: 'power', power: parseInt(e.target.value) })}
              className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <button 
            onClick={() => onMove({ type: 'shoot' })}
            className="w-full py-4 bg-gradient-to-r from-[#967bb6] to-[#7b619a] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#967bb6]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Take Shot
          </button>
        </div>
      )}
    </div>
  );
};

export default GameRoom;
