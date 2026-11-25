import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration (Ek hi baar initialize hoga)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      console.log("Upload failed: No filePath provided.");
      return null;
    }

    // File ko Cloudinary par upload kar rahe hain
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // Isse image, video, ya document auto-detect ho jata hai
    });

    // Upload success hone ke baad, agar local file exist karti hai toh delete karo
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;

  } catch (error) {
    // Agar upload fail ho jaye, tabhi check karo ki file exist karti hai ya nahi
    // Isse ENOENT error original Cloudinary error ko hide nahi karega
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error("Cloudinary Error Details:", error);
    throw error; // Error ko throw kar rahe hain taaki controller ise catch kar sake
  }
};

export default uploadOnCloudinary;