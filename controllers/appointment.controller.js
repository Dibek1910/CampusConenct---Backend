import Appointment from "../models/Appointment.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Availability from "../models/Availability.js";
import User from "../models/User.js";
import { sendAppointmentEmail } from "../utils/sendEmail.js";

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facultyId
 *               - availabilityId
 *               - date
 *               - purpose
 *             properties:
 *               facultyId:
 *                 type: string
 *               availabilityId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               purpose:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Invalid input or slot already booked
 *       404:
 *         description: Faculty or availability not found
 */
export const bookAppointment = async (req, res) => {
  try {
    const { facultyId, availabilityId, date, purpose } = req.body;

    // Find student
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Find faculty
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Find availability
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    // Check if availability belongs to faculty
    if (availability.faculty.toString() !== facultyId) {
      return res.status(400).json({
        success: false,
        message: "Availability slot does not belong to this faculty",
      });
    }

    // Check if availability is active
    if (!availability.isActive) {
      return res.status(400).json({
        success: false,
        message: "Availability slot is not active",
      });
    }

    // Check if availability is already booked
    if (availability.isBooked) {
      return res.status(400).json({
        success: false,
        message: "Availability slot is already booked",
      });
    }

    // Check if student already has an appointment at the same time
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      student: student._id,
      date: appointmentDate,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      student: student._id,
      faculty: faculty._id,
      availability: availability._id,
      date: appointmentDate,
      startTime: availability.startTime,
      endTime: availability.endTime,
      purpose,
      status: "pending",
    });

    // Update availability
    availability.isBooked = true;
    await availability.save();

    // Add appointment to student and faculty
    student.appointments.push(appointment._id);
    await student.save();

    faculty.appointments.push(appointment._id);
    await faculty.save();

    // Get user emails
    const studentUser = await User.findById(student.user);
    const facultyUser = await User.findById(faculty.user);

    // Send email notifications
    await sendAppointmentEmail(
      studentUser.email,
      "Appointment Request Submitted",
      `Your appointment request with ${
        faculty.name
      } on ${appointmentDate.toDateString()} at ${
        availability.startTime
      } has been submitted and is pending approval.`
    );

    await sendAppointmentEmail(
      facultyUser.email,
      "New Appointment Request",
      `You have a new appointment request from ${
        student.name
      } on ${appointmentDate.toDateString()} at ${availability.startTime}.`
    );

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/appointments/student:
 *   get:
 *     summary: Get student appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student appointments
 *       404:
 *         description: Student not found
 */
export const getStudentAppointments = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const appointments = await Appointment.find({ student: student._id })
      .populate({
        path: "faculty",
        select: "name phoneNumber",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate("availability", "day startTime endTime")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get student appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/appointments/faculty:
 *   get:
 *     summary: Get faculty appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of faculty appointments
 *       404:
 *         description: Faculty not found
 */
export const getFacultyAppointments = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const appointments = await Appointment.find({ faculty: faculty._id })
      .populate({
        path: "student",
        select:
          "name registrationNumber course branch currentYear currentSemester phoneNumber",
      })
      .populate("availability", "day startTime endTime")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get faculty appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/appointments/{appointmentId}/status:
 *   put:
 *     summary: Update appointment status (faculty only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *               reason:
 *                 type: string
 *                 description: Required if status is rejected
 *     responses:
 *       200:
 *         description: Appointment status updated
 *       400:
 *         description: Invalid status or appointment already processed
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Appointment not found
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, reason } = req.body;

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be accepted or rejected",
      });
    }

    // Find faculty
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment belongs to faculty
    if (appointment.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this appointment",
      });
    }

    // Check if appointment is already processed
    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${appointment.status}`,
      });
    }

    // Update appointment status
    appointment.status = status;
    if (status === "rejected" && reason) {
      appointment.cancelReason = reason;
    }
    await appointment.save();

    // If rejected, update availability
    if (status === "rejected") {
      const availability = await Availability.findById(
        appointment.availability
      );
      if (availability) {
        availability.isBooked = false;
        await availability.save();
      }
    }

    // Get student and faculty users for email
    const student = await Student.findById(appointment.student);
    const studentUser = await User.findById(student.user);
    const facultyUser = await User.findById(faculty.user);

    // Send email notifications
    const statusText = status === "accepted" ? "accepted" : "rejected";
    const reasonText = reason ? ` Reason: ${reason}` : "";

    await sendAppointmentEmail(
      studentUser.email,
      `Appointment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      `Your appointment with ${
        faculty.name
      } on ${appointment.date.toDateString()} at ${
        appointment.startTime
      } has been ${statusText}.${reasonText}`
    );

    res.status(200).json({
      success: true,
      message: `Appointment ${statusText} successfully`,
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/appointments/{appointmentId}/cancel:
 *   put:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled
 *       400:
 *         description: Appointment already cancelled or rejected
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Appointment not found
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment is already cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Check if appointment is rejected
    if (appointment.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a rejected appointment",
      });
    }

    let role;
    // Check if user is student or faculty
    const student = await Student.findOne({ user: req.user.id });
    if (student) {
      // Check if appointment belongs to student
      if (appointment.student.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this appointment",
        });
      }
      role = "student";
    } else {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      // Check if appointment belongs to faculty
      if (appointment.faculty.toString() !== faculty._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this appointment",
        });
      }
      role = "faculty";
    }

    // Update appointment
    appointment.status = "cancelled";
    appointment.cancelledBy = role;
    if (reason) {
      appointment.cancelReason = reason;
    }
    await appointment.save();

    // Update availability
    const availability = await Availability.findById(appointment.availability);
    if (availability) {
      availability.isBooked = false;
      await availability.save();
    }

    // Get student and faculty for email
    const studentObj = await Student.findById(appointment.student);
    const facultyObj = await Faculty.findById(appointment.faculty);
    const studentUser = await User.findById(studentObj.user);
    const facultyUser = await User.findById(facultyObj.user);

    // Send email notifications
    const cancelledBy = role === "student" ? studentObj.name : facultyObj.name;
    const reasonText = reason ? ` Reason: ${reason}` : "";

    await sendAppointmentEmail(
      studentUser.email,
      "Appointment Cancelled",
      `Your appointment with ${
        facultyObj.name
      } on ${appointment.date.toDateString()} at ${
        appointment.startTime
      } has been cancelled by ${cancelledBy}.${reasonText}`
    );

    await sendAppointmentEmail(
      facultyUser.email,
      "Appointment Cancelled",
      `Your appointment with ${
        studentObj.name
      } on ${appointment.date.toDateString()} at ${
        appointment.startTime
      } has been cancelled by ${cancelledBy}.${reasonText}`
    );

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @swagger
 * /api/appointments/{appointmentId}/complete:
 *   put:
 *     summary: Mark appointment as completed (faculty only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment marked as completed
 *       400:
 *         description: Appointment not accepted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Appointment not found
 */
export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Find faculty
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment belongs to faculty
    if (appointment.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this appointment",
      });
    }

    // Check if appointment is accepted
    if (appointment.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Appointment must be accepted before it can be completed. Current status: ${appointment.status}`,
      });
    }

    // Update appointment
    appointment.status = "completed";
    await appointment.save();

    // Update availability
    const availability = await Availability.findById(appointment.availability);
    if (availability) {
      availability.isBooked = false;
      await availability.save();
    }

    // Get student for email
    const student = await Student.findById(appointment.student);
    const studentUser = await User.findById(student.user);

    // Send email notification
    await sendAppointmentEmail(
      studentUser.email,
      "Appointment Completed",
      `Your appointment with ${
        faculty.name
      } on ${appointment.date.toDateString()} at ${
        appointment.startTime
      } has been marked as completed.`
    );

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      data: appointment,
    });
  } catch (error) {
    console.error("Complete appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
