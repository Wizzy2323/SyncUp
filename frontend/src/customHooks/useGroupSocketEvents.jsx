import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getSocket } from "../socket";
import { addGroup, updateGroup, removeGroup } from "../redux/groupSlice";
import { setSelectedGroup } from "../redux/groupSlice";

// Group list ko real-time sync me rakhta hai — chahe koi bhi chat is waqt
// khuli ho, agar naya group ban jaaye, koi member add/remove ho, ya humein
// khud kisi group se nikaal diya jaaye, sidebar turant update ho jaani chahiye.
const useGroupSocketEvents = () => {
  const dispatch = useDispatch();
  const { socketReady } = useSelector((state) => state.user);
  const { selectedGroup } = useSelector((state) => state.group);

  useEffect(() => {
    if (!socketReady) return;
    const socket = getSocket();
    if (!socket) return;

    const handleGroupCreated = (group) => {
      dispatch(addGroup(group));
    };

    const handleGroupUpdated = (group) => {
      dispatch(updateGroup(group));
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      dispatch(removeGroup({ groupId }));
      if (selectedGroup?._id === groupId) {
        dispatch(setSelectedGroup(null));
      }
    };

    socket.on("groupCreated", handleGroupCreated);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("removedFromGroup", handleRemovedFromGroup);

    return () => {
      socket.off("groupCreated", handleGroupCreated);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("removedFromGroup", handleRemovedFromGroup);
    };
  }, [socketReady, dispatch, selectedGroup?._id]);
};

export default useGroupSocketEvents;
