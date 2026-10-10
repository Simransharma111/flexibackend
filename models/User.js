import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC USER INFORMATION
    // =====================================================

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

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: [
        "superadmin",
        "owner",
        "staff",
      ],
      default: "staff",
    },

    // =====================================================
    // HOTEL
    // =====================================================

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
      index: true,
    },

    position: {
      type: String,
      default: "Staff",
      trim: true,
    },

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

    accountStatus: {
      type: String,
      enum: [
        "active",
        "inactive",
        "pending",
      ],
      default: "active",
    },

    // =====================================================
    // SUBSCRIPTION
    // =====================================================

    subscriptionPlan: {
      type: String,
      enum: [
        "trial",
        "basic",
        "premium",
      ],
      default: "trial",
    },

    subscriptionStartedAt: {
      type: Date,
      default: null,
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // ACCOUNT CREATION SOURCE
    // =====================================================

    createdBy: {
      type: String,
      enum: [
        "self",
        "admin",
      ],
      default: "self",
    },

    // Which Super Admin created this account
    // Only populated when createdBy === "admin"
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================================
    // FORCE PASSWORD CHANGE
    // =====================================================

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // FCM PUSH NOTIFICATIONS
    // =====================================================

    fcmToken: {
      type: String,
      default: null,
    },

    // =====================================================
    // PASSWORD RESET
    // =====================================================

    resetPasswordTokenHash: {
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

// =====================================================
// INDEXES
// =====================================================

userSchema.index({
  hotelId: 1,
  role: 1,
});

userSchema.index({
  subscriptionExpiresAt: 1,
});

export default mongoose.model(
  "User",
  userSchema
);
