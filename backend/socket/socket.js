import http from "http";
import express from "express";
import { Server } from "socket.io";
import Group from "../models/group.model.js";

const app = express();
const server = http.createServer(app);

console.log(`\n🚀 === Socket.IO Server Initializing ===`);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  },
  transports: ["websocket", "polling"],
  path: "/socket.io/",
  serveClient: true,
  pingInterval: 25000,
  pingTimeout: 20000
});

console.log(`✅ Socket.IO Server configured`);
console.log(`   CORS Origin: http://localhost:5173`);
console.log(`   Transports: websocket, polling`);
console.log(`   Path: /socket.io/\n`);

// Map to track users and their socket IDs
const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  const socketId = userSocketMap[receiverId];
  console.log(`🔍 Looking for receiver: ${receiverId}`);
  console.log(`   Found socket ID: ${socketId || "NOT FOUND"}`);
  console.log(`   Current map keys: [${Object.keys(userSocketMap).join(", ")}]`);
  return socketId;
};

// MIDDLEWARE: Log ALL connection attempts
io.use((socket, next) => {
  console.log(`\n🔗 === Connection Attempt ===`);
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Remote Address: ${socket.handshake.address}`);
  console.log(`   User Agent: ${socket.handshake.headers["user-agent"]?.substring(0, 50)}...`);
  console.log(`   Query Params:`, socket.handshake.query);
  console.log(`   Headers Origin: ${socket.handshake.headers.origin}`);
  console.log(`   Transport: ${socket.handshake.transport}`);
  next();
});

// CONNECTION EVENT
io.on("connection", async (socket) => {
  console.log(`\n✅ === Connection Established ===`);
  console.log(`   Socket ID: ${socket.id}`);
  
  const userId = socket.handshake.query.userId;
  console.log(`   Attempting to extract userId from query...`);
  console.log(`   Query object:`, socket.handshake.query);
  console.log(`   Extracted userId: ${userId || "NULL/UNDEFINED"}`);
  
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`\n✅ User mapped successfully:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Total online users: ${Object.keys(userSocketMap).length}`);
    console.log(`   📊 User Map:`, userSocketMap);
    // GROUP ROOMS: is user ke saare groups ke Socket.IO "rooms" join karao
    // taaki use group messages/updates turant (bina refresh) mil sakein.
    try {
      const groups = await Group.find({ members: userId }).select("_id");
      groups.forEach((g) => socket.join(g._id.toString()));
      console.log(`   Joined ${groups.length} group room(s)`);
    } catch (err) {
      console.error(`   ⚠️  Error joining group rooms:`, err.message);
    }
  } else {
    console.warn(`\n⚠️  WARNING: No userId received!`);
    console.warn(`   Socket will NOT be added to user map`);
    console.warn(`   Query received was:`, socket.handshake.query);
  }

  // Emit updated list of online users
  const onlineUsers = Object.keys(userSocketMap);
  io.emit("getOnlineUsers", onlineUsers);
  console.log(`\n📢 Broadcasted online users: [${onlineUsers.join(", ")}]`);

  // MESSAGE EVENTS
  socket.on("newMessage", (data) => {
    console.log(`\n💬 Message event received on socket ${socket.id}`);
    console.log(`   Data:`, data);
  });

  // GROUP ROOM EVENTS — client-side escape hatch: agar kisi wajah se koi
  // socket kisi group ke room me na ho (e.g. group create/add ke waqt user
  // offline tha), yeh events use turant room me daal/nikaal sakte hain.
  socket.on("joinGroup", (groupId) => {
    if (groupId) {
      socket.join(groupId.toString());
      console.log(`   Socket ${socket.id} joined group room ${groupId}`);
    }
  });

  socket.on("leaveGroup", (groupId) => {
    if (groupId) {
      socket.leave(groupId.toString());
      console.log(`   Socket ${socket.id} left group room ${groupId}`);
    }
  });

  // DEBUG EVENT
  socket.on("debug:checkConnection", () => {
    console.log(`\n🔧 Debug request from socket ${socket.id} (userId: ${userId})`);
    socket.emit("debug:response", {
      socketId: socket.id,
      userId: userId,
      userMap: userSocketMap,
      totalUsers: Object.keys(userSocketMap).length,
      timestamp: new Date().toISOString()
    });
  });

  // DISCONNECT EVENT
  socket.on("disconnect", (reason) => {
    console.log(`\n❌ === Socket Disconnected ===`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   User ID: ${userId || "unknown"}`);

    // ⚠️ IMPORTANT: Only remove this user from the map if the mapping
    // still points to THIS socket. On page refresh / HMR reload, the
    // browser opens a NEW socket for the same userId before the OLD
    // socket's disconnect event finishes arriving at the server. If we
    // delete unconditionally here, that late/stale disconnect from the
    // OLD socket wipes out the NEW socket's already-registered mapping,
    // making a genuinely-online user vanish from "getOnlineUsers".
    // Comparing socket.id guards against exactly that race.
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      console.log(`   Removed from map`);
      console.log(`   Remaining users: ${Object.keys(userSocketMap).length}`);
    } else if (userId) {
      console.log(`   Skipped removal — a newer socket (${userSocketMap[userId] || "none"}) is already registered for this user`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // ERROR EVENT
  socket.on("error", (error) => {
    console.error(`\n⚠️  Socket Error:`, error);
    console.error(`   Socket ID: ${socket.id}`);
    console.error(`   User ID: ${userId}`);
  });

  // GENERIC EVENT LOGGER (for debugging)
  socket.onAny((event, ...args) => {
    if (!["disconnect", "connect", "error"].includes(event)) {
      console.log(`📨 Event received on socket ${socket.id}:`, event, args[0]);
    }
  });
});

// LOG when socket server is ready
io.on("connect_error", (error) => {
  console.error(`\n🔴 Socket.IO Connection Error:`, error);
});

server.listen = function(...args) {
  const originalListen = http.Server.prototype.listen;
  console.log(`\n📡 === Server Ready to Listen ===\n`);
  return originalListen.apply(server, args);
};

export { app, server, io, userSocketMap };