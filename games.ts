
import { GameState, GameType } from './types';

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
    data.dice = [1, 2, 3, 4, 5, 6];
    data.score = {};
    players.forEach(p => data.score[p.id] = 0);
    data.currentTurnScore = 0;
    data.savedDice = []; // Indices of dice permanently kept this turn
    data.tempSavedIndices = []; // Indices of dice selected from current roll
    data.rollCount = 0;
    data.canBank = false;
    data.lastRollIndices = [0, 1, 2, 3, 4, 5]; // All dice available for first roll
  } else if (type === 'blackjack') {
    data.deck = createDeck();
    data.playerHand = [drawCard(data.deck), drawCard(data.deck)];
    data.dealerHand = [drawCard(data.deck), drawCard(data.deck)];
    data.status = 'playing';
  } else if (type === 'rummy') {
    data.deck = createDeck();
    data.hand = Array(7).fill(0).map(() => drawCard(data.deck));
    data.discardPile = [drawCard(data.deck)];
    data.melds = [];
    data.hasDrawn = false;
  } else if (type === 'billiards') {
    data.balls = [
      { id: 1, x: 70, y: 50, type: 'solid', number: 1 },
      { id: 2, x: 75, y: 45, type: 'solid', number: 2 },
      { id: 3, x: 75, y: 55, type: 'striped', number: 9 },
      { id: 4, x: 80, y: 40, type: 'solid', number: 3 },
      { id: 5, x: 80, y: 50, type: 'black', number: 8 },
      { id: 6, x: 80, y: 60, type: 'striped', number: 10 },
      { id: 7, x: 85, y: 35, type: 'solid', number: 4 },
      { id: 8, x: 85, y: 45, type: 'striped', number: 11 },
      { id: 9, x: 85, y: 55, type: 'solid', number: 5 },
      { id: 10, x: 85, y: 65, type: 'striped', number: 12 },
    ];
    data.cueBall = { x: 25, y: 50 };
    data.power = 50;
    data.angle = 0;
    data.pocketed = [];
    data.playerType = {}; // userId -> 'solid' | 'striped'
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

const calculateDiceScore = (dice: number[]) => {
  const counts: Record<number, number> = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  
  let score = 0;
  let usedCount = 0;

  // 1s and 5s
  if (counts[1] >= 3) {
    score += 1000 * Math.pow(2, counts[1] - 3);
    usedCount += counts[1];
  } else {
    score += (counts[1] || 0) * 100;
    usedCount += (counts[1] || 0);
  }

  if (counts[5] >= 3) {
    score += 500 * Math.pow(2, counts[5] - 3);
    usedCount += counts[5];
  } else {
    score += (counts[5] || 0) * 50;
    usedCount += (counts[5] || 0);
  }

  // Others
  [2, 3, 4, 6].forEach(num => {
    if (counts[num] >= 3) {
      score += num * 100 * Math.pow(2, counts[num] - 3);
      usedCount += counts[num];
    }
  });

  // Special cases: Straight
  if (Object.keys(counts).length === 6) return { score: 1500, allUsed: true };
  
  // Three pairs
  let pairs = 0;
  Object.values(counts).forEach(c => { if (c === 2) pairs++; });
  if (pairs === 3) return { score: 1500, allUsed: true };

  return { score, allUsed: usedCount === dice.length };
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
    const piece = newData.board[fr][fc];
    const myColor = game.players[0].id === userId ? 1 : 2;

    // Basic validation
    if (Math.floor(piece) !== myColor) return game;
    if (newData.board[tr][tc] !== 0) return game;

    const dr = tr - fr;
    const dc = Math.abs(tc - fc);
    const isKing = piece > 2;

    // Move
    if (dc === 1 && ((myColor === 1 && dr === -1) || (myColor === 2 && dr === 1) || (isKing && Math.abs(dr) === 1))) {
      newData.board[tr][tc] = piece;
      newData.board[fr][fc] = 0;
      // Kinging
      if ((myColor === 1 && tr === 0) || (myColor === 2 && tr === 7)) {
        newData.board[tr][tc] = myColor + 2;
      }
      nextTurn = opponentId;
    } 
    // Jump
    else if (dc === 2 && ((myColor === 1 && dr === -2) || (myColor === 2 && dr === 2) || (isKing && Math.abs(dr) === 2))) {
      const mr = fr + dr / 2;
      const mc = fc + (tc - fc) / 2;
      const midPiece = newData.board[mr][mc];
      if (midPiece !== 0 && Math.floor(midPiece) !== myColor) {
        newData.board[tr][tc] = piece;
        newData.board[fr][fc] = 0;
        newData.board[mr][mc] = 0;
        // Kinging
        if ((myColor === 1 && tr === 0) || (myColor === 2 && tr === 7)) {
          newData.board[tr][tc] = myColor + 2;
        }
        // Check for double jump (simplified: always end turn for now, or add logic)
        nextTurn = opponentId;
      }
    }

    // Check win
    const remainingOpponent = newData.board.flat().filter((p: number) => p !== 0 && Math.floor(p) !== myColor);
    if (remainingOpponent.length === 0) {
      status = 'finished';
      winner = userId;
    }

  } else if (game.type === '10000') {
    if (moveData.type === 'roll') {
      // Must have selected at least one scoring die from previous roll if not first roll
      if (newData.rollCount > 0 && newData.tempSavedIndices.length === 0) return game;

      // Calculate score of temp saved dice and add to turn score
      if (newData.tempSavedIndices.length > 0) {
        const tempDice = newData.tempSavedIndices.map((idx: number) => newData.dice[idx]);
        const { score } = calculateDiceScore(tempDice);
        newData.currentTurnScore += score;
        newData.savedDice = [...newData.savedDice, ...newData.tempSavedIndices];
        newData.tempSavedIndices = [];
      }

      // If all dice are saved, reset for hot dice
      if (newData.savedDice.length === 6) {
        newData.savedDice = [];
      }

      const diceToRollCount = 6 - newData.savedDice.length;
      const rolled = Array(diceToRollCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
      
      // Update dice at non-saved positions
      let rollIdx = 0;
      const newDice = [...newData.dice];
      for (let i = 0; i < 6; i++) {
        if (!newData.savedDice.includes(i)) {
          newDice[i] = rolled[rollIdx++];
        }
      }
      newData.dice = newDice;
      newData.rollCount++;
      newData.lastRollIndices = Array.from({length: 6}, (_, i) => i).filter(i => !newData.savedDice.includes(i));

      // Check for Farkle
      const { score: rollScore } = calculateDiceScore(rolled);
      if (rollScore === 0) {
        newData.currentTurnScore = 0;
        newData.savedDice = [];
        newData.tempSavedIndices = [];
        newData.rollCount = 0;
        nextTurn = opponentId;
      } else {
        newData.canBank = (newData.currentTurnScore + rollScore >= 500) || newData.score[userId] > 0;
      }
    } else if (moveData.type === 'bank') {
      // Add current temp selection to score before banking
      let finalTurnScore = newData.currentTurnScore;
      if (newData.tempSavedIndices.length > 0) {
        const tempDice = newData.tempSavedIndices.map((idx: number) => newData.dice[idx]);
        const { score } = calculateDiceScore(tempDice);
        finalTurnScore += score;
      }

      if (finalTurnScore >= 500 || newData.score[userId] > 0) {
        newData.score[userId] = (newData.score[userId] || 0) + finalTurnScore;
        newData.currentTurnScore = 0;
        newData.savedDice = [];
        newData.tempSavedIndices = [];
        newData.rollCount = 0;
        nextTurn = opponentId;
        if (newData.score[userId] >= 10000) {
          status = 'finished';
          winner = userId;
        }
      }
    } else if (moveData.type === 'toggle_dice') {
      const idx = moveData.index;
      // Can only toggle dice from the LAST roll
      if (!newData.lastRollIndices?.includes(idx)) return game;
      
      if (newData.tempSavedIndices.includes(idx)) {
        newData.tempSavedIndices = newData.tempSavedIndices.filter((i: number) => i !== idx);
      } else {
        newData.tempSavedIndices.push(idx);
      }
      
      // Update canBank based on current selection
      const tempDice = newData.tempSavedIndices.map((idx: number) => newData.dice[idx]);
      const { score: tempScore } = calculateDiceScore(tempDice);
      newData.canBank = (newData.currentTurnScore + tempScore >= 500) || newData.score[userId] > 0;
    }
  } else if (game.type === 'blackjack') {
    if (moveData.type === 'hit') {
      newData.playerHand.push(drawCard(newData.deck));
      if (getBlackjackValue(newData.playerHand) > 21) {
        status = 'finished';
        winner = opponentId;
      }
    } else if (moveData.type === 'stand') {
      // Dealer AI
      let dealerVal = getBlackjackValue(newData.dealerHand);
      while (dealerVal < 17) {
        newData.dealerHand.push(drawCard(newData.deck));
        dealerVal = getBlackjackValue(newData.dealerHand);
      }
      
      const playerVal = getBlackjackValue(newData.playerHand);
      status = 'finished';
      if (dealerVal > 21 || playerVal > dealerVal) {
        winner = userId;
      } else if (dealerVal > playerVal) {
        winner = opponentId;
      } else {
        winner = 'draw';
      }
    }
  } else if (game.type === 'rummy') {
    if (moveData.type === 'draw' && !newData.hasDrawn) {
      newData.hand.push(drawCard(newData.deck));
      newData.hasDrawn = true;
    } else if (moveData.type === 'draw_discard' && !newData.hasDrawn) {
      if (newData.discardPile.length > 0) {
        newData.hand.push(newData.discardPile.pop());
        newData.hasDrawn = true;
      }
    } else if (moveData.type === 'discard' && newData.hasDrawn) {
      const card = newData.hand.splice(moveData.index, 1)[0];
      newData.discardPile.push(card);
      newData.hasDrawn = false;
      nextTurn = opponentId;
      if (newData.hand.length === 0) {
        status = 'finished';
        winner = userId;
      }
    } else if (moveData.type === 'meld') {
      const meldCards = moveData.indices.map((i: number) => newData.hand[i]);
      // Simplified meld validation (always allow for now, or add logic)
      newData.melds.push(meldCards);
      // Remove from hand (sort indices descending to avoid shift issues)
      moveData.indices.sort((a: number, b: number) => b - a).forEach((i: number) => newData.hand.splice(i, 1));
      if (newData.hand.length === 0) {
        status = 'finished';
        winner = userId;
      }
    }
  } else if (game.type === 'billiards') {
    if (moveData.type === 'aim') newData.angle = moveData.angle;
    else if (moveData.type === 'power') newData.power = moveData.power;
    else if (moveData.type === 'shoot') {
      // Simulate pocketing
      const shot = Math.random();
      if (shot > 0.6) {
        const pocketedIdx = Math.floor(Math.random() * newData.balls.length);
        const ball = newData.balls.splice(pocketedIdx, 1)[0];
        newData.pocketed.push(ball);
        // Assign types
        if (!newData.playerType[userId]) {
          newData.playerType[userId] = ball.type;
          newData.playerType[opponentId] = ball.type === 'solid' ? 'striped' : 'solid';
        }
        // If pocketed own type or 8-ball logic
        if (ball.type === 'black') {
          status = 'finished';
          winner = newData.balls.length === 0 ? userId : opponentId;
        }
      } else {
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
