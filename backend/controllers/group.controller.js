import Group from "../models/group.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { io, getReceiverSocketId } from "../socket/socket.js";

// Helper: ek member ke socket ko (agar online hai) group ke room me daal do,
// taaki use group create/add hote hi turant real-time messages/updates milne lagein.
const joinMemberToRoom = (memberId, groupId) => {
  const socketId = getReceiverSocketId(memberId);
  if (socketId) {
    io.sockets.sockets.get(socketId)?.join(groupId.toString());
  }
  return socketId;
};

const populateGroup = (query) =>
  query.populate("members", "-password").populate("admin", "-password");

// 1. CREATE GROUP
export const createGroup = async (req, res) => {
  try {
    const adminId = req.userId;
    const { name } = req.body;
    let { members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // members multipart form-data me JSON string ke roop me aa sakta hai,
    // ya normal JSON body me already array ho sakta hai.
    if (typeof members === "string") {
      try {
        members = JSON.parse(members);
      } catch {
        members = members.split(",").map((m) => m.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(members) || members.length < 1) {
      return res
        .status(400)
        .json({ message: "Select at least one member to create a group" });
    }

    // Creator hamesha member (aur admin) hota hai — duplicate hatao
    const uniqueMembers = Array.from(
      new Set([...members.map(String), adminId.toString()])
    );

    let image = "";
    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      image = uploaded || "";
    }

    const group = await Group.create({
      name: name.trim(),
      admin: adminId,
      members: uniqueMembers,
      image,
    });

    const populatedGroup = await populateGroup(Group.findById(group._id));

    // Sabhi online members ke sockets ko naye group ke room me jodo aur
    // unhe real-time batao ki ek naya group ban gaya hai (sidebar update ho jaaye).
    uniqueMembers.forEach((memberId) => {
      const socketId = joinMemberToRoom(memberId, group._id);
      if (socketId) {
        io.to(socketId).emit("groupCreated", populatedGroup);
      }
    });

    return res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error);
    return res.status(500).json({
      message: "Failed to create group",
      error: error.message,
    });
  }
};

// 2. GET MY GROUPS
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await populateGroup(
      Group.find({ members: userId }).sort({ updatedAt: -1 })
    );
    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups controller:", error);
    return res.status(500).json({
      message: "Failed to fetch groups",
      error: error.message,
    });
  }
};

// 3. GET GROUP DETAILS
export const getGroupDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    const group = await populateGroup(Group.findById(groupId));
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails controller:", error);
    return res.status(500).json({
      message: "Failed to fetch group",
      error: error.message,
    });
  }
};

// 4. ADD MEMBERS (admin only)
export const addMembers = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;
    let { members } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.admin.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group admin can add members" });
    }

    if (typeof members === "string") {
      try {
        members = JSON.parse(members);
      } catch {
        members = members.split(",").map((m) => m.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(members) || members.length < 1) {
      return res.status(400).json({ message: "No members provided" });
    }

    const newMembers = members
      .map(String)
      .filter((id) => !group.members.some((m) => m.toString() === id));

    group.members.push(...newMembers);
    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));

    newMembers.forEach((memberId) => {
      const socketId = joinMemberToRoom(memberId, group._id);
      if (socketId) {
        io.to(socketId).emit("groupCreated", populatedGroup); // naya member ke liye group naya hai
      }
    });
    io.to(groupId).emit("groupUpdated", populatedGroup);

    return res.status(200).json(populatedGroup);
  } catch (error) {
    console.error("Error in addMembers controller:", error);
    return res.status(500).json({
      message: "Failed to add members",
      error: error.message,
    });
  }
};

// 5. REMOVE MEMBER (admin only)
export const removeMember = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;
    const { memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.admin.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the group admin can remove members" });
    }
    if (!memberId) {
      return res.status(400).json({ message: "memberId is required" });
    }
    if (memberId.toString() === group.admin.toString()) {
      return res.status(400).json({
        message: "Admin can't remove themselves — use leave group instead",
      });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== memberId.toString()
    );
    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));

    const socketId = getReceiverSocketId(memberId);
    if (socketId) {
      io.sockets.sockets.get(socketId)?.leave(groupId.toString());
      io.to(socketId).emit("removedFromGroup", { groupId });
    }
    io.to(groupId).emit("groupUpdated", populatedGroup);

    return res.status(200).json(populatedGroup);
  } catch (error) {
    console.error("Error in removeMember controller:", error);
    return res.status(500).json({
      message: "Failed to remove member",
      error: error.message,
    });
  }
};

// 6. LEAVE GROUP (any member, including admin)
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const wasMember = group.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!wasMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== userId.toString()
    );

    const socketId = getReceiverSocketId(userId);
    if (socketId) {
      io.sockets.sockets.get(socketId)?.leave(groupId.toString());
    }

    // Group khaali ho gaya toh use hata do
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res
        .status(200)
        .json({ message: "Left group. Group deleted (no members left).", deleted: true });
    }

    // Admin khud leave kare toh sabse purane baaki member ko naya admin bana do
    if (group.admin.toString() === userId.toString()) {
      group.admin = group.members[0];
    }

    await group.save();
    const populatedGroup = await populateGroup(Group.findById(group._id));
    io.to(groupId).emit("groupUpdated", populatedGroup);

    return res.status(200).json({ message: "Left group successfully", deleted: false });
  } catch (error) {
    console.error("Error in leaveGroup controller:", error);
    return res.status(500).json({
      message: "Failed to leave group",
      error: error.message,
    });
  }
};
