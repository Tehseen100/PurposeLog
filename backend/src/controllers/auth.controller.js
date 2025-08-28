import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Cookie Options
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @des    Register new user
// @route  POST /api/v1/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if ([fullName, username, email, password].some((field) => !field?.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (!req.file) {
    return res.status(400).json("Avatar is required");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Username or Email is already in use",
    });
  }

  const cloudinaryResponse = await uploadToCloudinary(req.file.path);

  if (!cloudinaryResponse) {
    return res.status(500).json({
      success: false,
      message: "Cloud upload failed. Please try again.",
    });
  }

  const avatar = {
    url: cloudinaryResponse.secure_url,
    public_id: cloudinaryResponse.public_id,
  };

  // Create new user
  const user = await User.create({
    fullName,
    username,
    avatar,
    email,
    password,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .status(201)
    .json({
      success: true,
      message: "User registered and logged in successfully",
      data: { user: registeredUser },
    });
});

// @des    Login user
// @route  POST /api/v1/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username?.trim() || email?.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "Username or Email is required" });
  }

  if (!password?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Password is required" });
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .status(200)
    .json({
      success: true,
      message: "User logged in successfully",
      data: { user: loggedInUser },
    });
});

// @des    Refresh access token
// @route  POST /api/v1/auth/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized request. Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded._id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User does not exist",
      });
    }

    // Generate tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res
      .cookie("accessToken", newAccessToken, accessTokenCookieOptions)
      .cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Tokens refreshed successfully",
      });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
});

// @des    Logout user
// @route  POST /api/v1/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  res
    .clearCookie("accessToken", { ...accessTokenCookieOptions, maxAge: 0 })
    .clearCookie("refreshToken", { ...refreshTokenCookieOptions, maxAge: 0 })
    .status(200)
    .json({ success: true, message: "User Logged out successfully" });
});
