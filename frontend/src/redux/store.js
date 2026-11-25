import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import messageSlice from "./messageSlice";
import groupSlice from "./groupSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    message: messageSlice,
    group: groupSlice,
  },
});
