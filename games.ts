
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
    data.deck = createDeck();
    data.hands = {};
    players.forEach(p => {
      data.hands[p.id] = [];
      for (let i = 0; i < 10; i++) data.hands[p.id].push(drawCard(data.deck));
    });
    data.discardPile = [drawCard(data.deck)];
    data.melds = [];
    data.hasDrawn = false;
    data.score = {};
    players.forEach(p => data.score[p.id] = 0);
  } else if (type === 'billiards') {
    const balls: any[] = [];
    const colors = ["red", "yellow", "blue", "orange", "purple", "pink"];
    const startX = 600;
    const startY = 250;

    for (let row = 0; row < 5; row++) {
      for (let i = 0; i <= row; i++) {
        balls.push({
          x: startX + row * 22,
          y: startY - row * 11 + i * 22,
          vx: 0,
          vy: 0,
          color: colors[(row + i) % colors.length],
          active: true
        });
      }
    }

    data.balls = balls;
    data.cueBall = { x: 200, y: 250, vx: 0, vy: 0, color: "white", active: true };
    data.width = 900;
    data.height = 500;
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

        // Check if first player has immediate blackjack
        const firstPlayer = newData.players[0];
        if (getBlackjackValue(firstPlayer.hand) === 21) {
          // Auto-stand for blackjack
          if (newData.players.length > 1) {
            newData.currentPlayerIndex = 1;
            nextTurn = newData.players[1].id;
          } else {
            dealerPlay(newData);
            status = 'finished';
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
          status = 'finished';
        }
      }
    } else if (moveData.type === 'stand') {
      if (newData.currentPlayerIndex < newData.players.length - 1) {
        newData.currentPlayerIndex++;
        nextTurn = newData.players[newData.currentPlayerIndex].id;
      } else {
        dealerPlay(newData);
        status = 'finished';
      }
    }
  }
  else if (game.type === 'rummy') {
    const hand = newData.hands[userId];
    const opponentHand = newData.hands[opponentId];

    if (moveData.type === 'draw' && !newData.hasDrawn) {
      hand.push(drawCard(newData.deck));
      newData.hasDrawn = true;
    } else if (moveData.type === 'draw_discard' && !newData.hasDrawn) {
      if (newData.discardPile.length > 0) {
        hand.push(newData.discardPile.pop());
        newData.hasDrawn = true;
      }
    } else if (moveData.type === 'discard' && newData.hasDrawn) {
      const card = hand.splice(moveData.index, 1)[0];
      newData.discardPile.push(card);
      newData.hasDrawn = false;
      
      if (hand.length === 0) {
        status = 'finished';
        winner = userId;
        // Winner gets points based on opponent's hand
        // Face cards = 10, Aces = 1, others = value
        const calculatePoints = (h: any[]) => h.reduce((sum, c) => {
          if (['J', 'Q', 'K'].includes(c.value)) return sum + 10;
          if (c.value === 'A') return sum + 1;
          return sum + parseInt(c.value);
        }, 0);
        const points = calculatePoints(opponentHand);
        newData.score[userId] = (newData.score[userId] || 0) + points;
      } else {
        nextTurn = opponentId;
      }
    } else if (moveData.type === 'meld') {
      const meldCards = moveData.indices.map((i: number) => hand[i]);
      if (isValidMeld(meldCards)) {
        newData.melds.push(meldCards);
        // Remove from hand (sort indices descending to avoid shift issues)
        moveData.indices.sort((a: number, b: number) => b - a).forEach((i: number) => hand.splice(i, 1));
        
        if (hand.length === 0) {
          status = 'finished';
          winner = userId;
          const calculatePoints = (h: any[]) => h.reduce((sum, c) => {
            if (['J', 'Q', 'K'].includes(c.value)) return sum + 10;
            if (c.value === 'A') return sum + 1;
            return sum + parseInt(c.value);
          }, 0);
          const points = calculatePoints(opponentHand);
          newData.score[userId] = (newData.score[userId] || 0) + points;
        }
      }
    } else if (moveData.type === 'sort') {
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      hand.sort((a: any, b: any) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return values.indexOf(a.value) - values.indexOf(b.value);
      });
    }
  } else if (game.type === 'billiards') {
    if (moveData.type === 'shoot') {
      const { dx, dy } = moveData;
      newData.cueBall.vx = dx * 0.1;
      newData.cueBall.vy = dy * 0.1;

      // Simulate until stopped
      const FRICTION = 0.99;
      const BALL_RADIUS = 10;
      const POCKET_RADIUS = 18;
      const pockets = [
        { x: 0, y: 0 },
        { x: newData.width / 2, y: 0 },
        { x: newData.width, y: 0 },
        { x: 0, y: newData.height },
        { x: newData.width / 2, y: newData.height },
        { x: newData.width, y: newData.height }
      ];

      const allBalls = [newData.cueBall, ...newData.balls];

      let iterations = 0;
      const maxIterations = 2000; // Safety cap

      while (iterations < maxIterations) {
        let moving = false;

        // Update positions
        allBalls.forEach(ball => {
          if (!ball.active) return;
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.vx *= FRICTION;
          ball.vy *= FRICTION;

          if (Math.abs(ball.vx) < 0.01) ball.vx = 0;
          if (Math.abs(ball.vy) < 0.01) ball.vy = 0;

          if (ball.vx !== 0 || ball.vy !== 0) moving = true;

          // Wall collisions
          if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx *= -1; }
          if (ball.x > newData.width - BALL_RADIUS) { ball.x = newData.width - BALL_RADIUS; ball.vx *= -1; }
          if (ball.y < BALL_RADIUS) { ball.y = BALL_RADIUS; ball.vy *= -1; }
          if (ball.y > newData.height - BALL_RADIUS) { ball.y = newData.height - BALL_RADIUS; ball.vy *= -1; }

          // Pockets
          pockets.forEach(p => {
            const dx = ball.x - p.x;
            const dy = ball.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
              ball.active = false;
              if (ball === newData.cueBall) {
                ball.x = 200;
                ball.y = 250;
                ball.vx = 0;
                ball.vy = 0;
                ball.active = true;
              }
            }
          });
        });

        // Collisions
        for (let i = 0; i < allBalls.length; i++) {
          for (let j = i + 1; j < allBalls.length; j++) {
            const b1 = allBalls[i];
            const b2 = allBalls[j];
            if (!b1.active || !b2.active) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < BALL_RADIUS * 2) {
              // Simple elastic collision
              const angle = Math.atan2(dy, dx);
              const speed1 = Math.hypot(b1.vx, b1.vy);
              const speed2 = Math.hypot(b2.vx, b2.vy);

              b1.vx = speed2 * Math.cos(angle + Math.PI);
              b1.vy = speed2 * Math.sin(angle + Math.PI);
              b2.vx = speed1 * Math.cos(angle);
              b2.vy = speed1 * Math.sin(angle);
              
              // Move balls apart to prevent sticking
              const overlap = BALL_RADIUS * 2 - dist;
              b1.x -= Math.cos(angle) * overlap / 2;
              b1.y -= Math.sin(angle) * overlap / 2;
              b2.x += Math.cos(angle) * overlap / 2;
              b2.y += Math.sin(angle) * overlap / 2;
              
              moving = true;
            }
          }
        }

        if (!moving) break;
        iterations++;
      }

      nextTurn = opponentId;
      
      // Check win condition
      if (newData.balls.every((b: any) => !b.active)) {
        status = 'finished';
        winner = userId;
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
