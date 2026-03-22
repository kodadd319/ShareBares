import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import multer from "multer";
import fs from "fs";
import { createInitialGameState, handleMove, getBlackjackValue } from "./games.ts";
import { GameState, GameInvite } from "./types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  app.use(express.json()); // Add JSON body parser
  
  // Serve static files from public directory
  app.use(express.static("public"));

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
  const pendingInvites: Map<string, GameInvite> = new Map(); // inviteId -> GameInvite

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("identify", (userId: string) => {
      users.set(socket.id, userId);
      socket.data.user = { id: userId }; // Store user info on socket
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
    
    socket.on("post:create", (post: any) => {
      console.log(`New post from ${post.userId}:`, post.content);
      // Broadcast the new post to all other clients
      socket.broadcast.emit("post:created", post);
    });

    socket.on("send_message", (data: { senderId: string, receiverId: string, text: string }) => {
      const newMessage = {
        id: `msg-${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      messages.push(newMessage);
      
      // Send to receiver
      io.to(data.receiverId).emit("receive_message", newMessage);
      
      // Send back to sender (for sync across multiple tabs if needed, or just confirmation)
      socket.emit("message_sent", newMessage);
      
      console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.text}`);
    });

    socket.on("mark_messages_read", (data: { senderId: string, receiverId: string }) => {
      messages.forEach(m => {
        if (m.senderId === data.senderId && m.receiverId === data.receiverId) {
          m.isRead = true;
        }
      });
      io.to(data.receiverId).emit("messages_marked_read", data);
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
    socket.on("game:invite_send", (data: { from: any, toId: string, gameType: any }) => {
      const inviteId = `invite-${Date.now()}`;
      const invite: GameInvite = {
        id: inviteId,
        from: data.from,
        toId: data.toId,
        gameType: data.gameType,
        timestamp: new Date().toISOString()
      };
      
      pendingInvites.set(inviteId, invite);
      console.log(`Game invite ${inviteId} from ${invite.from.id} to ${invite.toId} for ${invite.gameType}`);
      io.to(invite.toId).emit("game:invite_received", invite);
    });

    socket.on("game:invite_accept", (data: { inviteId: string, user: any }) => {
      const invite = pendingInvites.get(data.inviteId);
      if (invite) {
        const gameId = `game-${Date.now()}`;
        const players = [
          { ...invite.from, isReady: false, isBot: false },
          { id: data.user.id, displayName: data.user.displayName, avatar: data.user.avatar, isReady: false, isBot: false }
        ];
        const initialGameState = createInitialGameState(gameId, invite.gameType, players);
        
        activeGames.set(gameId, initialGameState);
        pendingInvites.delete(data.inviteId);
        
        // Notify both players
        io.to(invite.from.id).emit("game:started", initialGameState);
        io.to(data.user.id).emit("game:started", initialGameState);
      }
    });

    socket.on("game:invite_decline", (data: { inviteId: string }) => {
      const invite = pendingInvites.get(data.inviteId);
      if (invite) {
        io.to(invite.from.id).emit("game:invite_declined", { inviteId: data.inviteId });
        pendingInvites.delete(data.inviteId);
      }
    });

    socket.on("game:bot_start", (data: { gameType: any, user: any }) => {
      const gameId = `game-bot-${Date.now()}`;
      const players = [
        { id: data.user.id, displayName: data.user.displayName, avatar: data.user.avatar, isReady: true, isBot: false }, 
        { id: 'bot', displayName: 'BareBear', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BareBear', isReady: true, isBot: true }
      ];
      const initialGameState = createInitialGameState(gameId, data.gameType, players);
      initialGameState.status = 'playing'; // Start immediately for bot games
      
      activeGames.set(gameId, initialGameState);
      socket.emit("game:started", initialGameState);
    });

    socket.on("game:ready", (data: { gameId: string }) => {
      const game = activeGames.get(data.gameId);
      const userId = socket.data.user?.id;
      
      if (game && userId) {
        const player = game.players.find(p => p.id === userId);
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
              const myColor: number = 2; // Bot is always player 2
              const board = data.board;
              const jumps: any[] = [];
              const moves: any[] = [];

              for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                  const piece = board[r][c];
                  if (Math.floor(piece) === myColor) {
                    const isKing = piece > 2;
                    const directions = [];
                    if (myColor === 1 || isKing) directions.push([-1, -1], [-1, 1]);
                    if (myColor === 2 || isKing) directions.push([1, -1], [1, 1]);

                    for (const [dr, dc] of directions) {
                      const nr = r + dr;
                      const nc = c + dc;
                      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === 0) {
                        moves.push({ from: [r, c], to: [nr, nc] });
                      }
                      const jr = r + dr * 2;
                      const jc = c + dc * 2;
                      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
                        const mr = r + dr;
                        const mc = c + dc;
                        const mid = board[mr][mc];
                        if (mid !== 0 && Math.floor(mid) !== myColor) {
                          jumps.push({ from: [r, c], to: [jr, jc] });
                        }
                      }
                    }
                  }
                }
              }
              if (jumps.length > 0) botMove = jumps[Math.floor(Math.random() * jumps.length)];
              else if (moves.length > 0) botMove = moves[Math.floor(Math.random() * moves.length)];
            } else if (updatedGame.type === '10000') {
              // Bot logic for 10,000:
              // 1. If we have temp dice to save, save them first
              if (data.lastRollIndices && data.lastRollIndices.length > 0) {
                const lastDice = data.lastRollIndices.map((idx: number) => data.dice[idx]);
                // Find scoring dice indices
                const scoringIndices: number[] = [];
                data.lastRollIndices.forEach((idx: number) => {
                  const val = data.dice[idx];
                  if (val === 1 || val === 5) scoringIndices.push(idx);
                  // Also check for 3 of a kind (simplified)
                });
                
                if (scoringIndices.length > 0 && data.tempSavedIndices.length === 0) {
                  botMove = { type: 'toggle_dice', index: scoringIndices[0] }; // Just pick one for now to keep it simple but functional
                } else if (data.currentTurnScore + 100 >= 750 || (data.currentTurnScore >= 500 && Math.random() > 0.5)) {
                  botMove = { type: 'bank' };
                } else {
                  botMove = { type: 'roll' };
                }
              } else {
                botMove = { type: 'roll' };
              }
            } else if (updatedGame.type === 'blackjack') {
              const val = getBlackjackValue(data.playerHand);
              if (val < 17) botMove = { type: 'hit' };
              else botMove = { type: 'stand' };
            } else if (updatedGame.type === 'rummy') {
              if (!data.hasDrawn) {
                botMove = { type: 'draw' };
              } else {
                // Try to meld first
                const hand = data.hand;
                const counts: Record<string, number[]> = {};
                hand.forEach((c: any, i: number) => {
                  counts[c.value] = [...(counts[c.value] || []), i];
                });
                const meldIndices = Object.values(counts).find(indices => indices.length >= 3);
                if (meldIndices) {
                  botMove = { type: 'meld', indices: meldIndices };
                } else {
                  botMove = { type: 'discard', index: 0 };
                }
              }
            } else if (updatedGame.type === 'billiards') {
              if (data.balls.length > 0) {
                const targetBall = data.balls[Math.floor(Math.random() * data.balls.length)];
                const dx = targetBall.x - data.cueBall.x;
                const dy = targetBall.y - data.cueBall.y;
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                botMove = { type: 'aim', angle };
                setTimeout(() => {
                  const shootMove = { type: 'shoot' };
                  const finalUpdatedGame = handleMove(handleMove(updatedGame, 'bot', { type: 'aim', angle }), 'bot', shootMove);
                  activeGames.set(updatedGame.id, finalUpdatedGame);
                  io.to(game.players[0].id).emit("game:updated", finalUpdatedGame);
                }, 1000);
                return;
              } else {
                botMove = { type: 'shoot' };
              }
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

  // File Upload API
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
