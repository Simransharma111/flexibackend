import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: [
        "superadmin",
        "owner",
        "staff",
      ],
      default: "staff",
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },

    position: {
      type: String,
      default: "Staff",
    },

    accountStatus: {
      type: String,
      enum: [
        "active",
        "inactive",
        "pending",
      ],
      default: "active",
    },

    subscriptionPlan: {
      type: String,
      enum: [
        "trial",
        "basic",
        "premium",
      ],
      default: "trial",
    },

    createdBy: {
      type: String,
      enum: [
        "self",
        "admin",
      ],
      default: "self",
    },

    // FORCE PASSWORD CHANGE
    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    // FCM PUSH NOTIFICATIONS
    fcmToken: {
      type: String,
      default: null,
    },

    // PASSWORD RESET
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "User",
  userSchema
);