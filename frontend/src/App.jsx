// import { useEffect } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { io } from "socket.io-client";

// import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
// import Home from "./pages/Home";
// import Profile from "./pages/Profile";

// import getCurrentUser from "./customHooks/getcurrentUser";
// import getOtherUsers from "./customHooks/getOtherUsers";

// import { setSocket, setOnlineUsers } from "./redux/userSlice";

// // const serverUrl = "http://localhost:5000";
// import { serverUrl } from "./main";

// function App() {
//   getCurrentUser();
//   getOtherUsers();

//   const dispatch = useDispatch();
//   const { userData, authChecked, socket } = useSelector((state) => state.user);

//   useEffect(() => {
//     if (!userData) {
//       console.log("❌ userData is null, skipping socket connection");
//       if (socket) {
//         socket.close();
//         dispatch(setSocket(null));
//       }
//       return;
//     }

//     console.log(`\n🔗 === Frontend Socket Connection Initiating ===`);
//     console.log(`   Server URL: ${serverUrl}`);
//     console.log(`   User ID: ${userData._id}`);
//     console.log(`   User Name: ${userData.name}`);
//     console.log(`   Current Time: ${new Date().toLocaleTimeString()}`);

//     try {
//       console.log(`\n📤 Creating socket.io client with options:`);
//       const socketOptions = {
//         query: { userId: userData._id },
//         withCredentials: true,
//         transports: ["websocket", "polling"],
//         reconnection: true,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         reconnectionAttempts: 5,
//         path: "/socket.io/"
//       };
//       console.log(`   Options:`, socketOptions);

//       const socketio = io(serverUrl, socketOptions);

//       console.log(`✅ Socket.io client created`);
//       console.log(`   Socket object:`, socketio);
//       console.log(`   Socket ID (initial): ${socketio.id}`);

//       // PRE-CONNECTION EVENTS
//       socketio.on("connect_error", (error) => {
//         console.error(`\n❌ === Connection Error ===`);
//         console.error(`   Error:`, error);
//         console.error(`   Error message: ${error.message}`);
//         console.error(`   Error data: ${error.data}`);
//         console.error(`   Error type: ${error.type}`);
//       });

//       socketio.on("error", (error) => {
//         console.error(`\n⚠️  Socket Error:`, error);
//       });

//       socketio.on("connect", () => {
//         console.log(`\n✅ === Socket Connected Successfully ===`);
//         console.log(`   Socket ID: ${socketio.id}`);
//         console.log(`   User ID: ${userData._id}`);
//         console.log(`   Connected at: ${new Date().toLocaleTimeString()}`);
//         console.log(`   Transport: ${socketio.io.transport().name}`);

//         // Trigger debug check on server
//         console.log(`\n🔧 Requesting debug info from server...`);
//         socketio.emit("debug:checkConnection");
//       });

//       socketio.on("disconnect", (reason) => {
//         console.log(`\n⚠️  === Socket Disconnected ===`);
//         console.log(`   Reason: ${reason}`);
//         console.log(`   Disconnected at: ${new Date().toLocaleTimeString()}`);
//       });

//       socketio.on("reconnect_attempt", () => {
//         console.log(`🔄 Attempting to reconnect...`);
//       });

//       socketio.on("reconnect", () => {
//         console.log(`✅ Reconnected successfully!`);
//         console.log(`   New Socket ID: ${socketio.id}`);
//       });

//       // DEBUG RESPONSE from server
//       socketio.on("debug:response", (data) => {
//         console.log(`\n🔧 === Debug Response from Server ===`);
//         console.log(`   Socket ID: ${data.socketId}`);
//         console.log(`   Server knows my userId as: ${data.userId || "NULL"}`);
//         console.log(`   Total users online on server: ${data.totalUsers}`);
//         console.log(`   Server's user map:`, data.userMap);
//         console.log(`   Response timestamp: ${data.timestamp}`);
//       });

//       socketio.on("getOnlineUsers", (users) => {
//         console.log(`\n📊 === Online Users Updated ===`);
//         console.log(`   Total online: ${users.length}`);
//         console.log(`   Users: [${users.join(", ")}]`);
//         dispatch(setOnlineUsers(users));
//       });

//       socketio.on("newMessage", (message) => {
//         console.log(`\n📨 === New Message Received ===`);
//         console.log(`   From: ${message.sender}`);
//         console.log(`   Message: ${message.message}`);
//         console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);
//       });

//      // dispatch(setSocket(socketio));

//       return () => {
//         console.log(`\n🧹 === Cleaning Up Socket ===`);
//         console.log(`   Closing socket...`);
//         socketio.off("connect");
//         socketio.off("connect_error");
//         socketio.off("disconnect");
//         socketio.off("getOnlineUsers");
//         socketio.off("newMessage");
//         socketio.off("debug:response");
//         socketio.close();
//         dispatch(setSocket(null));
//       };
//     } catch (error) {
//       console.error(`\n❌ === Exception in Socket Setup ===`);
//       console.error(`   Error:`, error);
//       console.error(`   Stack:`, error.stack);
//     }
//   }, [userData, dispatch]);

//   if (!authChecked) {
//     return (
//       <div className="h-screen flex justify-center items-center text-xl">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={
//           !userData ? (
//             <Login />
//           ) : (
//             <Navigate to="/profile" replace />
//           )
//         }
//       />

//       <Route
//         path="/signup"
//         element={
//           !userData ? (
//             <SignUp />
//           ) : (
//             <Navigate to="/profile" replace />
//           )
//         }
//       />

//       <Route
//         path="/"
//         element={
//           userData ? (
//             <Home />
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />

//       <Route
//         path="/profile"
//         element={
//           userData ? (
//             <Profile />
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />

//       <Route
//         path="*"
//         element={
//           <Navigate
//             to={userData ? "/profile" : "/login"}
//             replace
//           />
//         }
//       />
//     </Routes>
//   );
// }

// // export default App;
// import { useEffect } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";

// import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
// import Home from "./pages/Home";
// import Profile from "./pages/Profile";

// import getCurrentUser from "./customHooks/getcurrentUser";
// import getOtherUsers from "./customHooks/getOtherUsers";
// import { initSocket } from "./socket";
// import { setOnlineUsers } from "./redux/userSlice";

// function App() {
//   getCurrentUser();
//   getOtherUsers();

//   const dispatch = useDispatch();
//   const { userData, authChecked } = useSelector((state) => state.user);

//   // Socket initialization - सिर्फ एक बार, कभी close नहीं करेंगे
//   useEffect(() => {
//     if (userData) {
//       console.log("🔗 Initializing socket for user:", userData._id);
      
//       // Socket को singleton pattern से initialize करो
//       const socket = initSocket(userData._id);

//       // Online users की list सुनो
//       socket.on("getOnlineUsers", (users) => {
//         console.log("📊 Online users:", users.length);
//         dispatch(setOnlineUsers(users));
//       });

//       // Cleanup: listeners को remove करो, socket को close नहीं करो!
//       return () => {
//         socket.off("getOnlineUsers");
//       };
//     }
//   }, [userData, dispatch]);

//   // Auth check के दौरान loading screen दिखाओ
//   if (!authChecked) {
//     return (
//       <div className="h-screen flex justify-center items-center text-xl">
//         Loading...
//       </div>
//     );
//   }

//   // Routes
//   return (
//     <Routes>
//       {/* Login Route */}
//       <Route
//         path="/login"
//         element={
//           !userData ? (
//             <Login />
//           ) : (
//             <Navigate to="/" replace />
//           )
//         }
//       />

//       {/* Signup Route */}
//       <Route
//         path="/signup"
//         element={
//           !userData ? (
//             <SignUp />
//           ) : (
//             <Navigate to="/" replace />
//           )
//         }
//       />

//       {/* Home Route (Protected) */}
//       <Route
//         path="/"
//         element={
//           userData ? (
//             <Home />
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />

//       {/* Profile Route (Protected) */}
//       <Route
//         path="/profile"
//         element={
//           userData ? (
//             <Profile />
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         }
//       />

//       {/* Catch all - redirect to home or login */}
//       <Route
//         path="*"
//         element={
//           <Navigate
//             to={userData ? "/" : "/login"}
//             replace
//           />
//         }
//       />
//     </Routes>
//   );
// }

// export default App;
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Profile from "./pages/Profile";

import getCurrentUser from "./customHooks/getcurrentUser";
import getOtherUsers from "./customHooks/getOtherUsers";
import { initSocket } from "./socket";
import { setOnlineUsers, setSocketReady } from "./redux/userSlice";

function App() {
  getCurrentUser();
  getOtherUsers();

  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData) {
      const socket = initSocket(userData._id);

      // Sirf ek boolean flag Redux me daalo (serializable), real socket
      // instance socket.js ke singleton (getSocket()) me hi rehta hai.
      // Yeh flag components ko reactively batata hai ki "ab socket use
      // karna safe hai" — bina actual class instance ko store kiye.
      dispatch(setSocketReady(true));

      socket.on("getOnlineUsers", (users) => {
        dispatch(setOnlineUsers(users));
      });

      // ⚠️ IMPORTANT: NO CLEANUP FUNCTION!
      // अगर cleanup करना भी है तो सिर्फ listener remove करो:
      return () => {
        socket?.off?.("getOnlineUsers");
        // ❌ socket.close() NAHI करना!
        // ❌ koi bhi cleanup nahi!
      };
    }
  }, [userData, dispatch]);

  if (!authChecked) {
    return (
      <div className="h-screen flex justify-center items-center text-xl">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!userData ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" replace />} />
      <Route path="/" element={userData ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={userData ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
