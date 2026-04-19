import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Trophy, CheckCircle2, AlertCircle, 
  RotateCcw, Play, History, Info, Sparkles 
} from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface DieData {
  value: number;
  isSelected: boolean;
  isSaved: boolean;
}

interface TenThousandGameProps {
  game: any;
  onMove: (move: any) => void;
  isMyTurn: boolean;
  myId: string;
}

const DICE_ICON_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const Die: React.FC<{ 
  value: number; 
  isSelected: boolean; 
  isSaved: boolean; 
  onClick: () => void; 
  disabled: boolean;
  isRolling?: boolean;
}> = ({ value, isSelected, isSaved, onClick, disabled, isRolling }) => {
  const dots = DICE_ICON_MAP[value] || [];

  return (
    <motion.div
      whileHover={!disabled && !isSaved ? { scale: 1.05, rotate: 2 } : {}}
      whileTap={!disabled && !isSaved ? { scale: 0.95 } : {}}
      animate={isRolling ? { 
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 1.1, 1],
      } : {}}
      transition={isRolling ? { duration: 0.3, repeat: Infinity } : {}}
      onClick={!disabled && !isSaved ? onClick : undefined}
      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg transition-all border-2 ${
        isSaved 
          ? 'bg-slate-800/50 border-slate-700/50 opacity-40 grayscale cursor-default' 
          : isSelected 
          ? 'bg-[#967bb6] border-white shadow-[0_0_20px_rgba(150,123,182,0.5)] -translate-y-2 cursor-pointer' 
          : 'bg-black border-[#967bb6]/30 cursor-pointer hover:border-[#967bb6]/60'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-3/4 h-3/4 pointer-events-none">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <div className={`w-2 h-2 rounded-full ${isSelected || isSaved ? 'bg-white' : 'bg-[#967bb6]'}`} />
            )}
          </div>
        ))}
      </div>
      {isSaved && (
        <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-black shadow-lg">
          <CheckCircle2 size={10} className="text-white" />
        </div>
      )}
    </motion.div>
  );
};

export const calculateDiceScore = (dice: number[]) => {
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
      count = 0; // All used
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

const TenThousandGame: React.FC<TenThousandGameProps> = ({ game, onMove, isMyTurn, myId }) => {
  const { 
    dice = [], 
    savedDice = [],
    score = {}, 
    currentTurnScore = 0,
    isFirstRoll = true,
    farkled = false,
  } = game.data;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  
  useEffect(() => {
    setSelectedIndices([]);
    setIsRolling(false);
  }, [dice]);

  const opponent = game.players.find((p: any) => p.id !== myId);
  const me = game.players.find((p: any) => p.id === myId);
  
  const myTotalScore = score[myId] || 0;
  const opponentTotalScore = score[opponent?.id || ''] || 0;

  const toggleSelection = (index: number) => {
    if (!isMyTurn || isRolling) return;
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectedDiceValues = selectedIndices.map(i => dice[i]);
  const { score: potentialScore, usedCount } = calculateDiceScore(selectedDiceValues);
  const isValidSelection = selectedIndices.length > 0 && usedCount === selectedIndices.length;

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    if (!isFirstRoll && !isValidSelection) return;
    
    setIsRolling(true);
    // Move is sent after a short delay for animation
    setTimeout(() => {
      onMove({ type: 'roll', selectedIndices });
    }, 600);
  };

  const handleBank = () => {
    if (!isMyTurn || isRolling) return;
    const total = currentTurnScore + potentialScore;
    if (total === 0) return;
    if (selectedIndices.length > 0 && !isValidSelection) return;

    onMove({ type: 'bank', selectedIndices });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 flex flex-col items-center">
      {/* Scoreboard */}
      <div className="w-full grid grid-cols-2 gap-2 mb-4">
        <div className={`p-3 rounded-2xl border-2 transition-all ${isMyTurn ? 'bg-[#967bb6]/10 border-[#967bb6] shadow-[0_0_20px_rgba(150,123,182,0.2)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <img src={me?.avatar || APP_LOGO_URL} className="w-8 h-8 rounded-full border border-white/20" alt="Me" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/bear/400/400'; }} />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">You</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter">{myTotalScore.toLocaleString()}</p>
          {isMyTurn && (
            <div className="mt-2 flex items-center space-x-1 animate-pulse">
              <Sparkles size={10} className="text-[#967bb6]" />
              <span className="text-[8px] font-black text-[#967bb6] uppercase tracking-[0.2em]">Playing</span>
            </div>
          )}
        </div>
        
        <div className={`p-4 rounded-3xl border-2 transition-all ${!isMyTurn ? 'bg-[#967bb6]/10 border-[#967bb6] shadow-[0_0_20px_rgba(150,123,182,0.2)]' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <img src={opponent?.avatar || APP_LOGO_URL} className="w-7 h-7 rounded-full border border-white/20" alt="Opponent" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/bear/400/400'; }} />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{opponent?.displayName || 'BareBear'}</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">{opponentTotalScore.toLocaleString()}</p>
          {!isMyTurn && (
            <div className="mt-2 flex items-center space-x-1 animate-pulse">
              <Sparkles size={10} className="text-[#967bb6]" />
              <span className="text-[8px] font-black text-[#967bb6] uppercase tracking-[0.2em]">Thinking</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full glass-panel rounded-[2rem] border-[#967bb6]/20 bg-black/40 p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl chrome-border">
        {/* Turn Status Overlay */}
        <AnimatePresence>
          {farkled && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            >
              <div className="text-center">
                <h3 className="text-6xl font-black text-red-500 uppercase tracking-tighter animate-bounce drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">FARKLE!</h3>
                <p className="text-white/60 font-black uppercase tracking-[0.3em] mt-4">Next player's turn</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Turn Score Area */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Current Turn Score</p>
          <div className="relative inline-block">
            <h4 className="text-5xl md:text-6xl font-black text-white tracking-tighter chrome-text">
              {(currentTurnScore + potentialScore).toLocaleString()}
            </h4>
            {potentialScore > 0 && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute -right-12 top-0 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg"
              >
                +{potentialScore}
              </motion.div>
            )}
          </div>
        </div>

        {/* Saved Dice Display */}
        {savedDice.length > 0 && (
          <div className="flex flex-col items-center mb-6">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Saved Combinations</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {savedDice.map((val: number, i: number) => (
                <Die key={`saved-${i}`} value={val} isSelected={false} isSaved={true} onClick={() => {}} disabled={true} />
              ))}
            </div>
          </div>
        )}

        {/* Action Area: Dice to Roll/Select */}
        <div className="flex flex-col items-center space-y-6">
          <div className="flex flex-wrap justify-center gap-3 min-h-[4rem]">
            {isFirstRoll ? (
              <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                <Dices size={64} className="text-[#967bb6]" />
                <p className="text-xs font-black uppercase tracking-widest">Ready to Roll</p>
              </div>
            ) : (
              dice.map((val: number, i: number) => (
                <Die 
                  key={`die-${i}`} 
                  value={val} 
                  isSelected={selectedIndices.includes(i)} 
                  isSaved={false} 
                  onClick={() => toggleSelection(i)} 
                  disabled={!isMyTurn || isRolling}
                  isRolling={isRolling}
                />
              ))
            )}
          </div>

          <div className="w-full max-w-sm grid grid-cols-1 gap-3">
            <button
              onClick={handleRoll}
              disabled={!isMyTurn || isRolling || (!isFirstRoll && !isValidSelection)}
              className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
                isMyTurn && (isFirstRoll || isValidSelection) && !isRolling
                  ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-2xl'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <RotateCcw size={18} className={isRolling ? 'animate-spin' : ''} />
              <span>{isFirstRoll ? 'Initial Roll' : 'Keep & Roll Again'}</span>
            </button>
            <button
              onClick={handleBank}
              disabled={!isMyTurn || isRolling || (currentTurnScore + potentialScore === 0) || (selectedIndices.length > 0 && !isValidSelection)}
              className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
                isMyTurn && (currentTurnScore + potentialScore > 0) && (selectedIndices.length === 0 || isValidSelection) && !isRolling
                  ? 'bg-[#967bb6] text-white hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#967bb6]/30 animate-pulse'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <Trophy size={18} />
              <span>Bank {currentTurnScore + potentialScore} Points</span>
            </button>
          </div>
        </div>

        {/* Quick Rules Summary */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Single 1', val: '100' },
              { label: 'Single 5', val: '50' },
              { label: '3 of Kind', val: '100x' },
              { label: 'Straight', val: '1500' }
            ].map((rule, i) => (
              <div key={i} className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-white/40 uppercase mb-1">{rule.label}</p>
                <p className="text-sm font-black text-[#967bb6]">{rule.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenThousandGame;
