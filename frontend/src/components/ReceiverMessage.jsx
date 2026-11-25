import React, { useRef, useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

function ReceiverMessage({ image, message, deleted, onDelete, senderName }) {
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
      <div className='w-fit max-w-[500px] px-[20px] py-[10px] bg-gray-300 text-gray-600 text-[16px] italic rounded-tl-none rounded-2xl relative left-0 shadow-gray-400 shadow-lg flex flex-col'>
        {senderName && (
          <span className="text-[12px] font-semibold text-fuchsia-700 not-italic mb-[2px]">
            {senderName}
          </span>
        )}
        <div ref={scroll}>
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  return (
    <div className='group w-fit max-w-[500px] px-[20px] py-[10px] bg-[#20c7ff] text-white text-[19px] rounded-tl-none rounded-2xl relative left-0 shadow-gray-400 shadow-lg gap-[10px] flex flex-col'>
      {/* Group chat me kis member ne yeh message bheja hai, uska naam */}
      {senderName && (
        <span className="text-[12px] font-semibold text-fuchsia-900">
          {senderName}
        </span>
      )}
      {/* Three-dot menu — sirf "delete for me", isliye receiver "delete for everyone" nahi kar sakta */}
      <div
        ref={menuRef}
        className="absolute -right-[30px] top-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <div
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <BsThreeDotsVertical size={18} />
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-[24px] z-[50] bg-white text-gray-800 rounded-lg shadow-lg py-[6px] w-[150px] text-[14px]">
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

      <div ref={scroll}>
        {image && (
          <img
            src={image}
            alt=""
            className='w-[150px] rounded-lg'
          />
        )}
        {message && <span>{message}</span>}
      </div>
    </div>
  );
}

export default ReceiverMessage;
