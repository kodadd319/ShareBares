import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createInitialGameState, handleMove, getBlackjackValue } from "./games";
import { GameState, GameInvite } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json()); // Add JSON body parser
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  // In-memory store for messages (in a real app, use a database)
  const messages: any[] = [];
  const users: Map<string, string> = new Map(); // socketId -> userId
  const activeGames: Map<string, GameState> = new Map(); // gameId -> GameState

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("identify", (userId: string) => {
      users.set(socket.id, userId);
      console.log(`Socket ${socket.id} identified as ${userId}`);
      
      // Join a room for this user to receive private messages
      socket.join(userId);

      // Send existing messages for this user
      const userMessages = messages.filter(m => m.senderId === userId || m.receiverId === userId);
      socket.emit("message_history", userMessages);
    });

    socket.on("user:update", (data: { userId: string, updates: any }) => {
      console.log(`User update for ${data.userId}:`, data.updates);
      // Broadcast the update to all other clients
      socket.broadcast.emit("user:updated", data);
    });

    socket.on("send_message", (data: { senderId: string, receiverId: string, text: string }) => {
      const newMessage = {
        id: `msg-${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString()
      };
      
      messages.push(newMessage);
      
      // Send to receiver
      io.to(data.receiverId).emit("receive_message", newMessage);
      
      // Send back to sender (for sync across multiple tabs if needed, or just confirmation)
      socket.emit("message_sent", newMessage);
      
      console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.text}`);
    });

    // Signaling for Calls
    socket.on("call_user", (data: { userToCall: string, signalData: any, from: string, name: string, type: 'voice' | 'video' }) => {
      io.to(data.userToCall).emit("incoming_call", { signal: data.signalData, from: data.from, name: data.name, type: data.type });
    });

    socket.on("answer_call", (data: { to: string, signal: any }) => {
      io.to(data.to).emit("call_accepted", data.signal);
    });

    socket.on("ice_candidate", (data: { to: string, candidate: any }) => {
      io.to(data.to).emit("ice_candidate", data.candidate);
    });

    socket.on("end_call", (data: { to: string }) => {
      io.to(data.to).emit("call_ended");
    });

    // Game Room Events
    socket.on("game:invite_send", (invite: GameInvite) => {
      console.log(`Game invite from ${invite.from.id} to ${invite.toId} for ${invite.gameType}`);
      io.to(invite.toId).emit("game:invite_received", invite);
    });

    socket.on("game:invite_accept", (invite: GameInvite) => {
      const gameId = `game-${Date.now()}`;
      const players = [invite.from, { id: invite.toId, name: "Opponent" }]; // Simplified player info
      const initialGameState = createInitialGameState(gameId, invite.gameType, players);
      
      activeGames.set(gameId, initialGameState);
      
      // Notify both players
      io.to(invite.from.id).emit("game:started", initialGameState);
      io.to(invite.toId).emit("game:started", initialGameState);
    });

    socket.on("game:bot_start", (data: { userId: string, gameType: any, user: any }) => {
      const gameId = `game-bot-${Date.now()}`;
      const players = [
        { ...data.user, isReady: true }, 
        { id: 'bot', name: 'BareBear', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BareBear', isReady: true }
      ];
      const initialGameState = createInitialGameState(gameId, data.gameType, players);
      initialGameState.status = 'playing'; // Start immediately for bot games
      
      activeGames.set(gameId, initialGameState);
      socket.emit("game:started", initialGameState);
    });

    socket.on("game:ready", (data: { gameId: string }) => {
      const game = activeGames.get(data.gameId);
      if (game) {
        const player = game.players.find(p => p.id === socket.data.user.id);
        if (player) {
          player.isReady = true;
        }

        // If it's a bot game, bot is always ready
        if (game.players.some(p => p.id === 'bot')) {
          const bot = game.players.find(p => p.id === 'bot');
          if (bot) bot.isReady = true;
        }

        const allReady = game.players.every(p => p.isReady);
        if (allReady) {
          game.status = 'playing';
        }

        // Notify all players in the game
        game.players.forEach(p => {
          if (p.id !== 'bot') {
            io.to(p.id).emit("game:updated", game);
          }
        });
      }
    });

    socket.on("game:move", (data: { gameId: string, userId: string, move: any }) => {
      const game = activeGames.get(data.gameId);
      if (game) {
        const updatedGame = handleMove(game, data.userId, data.move);
        activeGames.set(data.gameId, updatedGame);
        
        // Broadcast update
        io.to(game.players[0].id).emit("game:updated", updatedGame);
        if (game.players[1].id !== 'bot') {
          io.to(game.players[1].id).emit("game:updated", updatedGame);
        } else if (updatedGame.status === 'playing' && updatedGame.turn === 'bot') {
          // Automated Bot Turn
          setTimeout(() => {
            let botMove: any = null;
            const data = updatedGame.data;

            if (updatedGame.type === 'checkers') {
              const moves: any[] = [];
              const myColor = 2; // Bot is always player 2
              for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                  const piece = data.board[r][c];
                  if (Math.floor(piece) === myColor) {
                    const isKing = piece > 2;
                    const directions = isKing ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
                    for (const [dr, dc] of directions) {
                      const tr = r + dr;
                      const tc = c + dc;
                      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && data.board[tr][tc] === 0) {
                        moves.push({ from: [r, c], to: [tr, tc] });
                      }
                      // Jumps
                      const jr = r + dr * 2;
                      const jc = c + dc * 2;
                      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && data.board[jr][jc] === 0) {
                        const mr = r + dr;
                        const mc = c + dc;
                        const mid = data.board[mr][mc];
                        if (mid !== 0 && Math.floor(mid) !== myColor) {
                          moves.push({ from: [r, c], to: [jr, jc] });
                        }
                      }
                    }
                  }
                }
              }
              if (moves.length > 0) botMove = moves[Math.floor(Math.random() * moves.length)];
            } else if (updatedGame.type === '10000') {
              if (data.currentTurnScore >= 500 || (data.currentTurnScore > 0 && Math.random() > 0.7)) {
                botMove = { type: 'bank' };
              } else {
                botMove = { type: 'roll' };
              }
            } else if (updatedGame.type === 'blackjack') {
              // Dealer logic is handled in handleMove when player stands
              // But if bot is a "player", it would hit until 17
              const val = getBlackjackValue(data.playerHand);
              if (val < 17) botMove = { type: 'hit' };
              else botMove = { type: 'stand' };
            } else if (updatedGame.type === 'rummy') {
              if (!data.hasDrawn) {
                botMove = { type: 'draw' };
              } else {
                botMove = { type: 'discard', index: 0 };
              }
            } else if (updatedGame.type === 'billiards') {
              botMove = { type: 'shoot' };
            }

            if (botMove) {
              const botUpdatedGame = handleMove(updatedGame, 'bot', botMove);
              activeGames.set(data.gameId, botUpdatedGame);
              io.to(game.players[0].id).emit("game:updated", botUpdatedGame);
            }
          }, 1500);
        }
      }
    });

    socket.on("game:quit", (data: { gameId: string, userId: string }) => {
      const game = activeGames.get(data.gameId);
      if (game) {
        game.status = 'finished';
        game.winner = game.players.find(p => p.id !== data.userId)?.id;
        io.to(game.players[0].id).emit("game:updated", game);
        if (game.players[1].id !== 'bot') {
          io.to(game.players[1].id).emit("game:updated", game);
        }
        activeGames.delete(data.gameId);
      }
    });

    socket.on("disconnect", () => {
      users.delete(socket.id);
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'usd', metadata, destinationAccountId } = req.body;
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "Stripe secret key not configured" });
      }

      const stripe = new Stripe(stripeSecretKey);

      const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // If a destination account is provided (Stripe Connect), handle the split
      if (destinationAccountId) {
        // Calculate 20% platform fee
        const platformFeeAmount = Math.round(amount * 100 * 0.20);
        
        paymentIntentOptions.application_fee_amount = platformFeeAmount;
        paymentIntentOptions.transfer_data = {
          destination: destinationAccountId,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
