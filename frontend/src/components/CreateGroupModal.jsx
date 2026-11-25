import React, { useState, useRef } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaUsers } from "react-icons/fa";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import dp from "../assets/dp.png";
import { serverUrl } from "../main";
import { addGroup, setSelectedGroup } from "../redux/groupSlice";
import { setSelectedUser } from "../redux/userSlice";

function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const { otherUsers } = useSelector((state) => state.user);
  const imageRef = useRef(null);

  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (selectedMembers.length < 1) {
      setError("Select at least one member");
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("members", JSON.stringify(selectedMembers));
      if (backendImage) {
        formData.append("image", backendImage);
      }

      const result = await axios.post(
        `${serverUrl}/api/group/create`,
        formData,
        { withCredentials: true }
      );

      dispatch(addGroup(result.data));
      dispatch(setSelectedGroup(result.data));
      dispatch(setSelectedUser(null));
      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err?.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-[15px]">
      <div className="w-full max-w-[420px] max-h-[85vh] bg-white rounded-[25px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-600 px-[20px] py-[18px] flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-[20px]">New Group</h2>
          <RxCross2
            className="text-white w-[24px] h-[24px] cursor-pointer"
            onClick={onClose}
          />
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-col overflow-y-auto flex-1"
        >
          {/* Group image + name */}
          <div className="flex items-center gap-[15px] px-[20px] py-[18px] flex-shrink-0">
            <div
              onClick={() => imageRef.current.click()}
              className="relative w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center bg-slate-200 shadow-md cursor-pointer flex-shrink-0"
            >
              <img
                src={frontendImage || dp}
                alt="group"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-fuchsia-600 rounded-full p-[4px]">
                <FaCamera className="text-white w-[10px] h-[10px]" />
              </div>
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImage}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              className="flex-1 h-[45px] border-2 border-fuchsia-500 rounded-full px-[18px] outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
          </div>

          {/* Member selection */}
          <div className="px-[20px] flex-shrink-0">
            <div className="flex items-center gap-[8px] text-gray-600 font-semibold text-[14px] mb-[8px]">
              <FaUsers />
              <span>
                Add members{" "}
                {selectedMembers.length > 0 && `(${selectedMembers.length} selected)`}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-[20px] flex flex-col gap-[10px] pb-[10px]">
            {otherUsers?.length ? (
              otherUsers.map((user) => {
                const isSelected = selectedMembers.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleMember(user._id)}
                    className={`w-full h-[55px] flex items-center gap-[15px] rounded-full px-[10px] cursor-pointer transition-colors flex-shrink-0 ${
                      isSelected
                        ? "bg-fuchsia-100 border-2 border-fuchsia-500"
                        : "bg-slate-100 border-2 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={user.image || dp}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="flex-1 font-medium text-gray-800 truncate">
                      {user.name || user.userName}
                    </span>
                    <div
                      className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mr-[10px] ${
                        isSelected
                          ? "bg-fuchsia-600 border-fuchsia-600"
                          : "border-gray-400"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-[8px] h-[8px] bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-[20px]">
                No other users found
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-[14px] text-center px-[20px] flex-shrink-0">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="px-[20px] py-[18px] flex-shrink-0">
            <button
              type="submit"
              disabled={creating}
              className="w-full h-[48px] bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold rounded-full shadow-lg shadow-fuchsia-300 disabled:opacity-50 transition-all"
            >
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
