import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

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

  const PORT = 3000;

  // In-memory store for messages (in a real app, use a database)
  const messages: any[] = [];
  const users: Map<string, string> = new Map(); // socketId -> userId

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
