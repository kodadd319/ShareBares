import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Trophy, CheckCircle2, 
  RotateCcw, Sparkles 
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
      whileHover={!disabled && !isSaved ? { scale: 1.08, rotate: 3 } : {}}
      whileTap={!disabled && !isSaved ? { scale: 0.92 } : {}}
      animate={isRolling ? { 
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 1.12, 1],
      } : {}}
      transition={isRolling ? { duration: 0.3, repeat: Infinity } : {}}
      onClick={!disabled && !isSaved ? onClick : undefined}
      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-xl transition-all border-2 ${
        isSaved 
          ? 'bg-[#40040e]/30 border-black/40 opacity-40 grayscale scale-95 cursor-default' 
          : isSelected 
          ? 'bg-gradient-to-br from-[#800c1e] to-[#40020a] border-amber-400 shadow-[0_0_20px_rgba(255,200,0,0.6)] ring-4 ring-amber-400/30 -translate-y-2 cursor-pointer' 
          : 'bg-gradient-to-br from-[#700612] to-[#3a0108] border-black cursor-pointer hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(112,6,18,0.5)]'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-3/4 h-3/4 pointer-events-none">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            )}
          </div>
        ))}
      </div>
      {isSaved && (
        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-black shadow-lg">
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
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center rounded-3xl bg-gradient-to-br from-[#12653f] via-[#0d4f10] to-[#042617] border-[6px] border-[#080808] shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white relative overflow-hidden">
      {/* Felt Grid / Poker Line Accent */}
      <div className="absolute inset-0 border-[10px] border-double border-black/35 pointer-events-none rounded-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(0,0,0,0.55)_100%)] pointer-events-none" />

      {/* Scoreboard */}
      <div className="w-full grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className={`p-4 rounded-2xl border-2 transition-all ${isMyTurn ? 'bg-[#000000]/95 border-[#800020] shadow-[0_0_15px_rgba(128,0,32,0.6)] scale-[1.01]' : 'bg-[#000000]/80 border-[#0a0a0a]'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <img src={me?.avatar || APP_LOGO_URL} className="w-8 h-8 rounded-full border border-black/80 shadow-md" alt="Me" onError={(e) => { (e.target as HTMLImageElement).src = APP_LOGO_URL; }} />
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">You</span>
          </div>
          <p className="text-3xl font-black text-[#be123c] tracking-tighter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            {myTotalScore.toLocaleString()}
          </p>
          {isMyTurn && (
            <div className="mt-2 flex items-center space-x-1 animate-pulse">
              <Sparkles size={11} className="text-[#be123c]" />
              <span className="text-[9px] font-black text-[#be123c] uppercase tracking-[0.2em]">Playing</span>
            </div>
          )}
        </div>
        
        <div className={`p-4 rounded-2xl border-2 transition-all ${!isMyTurn ? 'bg-[#000000]/95 border-[#800020] shadow-[0_0_15px_rgba(128,0,32,0.6)] scale-[1.01]' : 'bg-[#000000]/80 border-[#0a0a0a]'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <img src={opponent?.avatar || APP_LOGO_URL} className="w-8 h-8 rounded-full border border-black/80 shadow-md" alt="Opponent" onError={(e) => { (e.target as HTMLImageElement).src = APP_LOGO_URL; }} />
            <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{opponent?.displayName || 'ShareBares'}</span>
          </div>
          <p className="text-3xl font-black text-[#be123c] tracking-tighter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
            {opponentTotalScore.toLocaleString()}
          </p>
          {!isMyTurn && (
            <div className="mt-2 flex items-center space-x-1 animate-pulse">
              <Sparkles size={11} className="text-[#be123c]" />
              <span className="text-[9px] font-black text-[#be123c] uppercase tracking-[0.2em]">Thinking</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full rounded-[2rem] border-4 border-black bg-black/90 p-6 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl z-10">
        {/* Turn Status Overlay */}
        <AnimatePresence>
          {farkled && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
            >
              <div className="text-center flex flex-col items-center p-6">
                <h3 className="text-6xl font-black text-[#be123c] uppercase tracking-tighter animate-bounce drop-shadow-[0_0_20px_rgba(190,18,60,0.7)]">FARKLE!</h3>
                <p className="text-neutral-400 font-black uppercase tracking-[0.3em] mt-4">Next player's turn</p>
                {isMyTurn && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMove({ type: 'acknowledge_farkle' })}
                    className="mt-6 px-8 py-3 bg-black text-[#be123c] border-2 border-[#800020] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-neutral-950 transition-all cursor-pointer relative z-50 pointer-events-auto"
                  >
                    Start My Turn
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Turn Score Area */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-black text-[#800020] uppercase tracking-[0.4em] mb-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            Current Turn Score
          </p>
          <div className="relative inline-block">
            <h4 className="text-5xl md:text-6xl font-black text-[#be123c] tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {(currentTurnScore + potentialScore).toLocaleString()}
            </h4>
            {potentialScore > 0 && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute -right-14 top-0 bg-black text-[#be123c] border border-[#800020] text-[10px] font-black px-2 py-1 rounded-lg shadow-md"
              >
                +{potentialScore}
              </motion.div>
            )}
          </div>
        </div>

        {/* Saved Dice Display */}
        {savedDice.length > 0 && (
          <div className="flex flex-col items-center mb-6">
            <span className="text-[10px] font-black text-[#800020] uppercase tracking-[0.3em] mb-2 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.5)]">
              Saved Combinations
            </span>
            <div className="flex flex-wrap justify-center gap-2">
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
              <div className="flex flex-col items-center justify-center space-y-4 opacity-75">
                <Dices size={64} className="text-[#800020]" />
                <p className="text-xs font-black uppercase tracking-widest text-[#be123c]">Ready to Roll</p>
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
              className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 border-2 ${
                isMyTurn && (isFirstRoll || isValidSelection) && !isRolling
                  ? 'bg-black text-[#be123c] border-[#800020] hover:bg-neutral-950 hover:scale-[1.02] active:scale-[0.98] shadow-2xl cursor-pointer'
                  : 'bg-black/40 text-neutral-700 border-neutral-900/60 cursor-not-allowed'
              }`}
            >
              <RotateCcw size={18} className={isRolling ? 'animate-spin' : ''} />
              <span>{isFirstRoll ? 'Initial Roll' : 'Keep & Roll Again'}</span>
            </button>
            <button
              onClick={handleBank}
              disabled={!isMyTurn || isRolling || (currentTurnScore + potentialScore === 0) || (selectedIndices.length > 0 && !isValidSelection)}
              className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 border-2 ${
                isMyTurn && (currentTurnScore + potentialScore > 0) && (selectedIndices.length === 0 || isValidSelection) && !isRolling
                  ? 'bg-black text-[#be123c] border-[#800020] hover:bg-neutral-950 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/80 cursor-pointer animate-pulse'
                  : 'bg-black/40 text-neutral-700 border-neutral-900/60 cursor-not-allowed'
              }`}
            >
              <Trophy size={18} />
              <span>Bank {currentTurnScore + potentialScore} Points</span>
            </button>
          </div>
        </div>

        {/* Quick Rules Summary */}
        <div className="mt-8 pt-6 border-t border-black/80">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Single 1', val: '100' },
              { label: 'Single 5', val: '50' },
              { label: '3 of Kind', val: '100x' },
              { label: 'Straight', val: '1500' }
            ].map((rule, i) => (
              <div key={i} className="text-center p-2 bg-black rounded-xl border border-black shadow-md">
                <p className="text-[9px] font-black text-neutral-500 uppercase mb-1">{rule.label}</p>
                <p className="text-xs font-black text-[#be123c]">{rule.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenThousandGame;
