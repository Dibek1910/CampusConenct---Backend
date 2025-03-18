import express from "express";
import {
  registerStudent,
  registerFaculty,
  verifyRegistrationOTP,
  loginUser,
  verifyLoginOTP,
  sendProfileUpdateOTP,
  verifyProfileUpdateOTP,
  logout,
  getMe,
  getAllowedBranches,
  getAllowedDepartments,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Register routes
router.post("/register/student", registerStudent);
router.post("/register/faculty", registerFaculty);
router.post("/verify/registration", verifyRegistrationOTP);

// Login routes
router.post("/login", loginUser);
router.post("/verify/login", verifyLoginOTP);

// Get allowed branches and departments
router.get("/branches", getAllowedBranches);
router.get("/departments", getAllowedDepartments);

// Profile update OTP routes
router.post("/profile-update/send-otp", protect, sendProfileUpdateOTP);
router.post("/profile-update/verify-otp", protect, verifyProfileUpdateOTP);

// User routes
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
