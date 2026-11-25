import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    // Appends to whatever the CURRENT store state is at dispatch time —
    // not a snapshot captured earlier — so two near-simultaneous messages
    // (e.g. you sending one while the other person's arrives) can never
    // overwrite each other.
    addMessage: (state, action) => {
      const incoming = action.payload;
      const alreadyExists = state.messages.some(m => m._id === incoming._id);
      if (!alreadyExists) {
        state.messages.push(incoming);
      }
    },
    // "Delete for everyone" — message ko store me dhoondh kar uska content
    // clear karke deleted:true set karta hai (bubble ki jagah "This message
    // was deleted" dikhega), lekin message list se hataata nahi — WhatsApp
    // jaisa hi tombstone behaviour.
    markMessageDeleted: (state, action) => {
      const { messageId } = action.payload;
      const target = state.messages.find(m => m._id === messageId);
      if (target) {
        target.deleted = true;
        target.message = "";
        target.image = "";
      }
    },
    // "Delete for me" — sirf apni local list se hata do, doosre user ko
    // koi farak nahi padta.
    removeMessageLocally: (state, action) => {
      const { messageId } = action.payload;
      state.messages = state.messages.filter(m => m._id !== messageId);
    },
  },
});

export const { setMessages, addMessage, markMessageDeleted, removeMessageLocally } = messageSlice.actions;
export default messageSlice.reducer;
