import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // 1. Spelling fix: 'partcipants' ko 'participants' kiya
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // 2. Logical fix: String ki jagah Message model ka reference diya
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message", 
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;