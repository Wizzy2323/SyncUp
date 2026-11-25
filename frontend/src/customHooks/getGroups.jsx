import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { serverUrl } from "../main";
import { setGroups } from "../redux/groupSlice";

const useGetGroups = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userData?._id) return;

      try {
        const result = await axios.get(`${serverUrl}/api/group/my`, {
          withCredentials: true,
        });
        dispatch(setGroups(result.data));
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [userData?._id, dispatch]);
};

export default useGetGroups;
