import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  getAllFaculty,
  getFacultyAvailability,
  getAllDepartments,
} from "../controllers/student.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize("student"));

// Student profile routes
router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);

// Faculty routes
router.get("/faculty", getAllFaculty);
router.get("/faculty/:facultyId/availability", getFacultyAvailability);

// Department routes
router.get("/departments", getAllDepartments);

export default router;
