import React from "react";
import { useSelector } from "react-redux";

import SideBar from "../components/SideBar";
import MessageArea from "../components/MessageArea";
import useGetMessages from "../customHooks/getMessages";
import useGetGroupMessages from "../customHooks/getGroupMessages";
import useGetGroups from "../customHooks/getGroups";
import useGroupSocketEvents from "../customHooks/useGroupSocketEvents";

function Home() {
  const { selectedUser } = useSelector((state) => state.user);

  // 1-1 chat: messages fetch karo jab selectedUser badle
  useGetMessages();
  // Group chat: messages fetch karo jab selectedGroup badle
  useGetGroupMessages();
  // Current user jin groups ka member hai, unki list fetch karo
  useGetGroups();
  // Group create/update/remove ke real-time socket events sunte raho
  useGroupSocketEvents();

  return (
    <div className="w-full h-[100vh] flex overflow-hidden">
      <SideBar />
      <MessageArea />
    </div>
  );
}

export default Home;
