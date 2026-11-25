import uploadOnCloudinary from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { io, getReceiverSocketId } from "../socket/socket.js";

// 1. SEND MESSAGE CONTROLLER
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId; // Auth middleware se userId extract ki
        const { receiverId } = req.params;
        const { message } = req.body;
        
        console.log(`\n📤 Sending message:`);
        console.log(`   From: ${senderId}`);
        console.log(`   To: ${receiverId}`);
        console.log(`   Message: ${message?.substring(0, 50)}...`);
        
        let image = null;

        // Fix #1: Cloudinary function directly string URL return kar raha hai
        if (req.file) {
            console.log(`   Image: ${req.file.filename}`);
            const uploadedImage = await uploadOnCloudinary(req.file.path);
            image = uploadedImage;
            console.log(`   Image uploaded to Cloudinary: ${image?.substring(0, 50)}...`);
        }

        // Conversation check ki dono users ke beech pehle se chat hai ya nahi
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // Naya message create kiya
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            message,
            image: image // Agar image hai toh URL save hoga, nahi toh null
        });

        console.log(`✅ Message saved to DB: ${newMessage._id}`);

        // Conversation document handle karna
        if (!conversation) {
            // Agar pehli baar chat ho rahi hai, toh naya conversation banao
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [newMessage._id]
            });
            console.log(`✅ New conversation created: ${conversation._id}`);
        } else {
            // Agar purani chat hai, toh sirf new message id push karo
            conversation.messages.push(newMessage._id);
            await conversation.save();
            console.log(`✅ Message added to existing conversation: ${conversation._id}`);
        }
       
        // Real-time notification using Socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        
        console.log(`\n📡 Socket Emission:`);
        console.log(`   Receiver ID: ${receiverId}`);
        console.log(`   Receiver Socket ID: ${receiverSocketId || "NOT FOUND"}`);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
            console.log(`✅ Message emitted to socket: ${receiverSocketId}`);
        } else {
            console.log(`⚠️  Receiver not online - message saved to DB, will be fetched on next load`);
        }

        return res.status(201).json(newMessage);

    } catch (error) {
        console.error("❌ Error in sendMessage controller:", error);
        return res.status(500).json({ 
            message: "Internal server error in sendMessage", 
            error: error.message 
        });
    }
};

// 2. GET MESSAGES CONTROLLER
export const getMessages = async (req, res) => {
    try {
        // Fix #2: req.user._id ki jagah req.userId use kiya (as per your isAuth middleware)
        const senderId = req.userId; 
        const { receiver: receiverId } = req.params;

        console.log(`\n📥 Fetching messages:`);
        console.log(`   From: ${senderId}`);
        console.log(`   With: ${receiverId}`);

        // Conversation find karke uske andar ke saare messages ko populate kiya
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate("messages");

        // Agar koi conversation nahi mili, toh empty array send karenge (no error)
        if (!conversation) {
            console.log(`   No conversation found - returning empty array`);
            return res.status(200).json([]);
        }

        // "Delete for me" — jin messages ko current user ne apni taraf se delete
        // kiya hai unhe response se hata do (doosre user ko woh normally dikhte hain).
        const visibleMessages = conversation.messages.filter(
            (msg) => !msg.deletedFor?.some((id) => id.toString() === senderId.toString())
        );

        console.log(`✅ Fetched ${visibleMessages.length} messages`);
        return res.status(200).json(visibleMessages);
    } catch (error) {
        console.log("❌ Error in getMessages controller: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// 3. SEND GROUP MESSAGE CONTROLLER
export const sendGroupMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const { groupId } = req.params;
        const { message } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(
            (m) => m.toString() === senderId.toString()
        );
        if (!isMember) {
            return res
                .status(403)
                .json({ message: "You are not a member of this group" });
        }

        let image = null;
        if (req.file) {
            const uploadedImage = await uploadOnCloudinary(req.file.path);
            image = uploadedImage;
        }

        if ((!message || !message.trim()) && !image) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        let newMessage = await Message.create({
            sender: senderId,
            group: groupId,
            message,
            image,
        });

        group.messages.push(newMessage._id);
        await group.save();

        // Sender ki name/userName/image ke saath populate karo — group chat me
        // har message ke saath yeh dikhna hi is feature ka poora point hai.
        newMessage = await newMessage.populate("sender", "name userName image");

        // Group ke room me sabhi online members ko bhejo (sender samet, taaki
        // uske doosre open tabs/devices bhi turant sync ho jaayein — frontend
        // pehle se hi _id se dedupe karta hai).
        io.to(groupId.toString()).emit("newGroupMessage", newMessage);

        return res.status(201).json(newMessage);
    } catch (error) {
        console.error("❌ Error in sendGroupMessage controller:", error);
        return res.status(500).json({
            message: "Internal server error in sendGroupMessage",
            error: error.message,
        });
    }
};

// 4. GET GROUP MESSAGES CONTROLLER
export const getGroupMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some(
            (m) => m.toString() === userId.toString()
        );
        if (!isMember) {
            return res
                .status(403)
                .json({ message: "You are not a member of this group" });
        }

        const groupWithMessages = await Group.findById(groupId).populate({
            path: "messages",
            populate: { path: "sender", select: "name userName image" },
        });

        const visibleMessages = groupWithMessages.messages.filter(
            (msg) => !msg.deletedFor?.some((id) => id.toString() === userId.toString())
        );

        return res.status(200).json(visibleMessages);
    } catch (error) {
        console.log("❌ Error in getGroupMessages controller: ", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// 5. DELETE MESSAGE CONTROLLER (WhatsApp-style: "Delete for everyone" / "Delete for me")
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId } = req.params;
        // mode: "everyone" | "me" (defaults to "me" if not provided)
        const { mode = "me" } = req.body;

        console.log(`\n🗑️  Delete message request:`);
        console.log(`   Message ID: ${messageId}`);
        console.log(`   Requested by: ${userId}`);
        console.log(`   Mode: ${mode}`);

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const isSender = message.sender.toString() === userId.toString();

        if (mode === "everyone") {
            // Sirf sender hi "delete for everyone" kar sakta hai — WhatsApp jaisa hi
            // behaviour, taaki koi doosre ka message sabke liye delete na kar sake.
            if (!isSender) {
                return res.status(403).json({
                    message: "You can only delete your own messages for everyone",
                });
            }

            message.message = "";
            message.image = "";
            message.deleted = true;
            await message.save();

            if (message.group) {
                // Group message — sabhi room members ko ek saath batao
                io.to(message.group.toString()).emit("messageDeleted", {
                    messageId: message._id,
                    mode: "everyone",
                    groupId: message.group,
                });
                console.log(`✅ messageDeleted emitted to group room ${message.group}`);
            } else {
                // Doosre participant ko real-time batao ki message delete ho gaya
                const otherUserId = isSender
                    ? message.receiver.toString()
                    : message.sender.toString();
                const otherSocketId = getReceiverSocketId(otherUserId);

                if (otherSocketId) {
                    io.to(otherSocketId).emit("messageDeleted", {
                        messageId: message._id,
                        mode: "everyone",
                    });
                    console.log(`✅ messageDeleted emitted to ${otherSocketId}`);
                }
            }

            return res.status(200).json(message);
        }

        // mode === "me" -> sirf requesting user ki taraf se hide karo
        if (!message.deletedFor.some((id) => id.toString() === userId.toString())) {
            message.deletedFor.push(userId);
            await message.save();
        }

        console.log(`✅ Message hidden for user ${userId} only`);
        return res.status(200).json(message);
    } catch (error) {
        console.error("❌ Error in deleteMessage controller:", error);
        return res.status(500).json({
            message: "Internal server error in deleteMessage",
            error: error.message,
        });
    }
};