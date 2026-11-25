import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { serverUrl } from "../main";
import {
  setUserData,
  setAuthChecked,
} from "../redux/userSlice";

const getCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/user/current`,
          {
            withCredentials: true,
          }
        );

        dispatch(setUserData(result.data));
      } catch (error) {
        console.log("Current User Error:", error);
        dispatch(setUserData(null));
      } finally {
        dispatch(setAuthChecked(true));
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default getCurrentUser;