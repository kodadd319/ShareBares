
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

    socket.on('game:invite_received', (invite: GameInvite) => {
      setInvites(prev => [...prev, invite]);
    });

    socket.on('game:invite_declined', (data: { inviteId: string }) => {
      // Handle declined invite if needed (e.g., show a toast)
      console.log(`Invite ${data.inviteId} was declined`);
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
    setShowInviteModal(false);
  };

  const acceptInvite = (invite: GameInvite) => {
    if (!socket) return;
    socket.emit('game:invite_accept', { inviteId: invite.id, user: { id: user.id, displayName: user.displayName, avatar: user.avatar } });
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  };

  const declineInvite = (invite: GameInvite) => {
    if (!socket) return;
    socket.emit('game:invite_decline', { inviteId: invite.id });
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
              {/* Themed visuals indicator removed as per user request */}
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

const calculateDiceScore = (dice: number[]) => {
  const counts: Record<number, number> = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  
  let score = 0;
  let usedCount = 0;

  // Special cases: Straight
  if (Object.keys(counts).length === 6) return { score: 1500, usedCount: 6 };
  
  // Three pairs
  let pairs = 0;
  Object.values(counts).forEach(c => { if (c === 2) pairs++; });
  if (pairs === 3) return { score: 1500, usedCount: 6 };

  // 1s
  if (counts[1] >= 3) {
    score += 1000 * Math.pow(2, counts[1] - 3);
    usedCount += counts[1];
  } else {
    score += (counts[1] || 0) * 100;
    usedCount += (counts[1] || 0);
  }

  // 5s
  if (counts[5] >= 3) {
    score += 500 * Math.pow(2, counts[5] - 3);
    usedCount += counts[5];
  } else {
    score += (counts[5] || 0) * 50;
    usedCount += (counts[5] || 0);
  }

  // Others (2, 3, 4, 6)
  [2, 3, 4, 6].forEach(num => {
    if (counts[num] >= 3) {
      score += num * 100 * Math.pow(2, counts[num] - 3);
      usedCount += counts[num];
    }
  });

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
    dice = [1, 2, 3, 4, 5, 6], 
    score = {}, 
    currentTurnScore = 0, 
    savedDice = [], 
    tempSavedIndices = [],
    canBank = false,
    rollCount = 0
  } = game.data;

  const tempDiceValues = tempSavedIndices.map((idx: number) => dice[idx]);
  const { score: potentialScore, usedCount } = calculateDiceScore(tempDiceValues);
  const isValidSelection = usedCount === tempDiceValues.length && tempDiceValues.length > 0;

  const opponent = game.players.find(p => p.id !== myId);
  const opponentScore = score[opponent?.id || ''] || 0;
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-between py-8 relative">
      {/* Green Felt Backdrop */}
      <div className="absolute inset-0 bg-[#1a472a] opacity-40 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
      
      <div className="relative z-10 w-full flex flex-col items-center space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase chrome-text mb-2">10,000</h2>
          <div className="flex items-center justify-center space-x-2">
            <span className="h-px w-8 bg-emerald-500/50"></span>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">Dice Game</p>
            <span className="h-px w-8 bg-emerald-500/50"></span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-4">
          {dice.map((d: number, i: number) => (
            <Die 
              key={i} 
              value={d} 
              isSelected={tempSavedIndices.includes(i)} 
              isSaved={savedDice.includes(i)}
              onClick={() => onMove({ type: 'toggle_dice', index: i })}
              disabled={!isMyTurn}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl px-4">
          <div className="glass-panel p-4 rounded-3xl border-white/10 text-center bg-black/40 backdrop-blur-md">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Total</p>
            <p className="text-2xl font-black text-white tracking-tighter">{score[myId] || 0}</p>
          </div>
          <div className="glass-panel p-4 rounded-3xl border-[#967bb6]/20 text-center bg-black/40 backdrop-blur-md border-2">
            <p className="text-[8px] font-black text-[#967bb6] uppercase tracking-widest mb-1">Turn Score</p>
            <p className="text-2xl font-black text-[#967bb6] tracking-tighter">
              {currentTurnScore}
              {potentialScore > 0 && (
                <span className="text-emerald-400 ml-1 text-sm">+{potentialScore}</span>
              )}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-3xl border-white/10 text-center bg-black/40 backdrop-blur-md">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{opponent?.displayName || 'Opponent'}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{opponentScore}</p>
          </div>
        </div>
      </div>

      {isMyTurn && (
        <div className="relative z-10 flex flex-col items-center space-y-6">
          {potentialScore > 0 && !isValidSelection && (
            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">
              Invalid Selection: All selected dice must score
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {rollCount === 0 ? (
              <button 
                onClick={() => onMove({ type: 'roll' })}
                className="group relative px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#967bb6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center space-x-3">
                  <Dices size={24} />
                  <span>Start Turn</span>
                </span>
              </button>
            ) : (
              <>
                <button 
                  disabled={!isValidSelection}
                  onClick={() => onMove({ type: 'keep' })}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center space-x-2 ${
                    isValidSelection
                    ? 'bg-[#967bb6] text-white hover:scale-105 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <CheckCircle2 size={20} />
                  <span>Keep Selection</span>
                </button>

                <button 
                  disabled={tempSavedIndices.length > 0}
                  onClick={() => onMove({ type: 'roll' })}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center space-x-2 ${
                    tempSavedIndices.length === 0
                    ? 'bg-white text-black hover:scale-105 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Dices size={20} />
                  <span>Roll Again</span>
                </button>

                <button 
                  disabled={!canBank || tempSavedIndices.length > 0}
                  onClick={() => onMove({ type: 'bank' })}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center space-x-2 ${
                    canBank && tempSavedIndices.length === 0
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-105 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trophy size={20} />
                  <span>Bank Points</span>
                </button>
              </>
            )}
          </div>
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
  const { playerHand = [], dealerHand = [], status = 'playing', winner = null, bet = 0 } = game.data;
  const [showInstructions, setShowInstructions] = useState(false);

  const canDouble = playerHand.length === 2 && status === 'playing';
  const canSplit = playerHand.length === 2 && playerHand[0].value === playerHand[1].value && status === 'playing';

  return (
    <div className="h-full flex flex-col items-center justify-between py-6 relative overflow-hidden">
      {/* Vegas Table Felt */}
      <div className="absolute inset-0 bg-[#0a4d26] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
        
        {/* Table Markings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border-2 border-yellow-500/20 rounded-[100%] pointer-events-none flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-yellow-500/30 uppercase tracking-[0.5em]">Blackjack Pays 3 to 2</p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Dealer must stand on 17 and draw to 16</p>
          </div>
        </div>
      </div>

      {/* Header: Instructions Toggle */}
      <div className="relative z-10 w-full px-8 flex justify-end">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#967bb6] hover:bg-white/10 transition-all shadow-xl"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-8 z-50 w-72 glass-panel p-6 rounded-2xl border-[#967bb6]/30 bg-black/90 backdrop-blur-xl shadow-2xl"
          >
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-[#967bb6]" />
              Vegas Blackjack
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-3 font-medium leading-relaxed">
              <li>• <span className="text-[#967bb6] font-bold">Goal:</span> Get closer to 21 than the dealer without going over.</li>
              <li>• <span className="text-[#967bb6] font-bold">Hit:</span> Take another card.</li>
              <li>• <span className="text-[#967bb6] font-bold">Stand:</span> Keep your current hand and end your turn.</li>
              <li>• <span className="text-[#967bb6] font-bold">Double:</span> Double your bet, take exactly one more card, and stand.</li>
              <li>• <span className="text-[#967bb6] font-bold">Split:</span> If you have two cards of the same value, split them into two hands.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
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

      {/* Center Status/Winner */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        {status === 'finished' ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${winner === myId ? 'text-emerald-400' : 'text-red-400'}`}>
              {winner === myId ? 'You Win!' : winner === 'dealer' ? 'Dealer Wins' : 'Push'}
            </h2>
            <button 
              onClick={() => onMove({ type: 'new_game' })}
              className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
            >
              Play Again
            </button>
          </motion.div>
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Current Bet</p>
              <p className="text-lg font-black text-yellow-500">${bet}</p>
            </div>
          </div>
        )}
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

      {/* Controls */}
      {isMyTurn && status === 'playing' && (
        <div className="relative z-10 flex flex-wrap justify-center gap-4 px-4">
          <button 
            onClick={() => onMove({ type: 'hit' })}
            className="group relative px-10 py-4 bg-[#967bb6] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-[#967bb6]/30 hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Hit</span>
          </button>
          <button 
            onClick={() => onMove({ type: 'stand' })}
            className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
          >
            Stand
          </button>
          {canDouble && (
            <button 
              onClick={() => onMove({ type: 'double' })}
              className="px-10 py-4 bg-yellow-600/20 border border-yellow-600/40 text-yellow-500 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Double
            </button>
          )}
          {canSplit && (
            <button 
              onClick={() => onMove({ type: 'split' })}
              className="px-10 py-4 bg-blue-600/20 border border-blue-600/40 text-blue-400 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Split
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const RummyGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { hand = [], discardPile = [], melds = [], hasDrawn = false, score = {}, deckCount = 52 } = game.data;
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleCard = (index: number) => {
    setSelectedCards(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const opponent = game.players.find(p => p.id !== myId);
  const opponentScore = score[opponent?.id || 'bot'] || 0;
  const myScore = score[myId] || 0;

  return (
    <div className="h-full flex flex-col items-center justify-between py-4 relative overflow-hidden">
      {/* Table Felt Background */}
      <div className="absolute inset-0 bg-[#0a3d1a] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Header: Scores & Instructions Toggle */}
      <div className="relative z-10 w-full px-8 flex justify-between items-end">
        <div className="flex space-x-6">
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Your Score</p>
            <p className="text-2xl font-black text-white tracking-tighter">{myScore}</p>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">{opponent?.displayName || 'Opponent'}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{opponentScore}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => onMove({ type: 'sort' })}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl"
            title="Sort Hand"
          >
            <Layers size={20} />
          </button>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#967bb6] hover:bg-white/10 transition-all shadow-xl"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-6 z-50 w-72 glass-panel p-6 rounded-2xl border-[#967bb6]/30 bg-black/90 backdrop-blur-xl shadow-2xl"
          >
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Spade size={16} className="mr-2 text-[#967bb6]" />
              Rummy Rules
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-3 font-medium leading-relaxed">
              <li>• <span className="text-[#967bb6] font-bold">Draw:</span> Start your turn by drawing from the Stock or Discard pile.</li>
              <li>• <span className="text-[#967bb6] font-bold">Melds:</span> Create sets (3+ cards of same rank) or runs (3+ cards of same suit in sequence).</li>
              <li>• <span className="text-[#967bb6] font-bold">Discard:</span> End your turn by placing one card on the discard pile.</li>
              <li>• <span className="text-[#967bb6] font-bold">Scoring:</span> Face cards are 10, Aces are 1, others are face value. Empty your hand to win!</li>
              <li>• <span className="text-[#967bb6] font-bold">Automation:</span> Scores are calculated automatically at the end of each round.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Table Melds Area */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-2 px-4">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Table Melds</p>
        <div className="w-full flex flex-wrap justify-center gap-4 overflow-y-auto max-h-[150px] p-6 bg-black/30 rounded-[2rem] border border-white/5 shadow-inner backdrop-blur-sm">
          {melds.length === 0 && <p className="text-[10px] text-white/10 italic py-4">No melds on table yet</p>}
          {melds.map((meld: any[], i: number) => (
            <div key={i} className="flex -space-x-12 p-2 bg-white/5 rounded-xl border border-white/10 scale-75 hover:scale-90 transition-transform shadow-lg">
              {meld.map((card, j) => <Card key={j} suit={card.suit} value={card.value} />)}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Draw & Discard */}
      <div className="relative z-10 flex items-center space-x-20">
        <div className="text-center space-y-3">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -5 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn}
            onClick={() => onMove({ type: 'draw' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-4 bg-[#967bb6]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Card suit="" value="" hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Plus className="text-white" size={24} />
              </div>
            </div>
            {deckCount > 0 && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#967bb6] rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                {deckCount}
              </div>
            )}
          </motion.button>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Stock</p>
        </div>

        <div className="text-center space-y-3">
          <motion.button 
            whileHover={isMyTurn && !hasDrawn ? { scale: 1.05, y: -5 } : {}}
            whileTap={isMyTurn && !hasDrawn ? { scale: 0.95 } : {}}
            disabled={!isMyTurn || hasDrawn}
            onClick={() => onMove({ type: 'draw_discard' })}
            className={`relative group transition-all ${(!isMyTurn || hasDrawn) ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="absolute -inset-4 bg-[#967bb6]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {discardPile.length > 0 ? (
              <Card suit={discardPile[discardPile.length-1].suit} value={discardPile[discardPile.length-1].value} />
            ) : (
              <div className="w-20 h-28 lg:w-24 lg:h-36 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
              </div>
            )}
          </motion.button>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Discard</p>
        </div>
      </div>

      {/* Player Hand & Controls */}
      <div className="relative z-10 w-full flex flex-col items-center space-y-8 pb-4">
        <div className="flex -space-x-12 lg:-space-x-16 hover:-space-x-6 lg:hover:-space-x-10 transition-all duration-500 p-8 bg-black/20 rounded-[3rem] border border-white/5 backdrop-blur-sm">
          {hand.map((card: any, i: number) => (
            <motion.div 
              key={i} 
              layout
              onClick={() => toggleCard(i)}
              className={`transition-all duration-300 cursor-pointer relative ${selectedCards.includes(i) ? '-translate-y-16 scale-110 z-50' : 'hover:-translate-y-6'}`}
            >
              <Card suit={card.suit} value={card.value} />
              {selectedCards.includes(i) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#967bb6] rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={14} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {isMyTurn && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-4">
              <button 
                disabled={selectedCards.length === 0}
                onClick={() => setSelectedCards([])}
                className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all disabled:opacity-30"
              >
                Clear
              </button>
              <button 
                disabled={selectedCards.length < 3}
                onClick={() => {
                  onMove({ type: 'meld', indices: selectedCards });
                  setSelectedCards([]);
                }}
                className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                Meld Selected
              </button>
              <button 
                disabled={!hasDrawn || selectedCards.length !== 1}
                onClick={() => {
                  onMove({ type: 'discard', index: selectedCards[0] });
                  setSelectedCards([]);
                }}
                className="px-10 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                Discard
              </button>
            </div>
            
            <div className="px-6 py-2 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black text-[#967bb6] uppercase tracking-[0.3em] animate-pulse">
                {hasDrawn ? 'Select 1 card to discard' : 'Draw from Stock or Discard'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BilliardsGame: React.FC<{ game: GameState, onMove: (data: any) => void, isMyTurn: boolean, myId: string }> = ({ game, onMove, isMyTurn, myId }) => {
  const { 
    balls = [], 
    cueBall = { x: 50, y: 50 }, 
    pocketed = [], 
    mode = '8-ball',
    calledShot = null,
    targetPocket = null,
    playerType = {}
  } = game.data;
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCallShot, setShowCallShot] = useState(false);
  const [showBanking, setShowBanking] = useState(false);
  
  // Local state for smooth mouse interaction
  const [localAngle, setLocalAngle] = useState(0);
  const [localPower, setLocalPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const pockets = [
    { id: 'top-left', top: '-2%', left: '-2%', label: 'Top Left' },
    { id: 'top-mid', top: '-4%', left: '50%', transform: 'translateX(-50%)', label: 'Top Mid' },
    { id: 'top-right', top: '-2%', right: '-2%', label: 'Top Right' },
    { id: 'bottom-left', bottom: '-2%', left: '-2%', label: 'Bottom Left' },
    { id: 'bottom-mid', bottom: '-4%', left: '50%', transform: 'translateX(-50%)', label: 'Bottom Mid' },
    { id: 'bottom-right', bottom: '-2%', right: '-2%', label: 'Bottom Right' }
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMyTurn || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if clicking near cue ball to start aiming/charging
    const dist = Math.sqrt(Math.pow(x - cueBall.x, 2) + Math.pow(y - cueBall.y, 2));
    if (dist < 10) {
      setIsAiming(true);
      setIsCharging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAiming || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Calculate angle from cue ball to mouse
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI + 180) % 360; // Aiming away from mouse
    setLocalAngle(angleDeg);
    
    // Calculate power based on distance
    const dist = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(100, dist * 2);
    setLocalPower(power);
  };

  const handleMouseUp = () => {
    if (isCharging && localPower > 5) {
      onMove({ type: 'shoot', angle: localAngle, power: localPower });
    }
    setIsAiming(false);
    setIsCharging(false);
    setLocalPower(0);
  };

  const myType = playerType[myId];

  return (
    <div 
      className="h-full flex flex-col items-center justify-center py-4 relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Elegant Room Background */}
      <div className="absolute inset-0 bg-[#050505] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,15,15,0.8)_0%,_rgba(0,0,0,1)_100%)]"></div>
      </div>
      
      {/* Header: Mode & Stats */}
      <div className="relative z-10 w-full px-8 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="glass-panel px-6 py-2 rounded-2xl border-white/10 bg-black/40 backdrop-blur-md">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Game Mode</p>
            <p className="text-lg font-black text-[#967bb6] uppercase tracking-tighter">{mode}</p>
          </div>
          {myType && (
            <div className="glass-panel px-6 py-2 rounded-2xl border-white/10 bg-black/40 backdrop-blur-md">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Your Group</p>
              <p className={`text-lg font-black uppercase tracking-tighter ${myType === 'solid' ? 'text-blue-400' : 'text-amber-400'}`}>
                {myType}s
              </p>
            </div>
          )}
          <div className="flex -space-x-2">
            {pocketed.slice(-8).map((ball: any, i: number) => (
              <div 
                key={i}
                className={`w-7 h-7 rounded-full border border-white/20 shadow-lg flex items-center justify-center text-[9px] font-black ${
                  ball.type === 'solid' ? 'bg-blue-600' : ball.type === 'black' ? 'bg-black' : 'bg-amber-400'
                }`}
              >
                {ball.number}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {calledShot && (
            <div className="glass-panel px-4 py-2 rounded-xl border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-2 animate-pulse">
              <Target size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Called: #{calledShot} in {targetPocket || 'Any'}</span>
            </div>
          )}
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#967bb6] hover:bg-white/10 transition-all shadow-xl"
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
            className="absolute top-24 right-8 z-[60] w-72 glass-panel p-6 rounded-3xl border-[#967bb6]/30 bg-black/90 backdrop-blur-2xl shadow-2xl"
          >
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Sparkles size={16} className="mr-2 text-[#967bb6]" />
              Billiards Masterclass
            </h4>
            <div className="space-y-4 text-[11px] text-slate-300 font-medium leading-relaxed">
              <section>
                <p className="text-[#967bb6] font-black uppercase mb-1">Aiming & Shooting</p>
                <p>Click and drag away from the cue ball to aim. The distance you drag determines the power. Release to shoot.</p>
              </section>
              <section>
                <p className="text-[#967bb6] font-black uppercase mb-1">Call Your Shot</p>
                <p>Use the "Call Shot" button to select a ball and pocket before taking your shot.</p>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large Realistic Table */}
      <div 
        ref={tableRef}
        onMouseDown={handleMouseDown}
        className="relative w-full max-w-7xl aspect-[2.2/1] bg-[#0a5c2a] rounded-[4rem] border-[28px] border-[#2a1d15] shadow-[0_80px_200px_rgba(0,0,0,1)] overflow-visible group/table cursor-crosshair"
      >
        {/* Table Rail Detail with Wood Grain */}
        <div className="absolute -inset-8 border-4 border-[#3d2b1f] rounded-[4.5rem] pointer-events-none opacity-60 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] pointer-events-none"></div>
        
        {/* Table Felt Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
        
        {/* Diamond Sights on Rails */}
        {[...Array(18)].map((_, i) => {
          const isTop = i < 6;
          const isBottom = i >= 6 && i < 12;
          const isLeft = i >= 12 && i < 15;
          const isRight = i >= 15;
          
          let style = {};
          if (isTop) style = { top: '-18px', left: `${(i + 1) * 14.28}%` };
          if (isBottom) style = { bottom: '-18px', left: `${(i - 5) * 14.28}%` };
          if (isLeft) style = { left: '-18px', top: `${(i - 11) * 25}%` };
          if (isRight) style = { right: '-18px', top: `${(i - 14) * 25}%` };

          return (
            <div key={i} style={style} className="absolute w-1.5 h-1.5 bg-white/40 rotate-45 rounded-sm z-10" />
          );
        })}

        {/* Realistic Pockets */}
        {pockets.map((p) => (
          <button 
            key={p.id} 
            style={p}
            onClick={(e) => {
              e.stopPropagation();
              showCallShot && onMove({ type: 'select_pocket', pocketId: p.id });
            }}
            className={`absolute w-20 h-20 bg-[#050505] rounded-full shadow-[inset_0_8px_20px_rgba(255,255,255,0.05)] z-20 flex items-center justify-center transition-all ${
              targetPocket === p.id ? 'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : ''
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-transparent to-black/80"></div>
          </button>
        ))}

        {/* Aiming Line */}
        {isMyTurn && (
          <>
            <div 
              className="absolute h-0.5 bg-gradient-to-r from-white/60 to-transparent border-t border-dashed border-white/80 origin-left z-10 pointer-events-none"
              style={{ 
                left: `${cueBall.x}%`, 
                top: `${cueBall.y}%`,
                width: '1200px',
                transform: `rotate(${localAngle}deg)`
              }}
            />
            {showBanking && (
              <div 
                className="absolute h-px bg-emerald-500/30 border-t border-dotted border-emerald-500/50 origin-left z-10 pointer-events-none"
                style={{ 
                  left: `${cueBall.x}%`, 
                  top: `${cueBall.y}%`,
                  width: '2000px',
                  transform: `rotate(${localAngle + 180}deg)`
                }}
              />
            )}
          </>
        )}

        {/* Realistic Balls */}
        {balls.map((ball: any, i: number) => (
          <motion.div 
            key={i}
            animate={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            className={`absolute w-7 h-7 rounded-full shadow-[4px_8px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-[9px] font-black z-30 ${
              ball.type === 'solid' ? 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900' : 
              ball.type === 'black' ? 'bg-gradient-to-br from-slate-700 via-black to-black' : 
              'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800'
            } border border-white/10 overflow-hidden cursor-pointer hover:scale-110 transition-transform`}
            onClick={(e) => {
              e.stopPropagation();
              showCallShot && onMove({ type: 'select_ball', ballNum: ball.number });
            }}
          >
            <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]"></div>
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] z-10">
              {ball.number}
            </div>
            {ball.type === 'striped' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-3 bg-white/90 shadow-sm"></div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Cue Ball */}
        <motion.div 
          animate={{ left: `${cueBall.x}%`, top: `${cueBall.y}%` }}
          className="absolute w-7 h-7 rounded-full bg-white shadow-[4px_8px_12px_rgba(0,0,0,0.5)] border border-black/5 z-30 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-100 to-slate-300"></div>
          <div className="absolute top-1 left-1.5 w-2 h-1 bg-white rounded-full blur-[1px] rotate-[-20deg] opacity-80"></div>
        </motion.div>

        {/* Cue Stick */}
        {isMyTurn && (
          <motion.div 
            className="absolute w-2 h-96 bg-gradient-to-b from-[#1a110a] via-[#5d4037] to-[#d4a373] origin-bottom z-40 rounded-full shadow-2xl"
            style={{ 
              left: `${cueBall.x}%`, 
              top: `${cueBall.y}%`,
              transform: `translate(-50%, -100%) translateY(-20px) rotate(${localAngle}deg)`
            }}
            animate={{ translateY: `-${20 + (localPower / 1.2)}px` }}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-8 flex items-center space-x-6 z-10">
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCallShot(!showCallShot)}
            className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${
              showCallShot ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {showCallShot ? 'Cancel Call' : 'Call Shot'}
          </button>
          <button 
            onClick={() => setShowBanking(!showBanking)}
            className={`px-4 py-3 rounded-2xl transition-all border ${
              showBanking ? 'bg-[#967bb6] border-[#967bb6]/40 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Target size={18} />
          </button>
          <button 
            onClick={() => onMove({ type: 'change_mode', mode: mode === '8-ball' ? '9-ball' : '8-ball' })}
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <Layers size={18} />
          </button>
        </div>

        {isCharging && (
          <div className="flex flex-col items-center">
            <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                style={{ width: `${localPower}%` }}
              />
            </div>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-2">Power: {Math.round(localPower)}%</p>
          </div>
        )}
      </div>

      {/* Call Shot Selection UI */}
      <AnimatePresence>
        {showCallShot && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 z-50 w-full max-w-2xl glass-panel p-6 rounded-3xl border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl"
          >
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Select Ball</p>
                <div className="flex flex-wrap gap-3">
                  {balls.filter((b: any) => b.number !== 0).map((ball: any) => (
                    <button 
                      key={ball.number}
                      onClick={() => onMove({ type: 'select_ball', ballNum: ball.number })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black transition-all border-2 ${
                        calledShot === ball.number ? 'border-emerald-400 scale-110 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-60 hover:opacity-100'
                      } ${ball.type === 'solid' ? 'bg-blue-600' : ball.type === 'black' ? 'bg-black' : 'bg-amber-400'}`}
                    >
                      {ball.number}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Select Pocket</p>
                <div className="grid grid-cols-3 gap-3">
                  {pockets.map((pocket) => (
                    <button 
                      key={pocket.id}
                      onClick={() => onMove({ type: 'select_pocket', pocketId: pocket.id })}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        targetPocket === pocket.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                      }`}
                    >
                      {pocket.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameRoom;
