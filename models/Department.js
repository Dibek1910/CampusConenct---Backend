import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Department name
 *         description:
 *           type: string
 *         faculty:
 *           type: array
 *           items:
 *             type: string
 *             description: Reference to Faculty model
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide department name"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    faculty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;
