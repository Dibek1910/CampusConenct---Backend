import express from "express";
import {
  bookAppointment,
  getStudentAppointments,
  getFacultyAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  completeAppointment,
} from "../controllers/appointment.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Student appointment routes
router.post("/", authorize("student"), bookAppointment);
router.get("/student", authorize("student"), getStudentAppointments);

// Faculty appointment routes
router.get("/faculty", authorize("faculty"), getFacultyAppointments);
router.put(
  "/:appointmentId/status",
  authorize("faculty"),
  updateAppointmentStatus
);
router.put(
  "/:appointmentId/complete",
  authorize("faculty"),
  completeAppointment
);

// Common routes
router.put("/:appointmentId/cancel", cancelAppointment);

export default router;
