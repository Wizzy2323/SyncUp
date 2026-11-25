import React, { useRef, useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

function SenderMessage({ image, message, deleted, onDelete, senderName }) {
  const scroll = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [message, image]);

  // Menu ke bahar click hone par usse band kar do
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (deleted) {
    return (
      <div
        className="w-fit max-w-[500px] px-[20px] py-[10px] bg-gray-300 text-gray-600 text-[16px] italic rounded-tr-none rounded-2xl relative right-0 ml-auto shadow-gray-400 shadow-lg flex flex-col"
        ref={scroll}
      >
        <span>This message was deleted</span>
      </div>
    );
  }

  return (
    <div
      className="group w-fit max-w-[500px] px-[20px] py-[10px] bg-[rgb(23,151,194)] text-white text-[19px] rounded-tr-none rounded-2xl relative right-0 ml-auto shadow-gray-400 shadow-lg gap-[10px] flex flex-col"
      ref={scroll}
    >
      {/* Group chat me har message (apna bhi) sender-labelled dikhta hai */}
      {senderName && (
        <span className="text-[12px] font-semibold text-cyan-100">
          {senderName}
        </span>
      )}
      {/* Three-dot menu — hover par dikhta hai */}
      <div
        ref={menuRef}
        className="absolute -left-[30px] top-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <div
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <BsThreeDotsVertical size={18} />
        </div>

        {menuOpen && (
          <div className="absolute left-0 top-[24px] z-[50] bg-white text-gray-800 rounded-lg shadow-lg py-[6px] w-[170px] text-[14px]">
            <div
              className="px-[15px] py-[8px] hover:bg-gray-100 cursor-pointer text-red-600"
              onClick={() => {
                setMenuOpen(false);
                onDelete?.("everyone");
              }}
            >
              Delete for everyone
            </div>
            <div
              className="px-[15px] py-[8px] hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setMenuOpen(false);
                onDelete?.("me");
              }}
            >
              Delete for me
            </div>
          </div>
        )}
      </div>

      <div>
        {image && (
          <img
            src={image}
            alt=""
            className="w-[150px] rounded-lg"
          />
        )}
        {message && <span>{message}</span>}
      </div>
    </div>
  );
}

export default SenderMessage;
