import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { serverUrl } from "../main";
import { setMessages } from "../redux/messageSlice";

const useGetGroupMessages = () => {
  const dispatch = useDispatch();
  const { selectedGroup } = useSelector((state) => state.group);

  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!selectedGroup?._id) return;

      try {
        const result = await axios.get(
          `${serverUrl}/api/message/group/get/${selectedGroup._id}`,
          { withCredentials: true }
        );
        dispatch(setMessages(result.data));
      } catch (error) {
        console.error("Error fetching group messages:", error);
      }
    };

    fetchGroupMessages();
  }, [selectedGroup?._id, dispatch]);
};

export default useGetGroupMessages;
