import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { sendMessage } from "../controllers/message.controller.js";
import { getMessages } from "../controllers/message.controller.js";
import { deleteMessage } from "../controllers/message.controller.js";
import { sendGroupMessage } from "../controllers/message.controller.js";
import { getGroupMessages } from "../controllers/message.controller.js";

const messageRouter = express.Router();

// Message send karne ka route (with image upload support)
messageRouter.post(
  "/send/:receiverId",
  isAuth,
  upload.single("image"),
  sendMessage
);
messageRouter.get("/get/:receiver", isAuth,getMessages);

// Group message routes (with image upload support)
messageRouter.post(
  "/group/send/:groupId",
  isAuth,
  upload.single("image"),
  sendGroupMessage
);
messageRouter.get("/group/get/:groupId", isAuth, getGroupMessages);

// Message delete karne ka route — body me { mode: "everyone" | "me" } bhejna hai
messageRouter.delete("/delete/:messageId", isAuth, deleteMessage);

export default messageRouter;   