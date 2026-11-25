import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { serverUrl } from "../main";
import { setMessages } from "../redux/messageSlice";

const useGetMessages = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchMessages = async () => {
      // Fix #2: Safe guard check taaki null hone par code crash na ho
      if (!selectedUser?._id) return; 

      try {
        // Fix #1: URL path me '/api' add kar diya hai
        const result = await axios.get(
          `${serverUrl}/api/message/get/${selectedUser._id}`,
          { withCredentials: true }
        );
        dispatch(setMessages(result.data));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedUser?._id, dispatch]); // Dependency me direct ID daalna track karne ke liye better hai
};

export default useGetMessages;