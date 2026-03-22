
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
    data.bet = 100; // Default bet
  } else if (type === 'rummy') {
    data.deck = createDeck();
    data.hand = [];
    for (let i = 0; i < 7; i++) data.hand.push(drawCard(data.deck));
    data.discardPile = [drawCard(data.deck)];
    data.melds = [];
    data.hasDrawn = false;
  } else if (type === 'billiards') {
    data.balls = [
      { id: 1, x: 70, y: 50, type: 'solid', number: 1 },
      { id: 2, x: 73, y: 48.5, type: 'solid', number: 2 },
      { id: 3, x: 73, y: 51.5, type: 'striped', number: 9 },
      { id: 4, x: 76, y: 47, type: 'solid', number: 3 },
      { id: 5, x: 76, y: 50, type: 'black', number: 8 },
      { id: 6, x: 76, y: 53, type: 'striped', number: 10 },
      { id: 7, x: 79, y: 45.5, type: 'solid', number: 4 },
      { id: 8, x: 79, y: 48.5, type: 'striped', number: 11 },
      { id: 9, x: 79, y: 51.5, type: 'solid', number: 5 },
      { id: 10, x: 79, y: 54.5, type: 'striped', number: 12 },
      { id: 11, x: 82, y: 44, type: 'striped', number: 13 },
      { id: 12, x: 82, y: 47, type: 'solid', number: 6 },
      { id: 13, x: 82, y: 50, type: 'striped', number: 14 },
      { id: 14, x: 82, y: 53, type: 'solid', number: 7 },
      { id: 15, x: 82, y: 56, type: 'striped', number: 15 },
    ];
    data.cueBall = { x: 25, y: 50 };
    data.power = 0;
    data.angle = 0;
    data.pocketed = [];
    data.playerType = {}; // userId -> 'solid' | 'striped'
    data.lastPocketed = [];
    data.foul = null;
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

const isValidMeld = (cards: any[]) => {
  if (cards.length < 3) return false;

  // Check for Set (same rank)
  const allSameRank = cards.every(c => c.value === cards[0].value);
  if (allSameRank) return true;

  // Check for Run (same suit, sequential rank)
  const allSameSuit = cards.every(c => c.suit === cards[0].suit);
  if (allSameSuit) {
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const indices = cards.map(c => values.indexOf(c.value)).sort((a, b) => a - b);
    
    // Check for sequential indices
    for (let i = 0; i < indices.length - 1; i++) {
      if (indices[i + 1] !== indices[i] + 1) return false;
    }
    return true;
  }

  return false;
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
      // If we have hot dice (all 6 saved), reset for a full roll
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
      newData.tempSavedIndices = []; // Reset selection for new roll

      // Check for Farkle
      const { score: rollScore } = calculateDiceScore(rolled);
      if (rollScore === 0) {
        newData.currentTurnScore = 0;
        newData.savedDice = [];
        newData.tempSavedIndices = [];
        newData.rollCount = 0;
        nextTurn = opponentId;
      } else {
        newData.canBank = (newData.currentTurnScore >= 500) || newData.score[userId] > 0;
      }
    } else if (moveData.type === 'keep') {
      if (newData.tempSavedIndices.length === 0) return game;
      
      const tempDice = newData.tempSavedIndices.map((idx: number) => newData.dice[idx]);
      const { score, usedCount } = calculateDiceScore(tempDice);
      
      // Must only select scoring dice
      if (usedCount !== tempDice.length) return game;
      
      newData.currentTurnScore += score;
      newData.savedDice = [...newData.savedDice, ...newData.tempSavedIndices];
      newData.tempSavedIndices = [];
      newData.lastRollIndices = []; // Cannot toggle these anymore this turn
      
      newData.canBank = (newData.currentTurnScore >= 500) || newData.score[userId] > 0;
    } else if (moveData.type === 'bank') {
      const finalTurnScore = newData.currentTurnScore;

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
    } else if (moveData.type === 'double' && newData.playerHand.length === 2) {
      newData.bet *= 2;
      newData.playerHand.push(drawCard(newData.deck));
      if (getBlackjackValue(newData.playerHand) > 21) {
        status = 'finished';
        winner = opponentId;
      } else {
        // Dealer AI (must stand after double)
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
      if (isValidMeld(meldCards)) {
        newData.melds.push(meldCards);
        // Remove from hand (sort indices descending to avoid shift issues)
        moveData.indices.sort((a: number, b: number) => b - a).forEach((i: number) => newData.hand.splice(i, 1));
        if (newData.hand.length === 0) {
          status = 'finished';
          winner = userId;
        }
      }
    }
  } else if (game.type === 'billiards') {
    if (moveData.type === 'aim') newData.angle = moveData.angle;
    else if (moveData.type === 'power') newData.power = moveData.power;
    else if (moveData.type === 'call_ball') newData.calledShot = moveData.ball;
    else if (moveData.type === 'call_pocket') newData.targetPocket = moveData.pocket;
    else if (moveData.type === 'change_mode') newData.mode = moveData.mode;
    else if (moveData.type === 'shoot') {
      const cueX = newData.cueBall.x;
      const cueY = newData.cueBall.y;
      const angleRad = (newData.angle * Math.PI) / 180;
      
      // Find the first ball hit by the cue ball along the shot line
      let hitBallIdx = -1;
      let minDistance = Infinity;

      newData.balls.forEach((ball: any, idx: number) => {
        // Vector from cue to ball
        const dx = ball.x - cueX;
        const dy = ball.y - cueY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Angle to ball
        const ballAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(ballAngle - angleRad);
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        // If the angle is close enough (within ~5 degrees)
        if (Math.abs(normalizedDiff) < 0.1) {
          if (dist < minDistance) {
            minDistance = dist;
            hitBallIdx = idx;
          }
        }
      });

      if (hitBallIdx !== -1) {
        const ball = newData.balls[hitBallIdx];
        // Simulate where the ball goes after being hit
        // For simplicity, we'll say it goes in the direction of the hit
        // and has a chance to be pocketed based on power
        const successChance = (newData.power / 100) * 0.8;
        if (Math.random() < successChance) {
          newData.balls.splice(hitBallIdx, 1);
          newData.pocketed.push(ball);
          
          // Assign types if not already assigned
          if (!newData.playerType[userId] && ball.type !== 'black') {
            newData.playerType[userId] = ball.type;
            newData.playerType[opponentId] = ball.type === 'solid' ? 'striped' : 'solid';
          }

          // Move cue ball to a new position after a shot
          newData.cueBall = {
            x: Math.max(10, Math.min(90, newData.cueBall.x + (Math.random() - 0.5) * 40)),
            y: Math.max(10, Math.min(90, newData.cueBall.y + (Math.random() - 0.5) * 40))
          };
          
          // Win/Loss logic for 8-ball
          if (ball.type === 'black') {
            const myType = newData.playerType[userId];
            const myBallsRemaining = newData.balls.filter((b: any) => b.type === myType).length;
            status = 'finished';
            winner = myBallsRemaining === 0 ? userId : opponentId;
          }
        } else {
          // Missed shot: move cue ball slightly
          newData.cueBall = {
            x: Math.max(10, Math.min(90, newData.cueBall.x + (Math.random() - 0.5) * 20)),
            y: Math.max(10, Math.min(90, newData.cueBall.y + (Math.random() - 0.5) * 20))
          };
          nextTurn = opponentId;
        }
      } else {
        // Scratched or missed: move cue ball slightly
        newData.cueBall = {
          x: Math.max(10, Math.min(90, newData.cueBall.x + (Math.random() - 0.5) * 30)),
          y: Math.max(10, Math.min(90, newData.cueBall.y + (Math.random() - 0.5) * 30))
        };
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
