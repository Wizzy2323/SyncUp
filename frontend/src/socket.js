import { io } from "socket.io-client";
import { serverUrl } from "./main";

let socket = null;
let initialized = false;

export const initSocket = (userId) => {
  // अगर पहले से initialized है तो सिर्फ return करो
  if (initialized && socket) {
    console.log("✅ Socket already initialized, reusing...");
    return socket;
  }

  console.log("🔗 Initializing socket for user:", userId);
  
  socket = io(serverUrl, {
    query: { userId },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // ⚠️ Pehle yahan reconnectionAttempts: 5 tha. Backend restart/redeploy
    // (e.g. nodemon restart, npm install ke baad fresh start) usually
    // 5 attempts ke total retry window (~15-20s) se zyada time leta hai.
    // Result: client retry karke HAAR jaata hai aur permanently disconnected
    // reh jaata hai — bina kisi UI feedback ke ("looks connected" but isn't).
    // Infinity rakhne se yeh capped-backoff ke saath hamesha retry karta
    // rahega jab tak server wapas available na ho.
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected! ID:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason, "— will auto-retry...");
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔁 Reconnect attempt #${attempt}...`);
  });

  socket.on("reconnect", (attempt) => {
    console.log(`✅ Reconnected after ${attempt} attempt(s)! New ID:`, socket.id);
  });

  initialized = true;
  return socket;
};

export const getSocket = () => socket;

// Call this on logout so the NEXT initSocket() call (possibly for a
// different account in the same tab) opens a fresh connection tagged
// with the correct userId, instead of silently reusing a socket that
// still carries the previous user's identity.
export const closeSocket = () => {
  if (socket) {
    console.log("🔌 Closing socket on logout:", socket.id);
    socket.disconnect();
  }
  socket = null;
  initialized = false;
};