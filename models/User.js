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


    // STAFF ROLE INFORMATION
    position: {
      type: String,
      default: "Staff",
    },


    /*
    ==================================
    PASSWORD SETUP SYSTEM
    ==================================
    */

    passwordSetupToken: {
      type: String,
      default: null,
    },


    passwordSetupExpires: {
      type: Date,
      default: null,
    },


    /*
    ==================================
    PUSH NOTIFICATIONS
    ==================================
    */

    fcmToken: {
      type: String,
      default: null,
    },


  },
  {
    timestamps:true,
  }
);


export default mongoose.model(
  "User",
  userSchema
);