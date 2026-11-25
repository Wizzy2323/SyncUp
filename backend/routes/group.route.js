import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  addMembers,
  removeMember,
  leaveGroup,
} from "../controllers/group.controller.js";

const groupRouter = express.Router();

// Naya group banao (optional group image ke saath)
groupRouter.post("/create", isAuth, upload.single("image"), createGroup);

// Current user jin groups ka member hai woh sab
groupRouter.get("/my", isAuth, getMyGroups);

// Ek specific group ki details (members list samet)
groupRouter.get("/:groupId", isAuth, getGroupDetails);

// Admin members add kar sake — body: { members: [userId, ...] }
groupRouter.put("/:groupId/add-members", isAuth, addMembers);

// Admin kisi member ko remove kar sake — body: { memberId }
groupRouter.put("/:groupId/remove-member", isAuth, removeMember);

// Koi bhi member khud group chhod sake
groupRouter.post("/:groupId/leave", isAuth, leaveGroup);

export default groupRouter;
