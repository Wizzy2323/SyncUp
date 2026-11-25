import React, { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { IoPersonAdd } from "react-icons/io5";
import { BiLogOutCircle } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import dp from "../assets/dp.png";
import { serverUrl } from "../main";
import { removeGroup, setSelectedGroup, updateGroup } from "../redux/groupSlice";

function GroupInfoModal({ group, onClose }) {
  const dispatch = useDispatch();
  const { userData, otherUsers } = useSelector((state) => state.user);

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = group?.admin?._id === userData?._id;
  const memberIds = group?.members?.map((m) => m._id) || [];
  const addableUsers = otherUsers?.filter((u) => !memberIds.includes(u._id)) || [];

  const toggleAddMember = (userId) => {
    setMembersToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (membersToAdd.length < 1) return;
    setBusy(true);
    setError("");
    try {
      const result = await axios.put(
        `${serverUrl}/api/group/${group._id}/add-members`,
        { members: membersToAdd },
        { withCredentials: true }
      );
      dispatch(updateGroup(result.data));
      setMembersToAdd([]);
      setShowAddMembers(false);
    } catch (err) {
      console.error("Error adding members:", err);
      setError(err?.response?.data?.message || "Failed to add members");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setBusy(true);
    setError("");
    try {
      const result = await axios.put(
        `${serverUrl}/api/group/${group._id}/remove-member`,
        { memberId },
        { withCredentials: true }
      );
      dispatch(updateGroup(result.data));
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setBusy(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    setBusy(true);
    try {
      await axios.post(
        `${serverUrl}/api/group/${group._id}/leave`,
        {},
        { withCredentials: true }
      );
      dispatch(removeGroup({ groupId: group._id }));
      dispatch(setSelectedGroup(null));
      onClose();
    } catch (err) {
      console.error("Error leaving group:", err);
      setError(err?.response?.data?.message || "Failed to leave group");
      setBusy(false);
    }
  };

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-[15px]">
      <div className="w-full max-w-[420px] max-h-[85vh] bg-white rounded-[25px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-600 px-[20px] py-[18px] flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-[20px]">Group Info</h2>
          <RxCross2
            className="text-white w-[24px] h-[24px] cursor-pointer"
            onClick={onClose}
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Group identity */}
          <div className="flex flex-col items-center gap-[10px] px-[20px] py-[20px] border-b border-gray-200">
            <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-slate-200 shadow-md">
              <img
                src={group.image || dp}
                alt="group"
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="font-bold text-[20px] text-gray-800">{group.name}</h3>
            <p className="text-gray-500 text-[14px]">
              {group.members?.length || 0} members · Admin: {group.admin?.name || group.admin?.userName}
            </p>
          </div>

          {/* Members list */}
          <div className="px-[20px] py-[15px]">
            <div className="flex items-center justify-between mb-[10px]">
              <span className="font-semibold text-gray-700">Members</span>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers((prev) => !prev)}
                  className="flex items-center gap-[5px] text-fuchsia-600 text-[14px] font-semibold cursor-pointer"
                >
                  <IoPersonAdd /> Add
                </button>
              )}
            </div>

            {showAddMembers && (
              <div className="mb-[15px] flex flex-col gap-[8px] bg-slate-50 rounded-[15px] p-[10px]">
                {addableUsers.length ? (
                  addableUsers.map((user) => {
                    const isSelected = membersToAdd.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => toggleAddMember(user._id)}
                        className={`flex items-center gap-[10px] p-[8px] rounded-full cursor-pointer ${
                          isSelected ? "bg-fuchsia-100" : "hover:bg-slate-100"
                        }`}
                      >
                        <img
                          src={user.image || dp}
                          alt=""
                          className="w-[32px] h-[32px] rounded-full object-cover"
                        />
                        <span className="flex-1 text-[14px] truncate">
                          {user.name || user.userName}
                        </span>
                        {isSelected && (
                          <span className="text-fuchsia-600 text-[12px] font-bold">✓</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-[13px] text-center py-[10px]">
                    Everyone is already in this group
                  </p>
                )}
                {addableUsers.length > 0 && (
                  <button
                    onClick={handleAddMembers}
                    disabled={busy || membersToAdd.length < 1}
                    className="mt-[5px] h-[38px] bg-fuchsia-600 text-white rounded-full font-semibold disabled:opacity-50"
                  >
                    Add selected
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-[8px]">
              {group.members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-[12px] p-[8px] rounded-full hover:bg-slate-50"
                >
                  <img
                    src={member.image || dp}
                    alt=""
                    className="w-[38px] h-[38px] rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {member.name || member.userName}
                      {member._id === userData?._id && " (You)"}
                    </p>
                    {member._id === group.admin?._id && (
                      <p className="text-[12px] text-fuchsia-600">Admin</p>
                    )}
                  </div>
                  {isAdmin && member._id !== group.admin?._id && (
                    <MdDelete
                      className="text-red-500 w-[20px] h-[20px] cursor-pointer flex-shrink-0"
                      onClick={() => handleRemoveMember(member._id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-[14px] text-center px-[20px]">{error}</p>
          )}
        </div>

        {/* Leave group */}
        <div className="px-[20px] py-[15px] border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLeaveGroup}
            disabled={busy}
            className="w-full h-[45px] flex items-center justify-center gap-[8px] text-red-600 font-semibold border-2 border-red-500 rounded-full hover:bg-red-50 disabled:opacity-50"
          >
            <BiLogOutCircle className="w-[20px] h-[20px]" />
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupInfoModal;
