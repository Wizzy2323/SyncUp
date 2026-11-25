

// export default MessageArea;
import React, { useState, useEffect, useRef } from 'react';
import { IoArrowBack } from "react-icons/io5"; 
import { RiEmojiStickerLine, RiSendPlane2Fill } from "react-icons/ri";
import { FaImages } from "react-icons/fa";
import { HiUserGroup } from "react-icons/hi2";
import EmojiPicker from 'emoji-picker-react'; 
import dp from "../assets/dp.png";
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedUser } from '../redux/userSlice';
import { setSelectedGroup } from '../redux/groupSlice';
import SenderMessage from './SenderMessage';
import ReceiverMessage from './ReceiverMessage';
import GroupInfoModal from './GroupInfoModal';
import axios from 'axios';
import { serverUrl } from '../main';
import { setMessages, addMessage, markMessageDeleted, removeMessageLocally } from '../redux/messageSlice';
import { getSocket } from '../socket';

// Group message ka sender ObjectId nahi, populated user object hota hai
// ({ _id, name, userName, image }) — 1-1 message ka sender plain ObjectId
// string hota hai. Yeh helper dono cases ko safely normalize karta hai.
const getSenderId = (mess) =>
  typeof mess.sender === "object" && mess.sender !== null
    ? mess.sender._id
    : mess.sender;

const getSenderLabel = (mess) =>
  typeof mess.sender === "object" && mess.sender !== null
    ? mess.sender.name || mess.sender.userName
    : null;

function MessageArea() {
  const { selectedUser, userData, socketReady } = useSelector(state => state.user);
  const { selectedGroup } = useSelector(state => state.group);
  const { messages } = useSelector(state => state.message);
  const dispatch = useDispatch();

  const isGroupChat = !!selectedGroup;
  const activeChat = selectedUser || selectedGroup;

  const [showPicker, setShowPicker] = useState(false);
  const [input, setInput] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const imageRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesRef = useRef(messages);
  const selectedGroupRef = useRef(selectedGroup);

  // Humesha latest messages ko ref mein update rakhein
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Stale closure se bachne ke liye — socket listener effect sirf
  // [socketReady, dispatch] par depend karta hai, isliye selectedGroup ka
  // latest value ref ke through hi milega.
  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  // Chat badalte hi draft input/preview clear kar do, taaki ek chat ka
  // adhoora message doosri chat me leak na ho
  useEffect(() => {
    setInput("");
    setFrontendImage(null);
    setBackendImage(null);
    setShowPicker(false);
  }, [selectedUser?._id, selectedGroup?._id]);

  // Auto-scroll to bottom jab naya message आये ya chat badle
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, selectedGroup]);

  // Socket listener - Real-time message reception (1-1 + group dono)
  useEffect(() => {
    // socketReady flip hone par hi yeh effect dobara chalega — is liye
    // App.jsx me jab tak initSocket() socket.js ke andar singleton set
    // nahi kar deta, tab tak setSocketReady(true) dispatch nahi hota.
    // Matlab jab tak yahan socketReady true milta hai, getSocket() ka
    // null aana practically possible nahi.
    if (!socketReady) {
      console.warn("⚠️ Socket not initialized");
      return;
    }

    const socket = getSocket();
    if (!socket) {
      console.warn("⚠️ Socket not initialized");
      return;
    }

    const handleNewMessage = (message) => {
      console.log("📨 New message received:", message);
      // addMessage reducer appends to the LIVE store state and dedupes by _id,
      // so this can never race with a concurrent send/receive.
      dispatch(addMessage(message));
    };

    const handleNewGroupMessage = (message) => {
      console.log("📨 New group message received:", message);
      // Sirf currently khuli hui group chat me hi append karo — doosre
      // group ka message background me store me nahi ghusna chahiye.
      if (selectedGroupRef.current?._id === message.group) {
        dispatch(addMessage(message));
      }
    };

    // Doosri taraf se "delete for everyone" hua toh yahan real-time update aata hai
    const handleMessageDeleted = ({ messageId }) => {
      console.log("🗑️ Message deleted (everyone):", messageId);
      dispatch(markMessageDeleted({ messageId }));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    console.log("✅ Message listener registered");

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("messageDeleted", handleMessageDeleted);
      console.log("❌ Message listener removed");
    };
  }, [socketReady, dispatch]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  // Message bhejne ka updated handler — 1-1 ya group, dono handle karta hai
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim().length === 0 && backendImage === null) return;
    if (!activeChat) return;

    try {
      const formData = new FormData();
      formData.append("message", input);
      if (backendImage) {
        formData.append("image", backendImage);
      }

      const url = isGroupChat
        ? `${serverUrl}/api/message/group/send/${selectedGroup._id}`
        : `${serverUrl}/api/message/send/${selectedUser._id}`;

      const result = await axios.post(url, formData, { withCredentials: true });

      // ⚠️ IMPORTANT: Locally instantly add karo, socket ka wait mat karo.
      // addMessage appends to the LIVE redux state at dispatch time, so this
      // can't clobber a message that arrived via socket while this request
      // was in flight (the old setMessages([...messages, result.data]) could).
      dispatch(addMessage(result.data));

      setInput("");
      setFrontendImage(null);
      setBackendImage(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput(prevInput => prevInput + emojiData.emoji);
    setShowPicker(false);
  };

  // WhatsApp-style delete: mode is "everyone" (clears content for both sides,
  // sender only) or "me" (hides just from the requesting user's own view).
  // Group ya 1-1 dono ke liye same endpoint kaam karta hai.
  const handleDeleteMessage = async (messageId, mode) => {
    try {
      await axios.delete(`${serverUrl}/api/message/delete/${messageId}`, {
        data: { mode },
        withCredentials: true,
      });

      // Optimistically update locally — apna hi request hai toh socket event
      // ka wait karne ki zaroorat nahi (socket sirf DOOSRE user/group ko bheja jaata hai).
      if (mode === "everyone") {
        dispatch(markMessageDeleted({ messageId }));
      } else {
        dispatch(removeMessageLocally({ messageId }));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleBack = () => {
    dispatch(setSelectedUser(null));
    dispatch(setSelectedGroup(null));
  };

  return (
    <div className={`lg:w-[70%] ${activeChat ? "flex" : "hidden"} lg:flex w-full h-screen bg-slate-200 border-l-2 border-gray-300 flex-col`}>

      {activeChat ? (
        <div className='w-full h-full flex flex-col justify-between relative'>
          
          {/* Header */}
          <div className='w-full h-[80px] bg-[#1797c2] rounded-b-[30px] shadow-md gap-[20px] flex items-center px-[20px] flex-shrink-0 z-10'>
            <div className='cursor-pointer text-white text-[25px]' onClick={handleBack}>
              <IoArrowBack />
            </div>
            <div
              className={`w-[45px] h-[45px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-md flex-shrink-0 ${isGroupChat ? "cursor-pointer" : ""}`}
              onClick={() => isGroupChat && setShowGroupInfo(true)}
            >
              {isGroupChat ? (
                selectedGroup?.image ? (
                  <img src={selectedGroup.image} alt="Group DP" className='h-full w-full object-cover' />
                ) : (
                  <HiUserGroup className='w-[24px] h-[24px] text-fuchsia-600' />
                )
              ) : (
                <img src={selectedUser?.image || dp} alt="User DP" className='h-full w-full object-cover' />
              )}
            </div>
            <div
              className={isGroupChat ? "cursor-pointer" : ""}
              onClick={() => isGroupChat && setShowGroupInfo(true)}
            >
              <h1 className='text-white font-semibold text-[20px]'>
                {isGroupChat ? selectedGroup?.name : (selectedUser?.name || "User")}
              </h1>
              {isGroupChat && (
                <p className='text-white/80 text-[13px]'>
                  {selectedGroup?.members?.length || 0} members
                </p>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className='flex-1 overflow-y-auto py-[20px] px-[20px] flex flex-col gap-[20px]'>
            {showPicker && (
              <div className='absolute bottom-[100px] left-[20px] z-[100] shadow-lg'>
                <EmojiPicker width={250} height={350} onEmojiClick={onEmojiClick} />
              </div>
            )}

            {messages && messages.map((mess, index) => {
              const senderId = getSenderId(mess);
              const isMine = senderId === userData._id;
              // Group chat me har message ke saath sender ka naam dikhta hai —
              // apna message ho toh "You", nahi toh actual username.
              const senderName = isGroupChat
                ? (isMine ? "You" : getSenderLabel(mess) || "Unknown")
                : undefined;

              return isMine ? (
                <SenderMessage
                  key={mess._id || index}
                  image={mess.image}
                  message={mess.message}
                  deleted={mess.deleted}
                  senderName={senderName}
                  onDelete={(mode) => handleDeleteMessage(mess._id, mode)}
                />
              ) : (
                <ReceiverMessage
                  key={mess._id || index}
                  image={mess.image}
                  message={mess.message}
                  deleted={mess.deleted}
                  senderName={senderName}
                  onDelete={(mode) => handleDeleteMessage(mess._id, mode)}
                />
              );
            })}
            
            {/* Auto-scroll target */}
            <div ref={bottomRef}></div>
          </div>

          {/* Input Form */}
          <div className='w-full h-[90px] flex items-center justify-center bg-transparent flex-shrink-0 pointer-events-none'>
            {frontendImage && (
              <img src={frontendImage} alt="Preview" className='w-[80px] absolute bottom-[85px] right-[40px] rounded-lg shadow-lg pointer-events-auto' />
            )}
            <form className='w-[95%] lg:w-[85%] h-[55px] bg-[#1797c2] shadow-lg rounded-full flex items-center gap-[15px] px-[20px] pointer-events-auto' onSubmit={handleSendMessage}>
              
              <div onClick={() => setShowPicker(prev => !prev)}>
                <RiEmojiStickerLine className='w-[25px] h-[25px] text-white cursor-pointer flex-shrink-0' />
              </div>
              
              <input type="file" accept="image/*" ref={imageRef} hidden onChange={handleImage} />
              
              <input 
                type="text" 
                className='w-full h-full px-[5px] outline-none border-0 text-[18px] text-white bg-transparent placeholder-white' 
                placeholder='Message' 
                onChange={(e) => setInput(e.target.value)} 
                value={input} 
              />
              
              <div onClick={() => imageRef.current.click()}>
                <FaImages className='w-[25px] h-[25px] cursor-pointer text-white flex-shrink-0' />
              </div>
              
              {(input.trim().length > 0 || backendImage !== null) && (
                <button type="submit" className='flex-shrink-0'>
                  <RiSendPlane2Fill className='w-[25px] h-[25px] cursor-pointer text-white' />
                </button>
              )}
            </form>
          </div>

        </div>
      ) : (
        /* No Chat Selected State */
        <div className='w-full h-full flex flex-col justify-center items-center gap-2'>
          <h1 className='text-gray-700 font-bold text-[40px] lg:text-[50px]'>Welcome to ConvoSphere</h1>
          <span className='text-gray-500 font-semibold text-[20px] lg:text-[30px]'>Select a chat to start messaging!</span>
        </div>
      )}

      {isGroupChat && showGroupInfo && (
        <GroupInfoModal group={selectedGroup} onClose={() => setShowGroupInfo(false)} />
      )}

    </div>
  );
}

export default MessageArea;
