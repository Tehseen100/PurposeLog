import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";

// @desc   Get current user profile
// @route  GET /api/v1/users/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: { user },
  });
});

// @desc   Update current user profile
// @route  PUT /api/v1/users/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (fullName) user.fullName = fullName;

  if (username || email) {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or Email is already in use",
      });
    }

    if (username) user.username = username;
    if (email) user.email = email;
  }

  if (req.file) {
    // Upload new avatar
    const cloudinaryResponse = await uploadToCloudinary(req.file.path);

    if (!cloudinaryResponse) {
      return res.status(500).json({
        success: false,
        message: "Cloud upload failed. Please try again.",
      });
    }

    // Delete old avatar
    if (user.avatar?.public_id) {
      try {
        await deleteFromCloudinary(user.avatar.public_id);
      } catch (error) {
        console.log("Cloudinary old avatar deletion failed:", error);
      }
    }

    user.avatar = {
      url: cloudinaryResponse.secure_url,
      public_id: cloudinaryResponse.public_id,
    };
  }

  await user.save();

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: updatedUser },
  });
});

// @desc   Change password
// @route  PUT /api/v1/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword?.trim() || !newPassword?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Old and new password are required",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const isMatch = await user.isPasswordCorrect(oldPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Old password is incorrect",
    });
  }
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc   Delete current user account
// @route  DELETE /api/v1/users/delete
export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.avatar?.public_id) {
    try {
      await deleteFromCloudinary(user.avatar.public_id);
    } catch (error) {
      console.log("Cloudinary avatar deletion failed:", error);
    }
  }

  await Task.deleteMany({ owner: req.user._id });
  await user.deleteOne();

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json({ success: true, message: "Account deleted successfully" });
});
