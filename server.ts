import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import Stripe from "stripe";
import multer from "multer";
import fs from "node:fs";
import admin from "firebase-admin";
import { createInitialGameState, handleMove, getBlackjackValue, getScoringIndices, calculateDiceScore, calculateRummyScore } from "./games.ts";
import { GameState, GameInvite } from "./types.ts";

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

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for high-quality videos
  }
});

// Use process.cwd() for path resolution to be safe in both ESM and CJS environments
const resolvedDirname = process.cwd();

async function startServer() {
  const app = express();
  app.use(express.json());
  
  let firebaseProjectId = "";
  
  // Load Firebase config inside startServer to allow for better error handling
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      firebaseProjectId = firebaseConfig.projectId;
      // Initialize Firebase Admin
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });
        console.log("Firebase Admin initialized successfully.");
      }
    } else {
      console.warn("firebase-applet-config.json not found. Firebase features will be limited.");
    }
  } catch (error) {
    console.error("Error loading Firebase config:", error);
  }

  // Serve static files from public directory explicitly
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
  app.use(express.static("public"));

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // In-memory store for messages (in a real app, use a database)
  const messages: any[] = [];
  const posts: any[] = [
    {
      id: 'post-1',
      userId: 'creator-1',
      content: 'Check out my new masterpiece! This took 40 hours to complete.',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: new Date().toISOString(),
      likes: 450,
      commentsCount: 32,
      visibility: 'public',
      category: 'Art',
    },
    {
      id: 'post-2',
      userId: 'creator-1',
      content: 'Secret technique I used for the shading in my last piece.',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 120,
      commentsCount: 15,
      visibility: 'public',
      category: 'Art',
    },
    {
      id: 'post-3',
      userId: 'creator-2',
      content: 'Unboxing the latest Gemini 3 Developer Kit!',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 890,
      commentsCount: 104,
      visibility: 'public',
      category: 'Tech',
    },
    {
      id: 'jade-post-1',
      userId: 'ai-jade',
      content: 'The ink tells the story that words can\'t. 🖤 New set showing off the full chest piece details. Who\'s ready to see the close-ups?',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      likes: 1240,
      commentsCount: 88,
      visibility: 'public',
      category: 'Lifestyle',
    },
    {
      id: 'jade-post-2',
      userId: 'ai-jade',
      content: 'ShareBares sessions. The contrast of the black ink against the neon lights is everything. 🔥😈 Full gallery now in the store.',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 3500,
      commentsCount: 245,
      visibility: 'private',
      category: 'Exclusive',
    }
  ];
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

      // Send post history
      socket.emit("post_history", posts);
    });

    socket.on("user:update", (data: { userId: string, updates: any }) => {
      console.log(`User update for ${data.userId}:`, data.updates);
      // Broadcast the update to all other clients
      socket.broadcast.emit("user:updated", data);
    });
    
    socket.on("post:create", (post: any) => {
      console.log(`New post from ${post.userId}:`, post.content);
      posts.push(post);
      // Broadcast the new post to all clients
      io.emit("post:created", post);
    });

    socket.on("post:like", (data: { postId: string, userId: string }) => {
      const post = posts.find(p => p.id === data.postId);
      if (post) {
        post.likes = (post.likes || 0) + 1;
        io.emit("post:updated", post);
      }
    });

    socket.on("post:comment", (data: { postId: string, userId: string, text: string }) => {
      const post = posts.find(p => p.id === data.postId);
      if (post) {
        post.commentsCount = (post.commentsCount || 0) + 1;
        io.emit("post:updated", post);
      }
    });

    socket.on("post:delete", (postId: string) => {
      const index = posts.findIndex(p => p.id === postId);
      if (index !== -1) {
        posts.splice(index, 1);
        io.emit("post:deleted", postId);
      }
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
        { id: 'bot', displayName: 'Bare Bear', avatar: '/logo.png', isReady: true, isBot: true }
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

    const executeBotTurn = (gameId: string) => {
      const g = activeGames.get(gameId);
      if (!g) return;

      // Random delay for realism
      const turnDelay = 1500;

      setTimeout(async () => {
        const currentGame = activeGames.get(gameId);
        if (!currentGame) return;

        // Condition for bot to move: must be bot turn AND playing status
        // Exception for Blackjack which has auto-eval phases
        const isBotTurn = currentGame.turn === 'bot' && currentGame.status === 'playing';
        const isBlackjackAuto = currentGame.type === 'blackjack' && 
                               (currentGame.data.status === 'waiting' || currentGame.data.status === 'finished') && 
                               currentGame.players.some(p => p.id === 'bot');

        if (!isBotTurn && !isBlackjackAuto) {
          console.log(`Not bot turn for game ${gameId}. Current turn: ${currentGame.turn}`);
          return;
        }

        console.log(`Executing bot turn for ${currentGame.type} (Game: ${gameId})`);
        
        let botMove: any = null;
        const data = currentGame.data;

        if (currentGame.type === 'checkers') {
          // ... (keep checkers logic as is)
          const myColor = 2; // Bot is always player 2
          const board = data.board;
          const jumps: any[] = [];
          const moves: any[] = [];

          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = board[r][c];
              if (Math.floor(piece) === myColor) {
                const isKing = piece > 2;
                const directions = [];
                if (isKing) directions.push([-1, -1], [-1, 1]);
                directions.push([1, -1], [1, 1]);
                for (const [dr, dc] of directions) {
                  const nr = r + dr, nc = c + dc;
                  if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === 0) moves.push({ from: [r, c], to: [nr, nc] });
                  const jr = r + dr * 2, jc = c + dc * 2;
                  if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
                    const mr = r + dr, mc = c + dc;
                    if (board[mr][mc] !== 0 && Math.floor(board[mr][mc]) !== myColor) jumps.push({ from: [r, c], to: [jr, jc], jumped: [mr, mc] });
                  }
                }
              }
            }
          }
          if (jumps.length > 0) botMove = jumps[Math.floor(Math.random() * jumps.length)];
          else if (moves.length > 0) botMove = moves[Math.floor(Math.random() * moves.length)];

        } else if (currentGame.type === '10000') {
          // ... (keep 10000 logic)
          const scoringIndices = getScoringIndices(data.dice);
          if (data.isFirstRoll) {
            botMove = { type: 'roll', selectedIndices: [] };
          } else if (scoringIndices.length > 0) {
            const selectedDice = scoringIndices.map(i => data.dice[i]);
            const { score: potentialScore } = calculateDiceScore(selectedDice);
            const totalTurnScore = data.currentTurnScore + potentialScore;
            if (totalTurnScore >= 750 || (totalTurnScore >= 350 && Math.random() > 0.5)) {
              botMove = { type: 'bank', selectedIndices: scoringIndices };
            } else {
              botMove = { type: 'roll', selectedIndices: scoringIndices };
            }
          } else {
            botMove = { type: 'bank', selectedIndices: [] };
          }

        } else if (currentGame.type === 'blackjack') {
          // ... (keep blackjack logic)
          if (data.status === 'playing' && data.currentPlayerIndex === 1) {
            const val = getBlackjackValue(data.players[1].hand);
            botMove = val < 17 ? { type: 'hit' } : { type: 'stand' };
          }
        } else if (currentGame.type === 'rummy') {
          // ... (keep rummy logic)
          if (data.turnPhase === 'draw') {
            const drawFromDiscard = data.discardPile.length > 0 && Math.random() > 0.5;
            botMove = { type: 'draw', fromDiscard: drawFromDiscard };
          } else if (data.turnPhase === 'discard') {
            const botPlayer = data.players.find((p: any) => p.id === 'bot');
            if (botPlayer) {
              const scoreData = calculateRummyScore(botPlayer.hand);
              const deadwood = typeof scoreData === 'number' ? scoreData : scoreData.deadwood;
              if (deadwood <= 10) botMove = { type: 'discard', cardIndex: 0, knock: true };
              else botMove = { type: 'discard', cardIndex: Math.floor(Math.random() * botPlayer.hand.length) };
            }
          }
        }

        if (botMove) {
          const resultGame = handleMove(currentGame, 'bot', botMove);
          activeGames.set(gameId, resultGame);
          resultGame.players.forEach(p => {
            if (p.id !== 'bot') io.to(p.id).emit("game:updated", resultGame);
          });

          // Chance for bot to trash talk
          if (Math.random() > 0.8) {
            const botMessages = ["Nice try!", "Master of the table.", "Feeling lucky!", "Don't blink.", "I'm on fire!"];
            const msg = { id: `msg-${Date.now()}`, userId: 'bot', displayName: 'Bare Bear', text: botMessages[Math.floor(Math.random() * botMessages.length)], timestamp: Date.now() };
            resultGame.players.forEach(p => { if (p.id !== 'bot') io.to(p.id).emit("game:message", msg); });
          }

          // Continue if still bot turn
          if ((resultGame.turn === 'bot' && resultGame.status === 'playing') || 
              (resultGame.type === 'blackjack' && (resultGame.status === 'waiting' || resultGame.status === 'finished'))) {
            executeBotTurn(gameId);
          }
        }
      }, turnDelay);
    };

    socket.on("game:move", (data: { gameId: string, userId: string, move: any }) => {
      const game = activeGames.get(data.gameId);
      if (game) {
        const updatedGame = handleMove(game, data.userId, data.move);
        activeGames.set(data.gameId, updatedGame);
        
        // Broadcast update to all
        game.players.forEach(p => {
          if (p.id !== 'bot') io.to(p.id).emit("game:updated", updatedGame);
        });

        // Trigger bot if needed
        const isBotActive = (updatedGame.turn === 'bot' && updatedGame.status === 'playing') || 
                           (updatedGame.type === 'blackjack' && (updatedGame.data.status === 'waiting' || updatedGame.data.status === 'finished') && updatedGame.players.some(p => p.id === 'bot'));
        
        if (isBotActive) {
          executeBotTurn(data.gameId);
        }

        // Automatic continuous Blackjack loop
        if (updatedGame.type === 'blackjack' && updatedGame.data.status === 'finished') {
          // Clear any existing timeouts for this game to prevent duplicates
          if ((global as any).blackjackTimeouts?.[data.gameId]) {
            clearTimeout((global as any).blackjackTimeouts[data.gameId]);
          }
          if (!(global as any).blackjackTimeouts) (global as any).blackjackTimeouts = {};

          (global as any).blackjackTimeouts[data.gameId] = setTimeout(() => {
            const currentGame = activeGames.get(data.gameId);
            if (currentGame && currentGame.data.status === 'finished') {
              // Deal new hand
              const nextHand = handleMove(currentGame, 'system', { type: 'deal' });
              activeGames.set(data.gameId, nextHand);
              
              // Broadcast the new hand to all human players
              nextHand.players.forEach(p => {
                if (p.id !== 'bot') io.to(p.id).emit("game:updated", nextHand);
              });

              if (nextHand.turn === 'bot' && nextHand.status === 'playing') {
                executeBotTurn(data.gameId);
              }
            }
            delete (global as any).blackjackTimeouts[data.gameId];
          }, 4500); // 4.5s delay to review the hand outcome
        }
      }
    });

    socket.on("game:message", (data: { gameId: string, userId: string, text: string, displayName: string }) => {
      const game = activeGames.get(data.gameId);
      if (game) {
        const message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: data.userId,
          displayName: data.displayName,
          text: data.text,
          timestamp: Date.now()
        };
        
        // Send to all players in the game, but avoid duplicates if player plays against themselves
        const playerIds = new Set(game.players.map(p => p.id).filter(id => id !== 'bot'));
        playerIds.forEach(id => {
          io.to(id).emit("game:message", message);
        });
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

  // Custom Auth Login for Admin (Bypasses need for Email/Password provider in console)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const trimmedEmail = email?.trim()?.toLowerCase();
      const trimmedPassword = password?.trim();
      
      console.log(`Login attempt for: ${trimmedEmail}`);
      
      // Admin credentials check (hardcoded for bootstrap admin)
      if ((trimmedEmail === "jtothek319@gmail.com" || trimmedEmail === "jameson319") && trimmedPassword === "#Caleb918") {
        console.log("Admin credentials matched. Generating custom token...");
        
        // Use a fixed UID for the admin to avoid calling Identity Toolkit API (getUserByEmail/createUser)
        // Firebase will automatically create the user record when the client signs in with this token.
        const adminUid = "admin-jtothek319";
        try {
          console.log("Attempting to create custom token for:", adminUid);
          const customToken = await admin.auth().createCustomToken(adminUid, {
            email: "jtothek319@gmail.com",
            admin: true
          });
          
          console.log("Generated custom token for admin UID:", adminUid);
          return res.json({ customToken, uid: adminUid });
        } catch (tokenError: any) {
          console.error("Token generation error details:", {
            message: tokenError.message,
            code: tokenError.code,
            stack: tokenError.stack
          });
          
          const errorMessage = tokenError.message || String(tokenError);
          if (errorMessage.includes("iamcredentials.googleapis.com") || errorMessage.includes("permission denied") || errorMessage.includes("403")) {
            return res.status(200).json({ 
              error: "IAM_API_DISABLED", 
              message: "The 'IAM Service Account Credentials API' is disabled OR the service account lacks permissions.",
              details: errorMessage,
              link: `https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=${firebaseProjectId}`
            });
          }
          return res.status(500).json({ error: "TOKEN_GENERATION_FAILED", message: errorMessage });
        }
      }
      
      console.log(`Invalid credentials for: ${trimmedEmail}`);
      res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    } catch (error: any) {
      console.error("Auth error:", error);
      res.status(500).json({ error: "SERVER_ERROR", message: error.message || String(error) });
    }
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
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite
    app.get("*all", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(resolvedDirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
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

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
