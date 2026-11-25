import React, { useRef, useState } from "react";
import dp from "../assets/dp.png";
import { FaCameraRetro } from "react-icons/fa";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { serverUrl } from "../main";
import { setUserData } from "../redux/userSlice";

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const imageRef = useRef();

  const { userData } = useSelector((state) => state.user);

  const [name, setName] = useState(userData?.userName || "");
  const [frontendImage, setFrontendImage] = useState(userData?.image || dp);
  const [backendImage, setBackendImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);

      if (backendImage) {
        formData.append("image", backendImage);
      }

      const response = await axios.put(
        `${serverUrl}/api/user/profile`,
        formData,
        { withCredentials: true }
      );

      dispatch(setUserData(response.data));
      alert("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
      alert("Profile Update Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-screen  bg-orange-60 flex flex-col justify-center items-center gap-5">
      {/* Back Button */}
      <div
        className="fixed top-5 left-5 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack className="w-14 h-14 text-fuchsia-600 hover:scale-110 transition-all duration-300" />
      </div>

      {/* Profile Image */}
      <div
        onClick={() => imageRef.current.click()}
        className="bg-white rounded-full border-4 border-fuchsia-600 shadow-lg shadow-fuchsia-300 relative cursor-pointer hover:scale-105 transition-all duration-300"
      >
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden flex justify-center items-center">
          <img src={frontendImage} alt="profile" className="h-full" />
        </div>

        {/* Camera Icon in Black */}
        <FaCameraRetro className="absolute bottom-4 right-4 text-2xl text-black" />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-[95%] max-w-[500px] flex flex-col gap-5 items-center"
      >
        <input
          ref={imageRef}
          type="file"
          hidden
          accept="image/*"
          onChange={handleImage}
        />

        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-[90%] h-[50px] border-2 border-fuchsia-600 rounded-lg px-5 outline-none bg-white focus:ring-2 focus:ring-fuchsia-500"
        />

        <input
          type="text"
          readOnly
          value={userData?.userName || ""}
          className="w-[90%] h-[50px] border-2 border-fuchsia-600 rounded-lg px-5 outline-none bg-white text-gray-600"
        />

        <input
          type="email"
          readOnly
          value={userData?.email || ""}
          className="w-[90%] h-[50px] border-2 border-fuchsia-600 rounded-lg px-5 outline-none bg-white text-gray-600"
        />

        <button
          disabled={saving}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-fuchsia-300 font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default Profile;
