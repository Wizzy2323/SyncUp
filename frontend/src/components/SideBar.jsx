import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dp from "../assets/dp.png";
import { IoIosSearch } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { BiLogOutCircle } from "react-icons/bi";
import { HiUserGroup } from "react-icons/hi2";
import { FaPlus } from "react-icons/fa";
import { serverUrl } from '../main';
import axios from 'axios';
import { setOtherUsers, setUserData, setSelectedUser, setOnlineUsers, setSocketReady } from '../redux/userSlice'; 
import { setSelectedGroup } from '../redux/groupSlice';
import { useNavigate } from 'react-router-dom';
import { closeSocket } from '../socket';
import CreateGroupModal from './CreateGroupModal';

function SideBar() {
    // 1. Redux store se 'selectedUser' ko extract kiya
    // Online Users Indicator: 'onlineUsers' bhi yahin se le rahe hain
    let { userData, otherUsers, selectedUser, onlineUsers } = useSelector(state => state.user);
    // Groups feature: group list aur currently selected group (agar koi hai)
    let { groups, selectedGroup } = useSelector(state => state.group);
    let [search, setSearch] = useState(false);
    let [showCreateGroup, setShowCreateGroup] = useState(false);
    let dispatch = useDispatch();
    let navigate = useNavigate();

    // Ek user chat select karne par doosri taraf group selection clear karo —
    // dono me se sirf ek hi chat khuli honi chahiye kabhi bhi.
    const handleSelectUser = (user) => {
        dispatch(setSelectedGroup(null));
        dispatch(setSelectedUser(user));
    };

    const handleSelectGroup = (group) => {
        dispatch(setSelectedUser(null));
        dispatch(setSelectedGroup(group));
    };

    const handleLogOut = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
            // Socket ko yahin par properly band karte hain taaki agla login
            // (chahe wahi account ho ya same tab me koi doosra account) ek
            // fresh connection banaye, sahi userId ke saath — purani socket
            // ko reuse karke server ke map me galat/purani identity na reh jaaye.
            closeSocket();
            dispatch(setSocketReady(false));
            dispatch(setOnlineUsers(null));
            dispatch(setUserData(null));
            dispatch(setOtherUsers(null));
            navigate("/login");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        // 2. Image ke mutabik main div ki classes aur conditional logic update ki
        // FIXED: flex-col add kiya taaki child elements flex basis se kaam le saken
        <div className={`lg:w-[30%] w-full h-full bg-slate-200 lg:block ${!selectedUser && !selectedGroup ? "block" : "hidden"} flex flex-col`}>
            
            {/* Logout Button */}
            <div 
                className='w-[60px] h-[60px] mt-[10px] rounded-full overflow-hidden flex justify-center items-center bg-[#20c7ff] shadow-gray-500 text-gray-700 cursor-pointer shadow-lg fixed bottom-[20px] left-[10px] flex-shrink-0' 
                onClick={handleLogOut}
            >
                <BiLogOutCircle className='w-[25px] h-[25px]' />
            </div>

            {/* Profile Header Card */}
            <div className='w-full flex-shrink-0 bg-fuchsia-600 rounded-b-[30%] shadow-gray-400 shadow-lg flex flex-col justify-center px-[20px] py-[30px]'>
                <h1 className='text-white font-bold text-[25px]'>ConvoSphere</h1>
                <div className='w-full flex justify-between items-center'>
                    <h1 className='text-gray-800 font-bold text-[25px]'>Hii {userData?.name || "user"}</h1>
                    <div 
                        className='w-[60px] h-[60px] rounded-full overflow-hidden flex justify-center items-center bg-white cursor-pointer shadow-gray-500 shadow-lg flex-shrink-0' 
                        onClick={() => { navigate("/profile") }}
                    >
                        <img src={userData?.image || dp} alt="" className='h-[100%]' />
                    </div>
                </div>
            </div>

            {/* Search Toggle Section */}
            <div className='w-full flex items-center gap-[20px] px-[20px] flex-shrink-0'>
                {!search && (
                    <div 
                        className='w-[60px] h-[60px] mt-[10px] rounded-full overflow-hidden flex justify-center items-center bg-white shadow-gray-500 cursor-pointer shadow-lg flex-shrink-0' 
                        onClick={() => setSearch(true)}
                    >
                        <IoIosSearch className='w-[25px] h-[25px]' />
                    </div>
                )}

                {search && (
                    <form className='w-full h-[60px] bg-white shadow-gray-500 shadow-lg flex items-center gap-[10px] mt-[10px] rounded-full overflow-hidden px-[20px] flex-shrink-0'>
                        <IoIosSearch className='w-[25px] h-[25px] flex-shrink-0' />
                        <input 
                            type="text" 
                            placeholder='search users...' 
                            className='w-full h-full p-[10px] text-[17px] outline-0 border-0' 
                        />
                        <RxCross2 
                            className='w-[25px] h-[25px] cursor-pointer flex-shrink-0' 
                            onClick={() => setSearch(false)} 
                        />
                    </form>
                )}

                {/* New Group button */}
                <div
                    className='w-[60px] h-[60px] mt-[10px] rounded-full overflow-hidden flex justify-center items-center bg-fuchsia-600 shadow-gray-500 cursor-pointer shadow-lg flex-shrink-0'
                    onClick={() => setShowCreateGroup(true)}
                    title="New Group"
                >
                    <FaPlus className='w-[20px] h-[20px] text-white' />
                </div>
            </div>

            {/* Users + Groups List Section */}
            {/* FIXED: h-[60vh] hata diya aur flex-1 with overflow-y-auto use kiya */}
            <div className='w-full flex-1 overflow-y-auto flex flex-col gap-[20px] items-center mt-[20px] px-[10px] pb-[20px]'>

                {/* Groups Section */}
                {groups?.length > 0 && (
                    <>
                        <h2 className='w-[95%] text-gray-600 font-semibold text-[14px] uppercase tracking-wide'>
                            Groups
                        </h2>
                        {groups.map((group) => (
                            <div
                                key={group._id}
                                className={`w-[95%] h-[60px] flex items-center gap-[20px] shadow-gray-500 shadow-lg rounded-full hover:bg-[#b2ccdf] cursor-pointer flex-shrink-0 ${
                                    selectedGroup?._id === group._id ? "bg-[#b2ccdf]" : "bg-white"
                                }`}
                                onClick={() => handleSelectGroup(group)}
                            >
                                <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex justify-center items-center shadow-gray-500 bg-fuchsia-100 shadow-lg flex-shrink-0'>
                                    {group.image ? (
                                        <img src={group.image} alt="" className='h-[100%] w-full object-cover' />
                                    ) : (
                                        <HiUserGroup className='w-[28px] h-[28px] text-fuchsia-600' />
                                    )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <h1 className='text-gray-800 font-semibold text-[20px] truncate'>
                                        {group.name}
                                    </h1>
                                    <p className='text-gray-500 text-[13px] truncate'>
                                        {group.members?.length || 0} members
                                    </p>
                                </div>
                            </div>
                        ))}
                        <h2 className='w-[95%] text-gray-600 font-semibold text-[14px] uppercase tracking-wide mt-[10px]'>
                            Chats
                        </h2>
                    </>
                )}

                {/* Users Section */}
                {otherUsers?.map((user) => (
                    <div 
                        key={user._id || user.id} 
                        className='w-[95%] h-[60px] flex items-center gap-[20px] shadow-gray-500 bg-white shadow-lg rounded-full hover:bg-[#b2ccdf] cursor-pointer flex-shrink-0'
                        onClick={() => handleSelectUser(user)} 
                    >
                        {/* Online Users Indicator: avatar ko relative kiya taaki green dot
                            iske andar absolute position ho sake */}
                        <div className='relative w-[60px] h-[60px] rounded-full flex-shrink-0'>
                            <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex justify-center items-center shadow-gray-500 bg-white shadow-lg'>
                                <img src={user.image || dp} alt="" className='h-[100%]' />
                            </div>
                            {onlineUsers?.includes(user._id) && (
                                <span className='absolute bottom-[2px] right-[2px] w-[14px] h-[14px] bg-green-500 rounded-full border-2 border-white'></span>
                            )}
                        </div>
                        <h1 className='text-gray-800 font-semibold text-[20px] truncate'>
                            {user.name || user.userName}
                        </h1>
                    </div>
                ))}
            </div>

            {showCreateGroup && (
                <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
            )}
        </div>
    );
}

export default SideBar;
