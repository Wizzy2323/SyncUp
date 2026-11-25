import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",

  initialState: {
    userData: null,
    otherUsers: [],
    authChecked: false,
    selectedUser: null,
    socketReady: false,
    onlineUsers: null,
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },

    setOtherUsers: (state, action) => {
      state.otherUsers = action.payload;
    },

    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },

    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },

    // ⚠️ Redux store me sirf ek boolean flag rakho, actual Socket
    // instance kabhi nahi — woh non-serializable hota hai (class
    // instance with functions/internal state) aur Redux Toolkit
    // serializability check warnings dega. Real socket instance
    // socket.js ke module-level singleton (getSocket()) se milta hai;
    // yeh flag sirf components ko "socket ready hai, ab use karo"
    // batane ke liye reactive trigger hai.
    setSocketReady: (state, action) => {
      state.socketReady = action.payload;
    },

    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
  }, // <-- Reducers object ab yahan sahi jagah par close ho raha hai
});

// Saare actions ko sahi naam se export kar diya hai
export const {
  setUserData,
  setOtherUsers,
  setAuthChecked,
  setSelectedUser, // Fixed: selectedUser se badalkar setSelectedUser kiya
  setOnlineUsers,
  setSocketReady
} = userSlice.actions;

export default userSlice.reducer;