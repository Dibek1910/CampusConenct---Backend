import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - student
 *         - faculty
 *         - availability
 *         - date
 *         - startTime
 *         - endTime
 *         - purpose
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         student:
 *           type: string
 *           description: Reference to Student model
 *         faculty:
 *           type: string
 *           description: Reference to Faculty model
 *         availability:
 *           type: string
 *           description: Reference to Availability model
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *           example: '10:00'
 *         endTime:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *           example: '11:00'
 *         purpose:
 *           type: string
 *           maxLength: 200
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled, completed]
 *           default: pending
 *         cancelledBy:
 *           type: string
 *           enum: [student, faculty, null]
 *           default: null
 *         cancelReason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const appointmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Availability",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Please provide appointment date"],
    },
    startTime: {
      type: String,
      required: [true, "Please provide start time in HH:MM format"],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Please provide time in HH:MM format",
      ],
    },
    endTime: {
      type: String,
      required: [true, "Please provide end time in HH:MM format"],
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Please provide time in HH:MM format",
      ],
    },
    purpose: {
      type: String,
      required: [true, "Please provide purpose of appointment"],
      maxlength: [200, "Purpose cannot be more than 200 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    cancelledBy: {
      type: String,
      enum: ["student", "faculty", null],
      default: null,
    },
    cancelReason: {
      type: String,
      maxlength: [200, "Cancel reason cannot be more than 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
