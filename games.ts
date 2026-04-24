
import { GameState, GameType } from './types.ts';

export const createInitialGameState = (id: string, type: GameType, players: any[]): GameState => {
  const data: any = {};

  if (type === 'checkers') {
    const board = Array(8).fill(0).map(() => Array(8).fill(0));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = 2; // Player 2 (Top, White/Silver)
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = 1; // Player 1 (Bottom, Red)
      }
    }
    data.board = board;
  } else if (type === '10000') {
    data.dice = [];
    data.savedDice = [];
    data.score = {};
    players.forEach(p => data.score[p.id] = 0);
    data.currentTurnScore = 0;
    data.isFirstRoll = true;
    data.farkled = false;
  } else if (type === 'blackjack') {
    data.deck = createDeck();
    data.players = players.map(p => ({ id: p.id, hand: [], score: 1000 }));
    data.dealerHand = [];
    data.pot = 0;
    data.currentPlayerIndex = 0;
    data.status = 'waiting';
  } else if (type === 'rummy') {
    const deck = createDeck();
    data.deck = deck;
    data.players = players.map(p => ({
      id: p.id,
      hand: Array(10).fill(0).map(() => drawCard(data.deck)),
      melds: [],
      score: 0
    }));
    data.discardPile = [drawCard(data.deck)];
    data.status = 'playing';
    data.turnPhase = 'draw'; // 'draw' or 'discard'
  }

  return {
    id,
    type,
    players,
    status: 'waiting',
    turn: players[0].id,
    data,
    updatedAt: new Date().toISOString()
  };
};

const createDeck = () => {
  const suits = ['spade', 'club', 'heart', 'diamond'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const drawCard = (deck: any[]) => {
  if (deck.length === 0) {
    // Re-shuffle if empty (simplified)
    const newDeck = createDeck();
    deck.push(...newDeck);
  }
  return deck.pop();
};

const dealerPlay = (data: any) => {
  // Dealer hits on 16 and below, stands on 17 and above
  while (getBlackjackValue(data.dealerHand) < 17) {
    data.dealerHand.push(drawCard(data.deck));
  }
  
  const dScore = getBlackjackValue(data.dealerHand);
  data.players.forEach((p: any) => {
    const pScore = getBlackjackValue(p.hand);
    
    // Check for Blackjack (21 with 2 cards)
    const isPBlackjack = pScore === 21 && p.hand.length === 2;
    const isDBlackjack = dScore === 21 && data.dealerHand.length === 2;

    if (pScore > 21) {
      // Player busted, they already lost their bet
    } else if (dScore > 21 || pScore > dScore) {
      // Player wins
      if (isPBlackjack && !isDBlackjack) {
        p.score += 250; // 3:2 payout (100 bet + 150 win)
      } else {
        p.score += 200; // 1:1 payout (100 bet + 100 win)
      }
    } else if (pScore === dScore) {
      // Push
      if (isPBlackjack && !isDBlackjack) {
        p.score += 250;
      } else if (!isPBlackjack && isDBlackjack) {
        // Dealer wins with Blackjack vs 21
      } else {
        p.score += 100; // Return bet
      }
    }
  });
  
  data.pot = 0;
  data.status = 'finished';
};

export const getBlackjackValue = (hand: any[]) => {
  let value = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') {
      aces += 1;
      value += 11;
    } else if (['K', 'Q', 'J', '10'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
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

export const getScoringIndices = (dice: number[]) => {
  const indices: number[] = [];
  const counts: Record<number, number> = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

  const values = Object.keys(counts).map(Number).sort();
  
  // Straight or Three Pairs
  if (values.length === 6) return [0, 1, 2, 3, 4, 5];
  const pairs = values.filter(v => counts[v] === 2);
  if (pairs.length === 3) return [0, 1, 2, 3, 4, 5];

  // Triplets and singles
  for (let i = 0; i < dice.length; i++) {
    const val = dice[i];
    if (val === 1 || val === 5 || counts[val] >= 3) {
      indices.push(i);
    }
  }
  return indices;
};

export const getRankValue = (value: string) => {
  if (value === 'A') return 1;
  if (value === 'J') return 11;
  if (value === 'Q') return 12;
  if (value === 'K') return 13;
  return parseInt(value);
};

export const getCardValue = (card: any) => {
  const rank = getRankValue(card.value);
  if (rank >= 10) return 10;
  if (rank === 1) return 1;
  return rank;
};

const findMelds = (hand: any[]) => {
  const melds: any[][] = [];
  const sortedHand = [...hand].sort((a, b) => getRankValue(a.value) - getRankValue(b.value));

  // Find Sets (3 or 4 of a kind)
  const rankGroups: Record<string, any[]> = {};
  hand.forEach(card => {
    if (!rankGroups[card.value]) rankGroups[card.value] = [];
    rankGroups[card.value].push(card);
  });
  Object.values(rankGroups).forEach(group => {
    if (group.length >= 3) melds.push(group);
    if (group.length === 4) {
      // Also add all combinations of 3 just in case? Usually 4 is always better.
    }
  });

  // Find Runs (3+ of same suit in sequence)
  const suitGroups: Record<string, any[]> = {};
  hand.forEach(card => {
    if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
    suitGroups[card.suit].push(card);
  });
  Object.values(suitGroups).forEach(group => {
    const sortedGroup = group.sort((a, b) => getRankValue(a.value) - getRankValue(b.value));
    let currentRun = [sortedGroup[0]];
    for (let i = 1; i < sortedGroup.length; i++) {
      if (getRankValue(sortedGroup[i].value) === getRankValue(sortedGroup[i-1].value) + 1) {
        currentRun.push(sortedGroup[i]);
      } else if (getRankValue(sortedGroup[i].value) !== getRankValue(sortedGroup[i-1].value)) {
        if (currentRun.length >= 3) melds.push(currentRun);
        currentRun = [sortedGroup[i]];
      }
    }
    if (currentRun.length >= 3) melds.push(currentRun);
  });

  return melds;
};

export const calculateDeadwood = (hand: any[]) => {
  const allMelds = findMelds(hand);
  if (allMelds.length === 0) return hand.reduce((sum, c) => sum + getCardValue(c), 0);

  // We need to find the combination of non-overlapping melds that minimizes deadwood.
  // For Rummy hands (10-11 cards), we can use a recursive search.
  
  const solve = (remainingCards: any[], melds: any[][]): number => {
    if (melds.length === 0) return remainingCards.reduce((sum, c) => sum + getCardValue(c), 0);
    
    let minScore = remainingCards.reduce((sum, c) => sum + getCardValue(c), 0);
    
    for (let i = 0; i < melds.length; i++) {
      const currentMeld = melds[i];
      // Check if currentMeld is still possible with remainingCards
      const stillPossible = currentMeld.every(mc => remainingCards.some(rc => rc.suit === mc.suit && rc.value === mc.value));
      
      if (stillPossible) {
        const nextRemaining = remainingCards.filter(rc => !currentMeld.some(mc => mc.suit === rc.suit && rc.value === mc.value));
        const nextMelds = melds.slice(i + 1);
        const score = solve(nextRemaining, nextMelds);
        if (score < minScore) minScore = score;
      }
    }
    
    return minScore;
  };

  return solve(hand, allMelds);
};

export const calculateRummyScore = (hand: any[]) => {
  const allMelds = findMelds(hand);
  if (allMelds.length === 0) return { deadwood: hand.reduce((sum, c) => sum + getCardValue(c), 0), melds: [] };

  const solve = (remainingCards: any[], melds: any[][]): { score: number, bestMelds: any[][] } => {
    if (melds.length === 0) return { score: remainingCards.reduce((sum, c) => sum + getCardValue(c), 0), bestMelds: [] };
    
    let bestResult = { score: remainingCards.reduce((sum, c) => sum + getCardValue(c), 0), bestMelds: [] as any[][] };
    
    for (let i = 0; i < melds.length; i++) {
      const currentMeld = melds[i];
      const stillPossible = currentMeld.every(mc => remainingCards.some(rc => rc.suit === mc.suit && rc.value === mc.value));
      
      if (stillPossible) {
        const nextRemaining = remainingCards.filter(rc => !currentMeld.some(mc => mc.suit === rc.suit && rc.value === mc.value));
        const nextMelds = melds.slice(i + 1);
        const res = solve(nextRemaining, nextMelds);
        if (res.score < bestResult.score) {
          bestResult = { score: res.score, bestMelds: [currentMeld, ...res.bestMelds] };
        }
      }
    }
    
    return bestResult;
  };

  const result = solve(hand, allMelds);
  return { deadwood: result.score, melds: result.bestMelds };
};

export const handleMove = (game: GameState, userId: string, moveData: any): GameState => {
  const newData = JSON.parse(JSON.stringify(game.data)); // Deep clone
  let nextTurn = game.turn;
  let status = game.status;
  let winner = game.winner;

  const opponentId = game.players.find(p => p.id !== userId)?.id || 'bot';

  if (game.type === 'checkers') {
    const { from, to } = moveData;
    const [fr, fc] = from;
    const [tr, tc] = to;
    const board = newData.board;
    const piece = board[fr][fc];
    const myColor = game.players[0].id === userId ? 1 : 2;

    // Helper to get all valid moves for a player
    const getAllValidMoves = (currentBoard: number[][], color: number) => {
      const moves: any[] = [];
      const jumps: any[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = currentBoard[r][c];
          if (Math.floor(p) !== color) continue;

          const isKing = p > 2;
          const directions = [];
          if (color === 1 || isKing) directions.push([-1, -1], [-1, 1]);
          if (color === 2 || isKing) directions.push([1, -1], [1, 1]);

          for (const [dr, dc] of directions) {
            // Check single move
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currentBoard[nr][nc] === 0) {
              moves.push({ from: [r, c], to: [nr, nc] });
            }

            // Check jump
            const jr = r + dr * 2;
            const jc = c + dc * 2;
            if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && currentBoard[jr][jc] === 0) {
              const mr = r + dr;
              const mc = c + dc;
              const midPiece = currentBoard[mr][mc];
              if (midPiece !== 0 && Math.floor(midPiece) !== color) {
                jumps.push({ from: [r, c], to: [jr, jc], jumped: [mr, mc] });
              }
            }
          }
        }
      }
      return jumps.length > 0 ? { jumps, type: 'jump' } : { moves, type: 'move' };
    };

    const validMoves = getAllValidMoves(board, myColor);
    
    // Validate the attempted move
    let moveEffect: any = null;
    if (validMoves.type === 'jump') {
      moveEffect = validMoves.jumps.find((j: any) => j.from[0] === fr && j.from[1] === fc && j.to[0] === tr && j.to[1] === tc);
    } else {
      moveEffect = validMoves.moves.find((m: any) => m.from[0] === fr && m.from[1] === fc && m.to[0] === tr && m.to[1] === tc);
    }

    if (!moveEffect) return game;

    // Execute move
    board[tr][tc] = piece;
    board[fr][fc] = 0;
    if (moveEffect.jumped) {
      board[moveEffect.jumped[0]][moveEffect.jumped[1]] = 0;
    }

    // Kinging
    let justKinged = false;
    if ((myColor === 1 && tr === 0 && piece === 1) || (myColor === 2 && tr === 7 && piece === 2)) {
      board[tr][tc] = myColor + 2;
      justKinged = true;
    }

    // Check for double jump
    let canJumpAgain = false;
    if (moveEffect.jumped && !justKinged) {
      const p = board[tr][tc];
      const isKing = p > 2;
      const directions = [];
      if (myColor === 1 || isKing) directions.push([-1, -1], [-1, 1]);
      if (myColor === 2 || isKing) directions.push([1, -1], [1, 1]);

      for (const [dr, dc] of directions) {
        const jr = tr + dr * 2;
        const jc = tc + dc * 2;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
          const mr = tr + dr;
          const mc = tc + dc;
          const midPiece = board[mr][mc];
          if (midPiece !== 0 && Math.floor(midPiece) !== myColor) {
            canJumpAgain = true;
            break;
          }
        }
      }
    }

    if (!canJumpAgain) {
      nextTurn = opponentId;
    }

    // Check win condition for the NEXT player
    const nextPlayerColor = game.players[0].id === nextTurn ? 1 : 2;
    const nextValidMoves = getAllValidMoves(board, nextPlayerColor);
    if (nextValidMoves.type === 'move' && nextValidMoves.moves.length === 0) {
      status = 'finished';
      winner = userId;
    } else if (nextValidMoves.type === 'jump' && nextValidMoves.jumps.length === 0) {
       // This shouldn't happen if jumps are available, but for safety:
       const remainingOpponent = board.flat().filter((p: number) => p !== 0 && Math.floor(p) !== myColor);
       if (remainingOpponent.length === 0) {
         status = 'finished';
         winner = userId;
       }
    }

  } else if (game.type === '10000') {
    if (moveData.type === 'roll') {
      // If not first roll, we must have selected scoring dice
      if (!newData.isFirstRoll) {
        const selectedDice = moveData.selectedIndices.map((i: number) => newData.dice[i]);
        const { score: selectedScore, usedCount } = calculateDiceScore(selectedDice);
        
        // Validation: Must select at least one scoring die, and ALL selected must be part of a scoring combo
        if (usedCount === 0 || usedCount !== selectedDice.length) {
          return game; // Invalid selection
        }
        
        newData.currentTurnScore += selectedScore;
        newData.savedDice.push(...selectedDice);
        
        // Hot Dice: If all 6 dice are used, reset savedDice to allow rolling all 6 again
        if (newData.savedDice.length === 6) {
          newData.savedDice = [];
        }
      }

      const numToRoll = 6 - newData.savedDice.length;
      const rolled = Array(numToRoll).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
      newData.dice = rolled;
      newData.isFirstRoll = false;
      
      // Check for Farkle in the new roll
      const { score: potentialScore } = calculateDiceScore(rolled);
      if (potentialScore === 0) {
        newData.currentTurnScore = 0;
        newData.farkled = true;
        nextTurn = opponentId;
        // Reset turn state but keep dice for visibility
        newData.savedDice = [];
        newData.isFirstRoll = true;
      } else {
        newData.farkled = false;
      }
    } else if (moveData.type === 'bank') {
      const selectedDice = (moveData.selectedIndices || []).map((i: number) => newData.dice[i]);
      const { score: selectedScore, usedCount } = calculateDiceScore(selectedDice);
      
      // If they have selected dice, they must be valid
      if (selectedDice.length > 0 && (usedCount === 0 || usedCount !== selectedDice.length)) {
        return game;
      }

      const totalTurnScore = newData.currentTurnScore + selectedScore;
      
      // In some rules, you need a minimum to "get on the board" (e.g. 500 or 1000)
      // But let's keep it simple for now unless requested.
      
      newData.score[userId] = (newData.score[userId] || 0) + totalTurnScore;
      newData.currentTurnScore = 0;
      newData.dice = [];
      newData.savedDice = [];
      newData.isFirstRoll = true;
      nextTurn = opponentId;
      
      if (newData.score[userId] >= 10000) {
        status = 'finished';
        winner = userId;
      }
    }
  } else if (game.type === 'blackjack') {
    if (moveData.type === 'deal') {
      if (newData.status !== 'playing') {
        newData.deck = createDeck();
        newData.players.forEach((p: any) => {
          p.hand = [drawCard(newData.deck), drawCard(newData.deck)];
          p.score -= 100; // Standard bet
        });
        newData.dealerHand = [drawCard(newData.deck), drawCard(newData.deck)];
        newData.pot = newData.players.length * 100;
        newData.currentPlayerIndex = 0;
        newData.status = 'playing';
        nextTurn = newData.players[0].id;
        status = 'playing';

        // Check if first player has immediate blackjack
        const firstPlayer = newData.players[0];
        if (getBlackjackValue(firstPlayer.hand) === 21) {
          // Auto-stand for blackjack
          if (newData.players.length > 1) {
            newData.currentPlayerIndex = 1;
            nextTurn = newData.players[1].id;
          } else {
            dealerPlay(newData);
            // Internal data status becomes 'finished', but top-level status stays 'playing'
          }
        }
      }
    } else if (moveData.type === 'hit') {
      const p = newData.players[newData.currentPlayerIndex];
      p.hand.push(drawCard(newData.deck));
      const val = getBlackjackValue(p.hand);
      
      if (val >= 21) {
        // Move to next player or dealer
        if (newData.currentPlayerIndex < newData.players.length - 1) {
          newData.currentPlayerIndex++;
          nextTurn = newData.players[newData.currentPlayerIndex].id;
        } else {
          dealerPlay(newData);
          // Internal data status becomes 'finished', but top-level status stays 'playing'
        }
        status = 'playing';
      }
    } else if (moveData.type === 'stand') {
      if (newData.currentPlayerIndex < newData.players.length - 1) {
        newData.currentPlayerIndex++;
        nextTurn = newData.players[newData.currentPlayerIndex].id;
      } else {
        dealerPlay(newData);
        // Internal data status becomes 'finished', but top-level status stays 'playing'
      }
      status = 'playing';
    }
  } else if (game.type === 'rummy') {
    const { type: moveType, cardIndex, fromDiscard } = moveData;
    const player = newData.players.find((p: any) => p.id === userId);
    
    if (moveType === 'draw') {
      if (newData.turnPhase !== 'draw') return game;
      
      let drawnCard;
      if (fromDiscard) {
        drawnCard = newData.discardPile.pop();
      } else {
        drawnCard = drawCard(newData.deck);
      }
      
      if (drawnCard) {
        player.hand.push(drawnCard);
        newData.turnPhase = 'discard';
      }
    } else if (moveType === 'discard') {
      if (newData.turnPhase !== 'discard') return game;
      
      const discardedCard = player.hand.splice(cardIndex, 1)[0];
      newData.discardPile.push(discardedCard);
      
      // Check for win (simplified: if hand is empty or all melded)
      // For now, just check if they have 0 cards (which shouldn't happen in standard rummy but good for testing)
      // or if they "knock"
      if (moveData.knock) {
        // Calculate scores
        const myScore = calculateRummyScore(player.hand);
        const opponent = newData.players.find((p: any) => p.id !== userId);
        const oppScore = calculateRummyScore(opponent.hand);
        
        if (myScore < oppScore) {
          status = 'finished';
          winner = userId;
        } else {
          status = 'finished';
          winner = opponentId;
        }
      } else {
        newData.turnPhase = 'draw';
        nextTurn = opponentId;
      }
    }
  }

  return {
    ...game,
    turn: nextTurn,
    status,
    winner,
    data: newData,
    updatedAt: new Date().toISOString()
  };
};
