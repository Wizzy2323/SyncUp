import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";

export const getCurrentUser = async (req, res) => {
  try {
    let userId = req.userId;
    let user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `current user error ${error}` });
  }
};

export const editProfile = async (req, res) => {
  try {
    const { name } = req.body;
    let image;

    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, image },
      { new: true } // ensures updated user document is returned
    );

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Profile update failed", error });
  }
};
// Fetch all users except the current one
export const getOtherUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
                            .select("-password");

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching other users:", err);
    res.status(500).json({
      message: "Failed to retrieve other users",
      error: err.message
    });
  }
};
