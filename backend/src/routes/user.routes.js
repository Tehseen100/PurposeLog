import express from "express";
import {
  changePassword,
  deleteUserAccount,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import isAuthenticated from "../middlewares/isAuthenticated.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Protected routes
router.use(verifyJWT);
router.use(isAuthenticated);

router.get("/profile", getUserProfile);
router.post("/profile", upload.single("avatar"), updateUserProfile);
router.post("/change-password", changePassword);
router.delete("/delete", deleteUserAccount);

export default router;
