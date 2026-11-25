import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    // Naya group real-time aaye (khud banaya ya kisi ne add kiya) toh list me daalo
    addGroup: (state, action) => {
      const incoming = action.payload;
      const alreadyExists = state.groups.some((g) => g._id === incoming._id);
      if (!alreadyExists) {
        state.groups.unshift(incoming);
      }
    },
    // Members add/remove hone par group ki updated info store me refresh karo
    updateGroup: (state, action) => {
      const updated = action.payload;
      const idx = state.groups.findIndex((g) => g._id === updated._id);
      if (idx !== -1) {
        state.groups[idx] = updated;
      }
      if (state.selectedGroup?._id === updated._id) {
        state.selectedGroup = updated;
      }
    },
    // Group delete ho gaya ya humein usse remove kar diya gaya
    removeGroup: (state, action) => {
      const { groupId } = action.payload;
      state.groups = state.groups.filter((g) => g._id !== groupId);
      if (state.selectedGroup?._id === groupId) {
        state.selectedGroup = null;
      }
    },
    setSelectedGroup: (state, action) => {
      state.selectedGroup = action.payload;
    },
  },
});

export const {
  setGroups,
  addGroup,
  updateGroup,
  removeGroup,
  setSelectedGroup,
} = groupSlice.actions;

export default groupSlice.reducer;
