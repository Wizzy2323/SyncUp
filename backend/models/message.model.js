import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 1-1 chat ke liye receiver hota hai; group chat ke liye group hota hai.
    // Dono me se sirf ek hi set hoga kabhi bhi.
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.group;
      },
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
   message: {
      type: String,
      default: "", // Agar user sirf image bheje, toh message khali reh sakta hai
    },
    image: {
      type: String,
      default: "", // Image URL/Path save karne ke liye
    },
    // "Delete for everyone" — jab true ho, message/image content clear kar diya
    // jaata hai aur dono taraf "This message was deleted" dikhta hai.
    deleted: {
      type: Boolean,
      default: false,
    },
    // "Delete for me" — sirf in userIds ke liye message hide hota hai,
    // doosre participant ko normally dikhta rehta hai.
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;