import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(

  {

    // BASIC INFO

    name: {
      type: String,
      required: true,
    },

    tagline: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "hotel",
        "restaurant",
        "cafe",
        "resort",
        "cloud-kitchen",
      ],
      default: "hotel",
    },

    // CONTACT INFO

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },

    // BRANDING

    logo: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    // THEME

   theme: {
  id: String,
  primary: String,
  secondary: String,
  accent: String
},
    // OWNER

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // SETUP STATUS

    setupCompleted: {
      type: Boolean,
      default: false,
    },

    // STATUS

    isActive: {
      type: Boolean,
      default: true,
    },

  },

  {
    timestamps: true,
  }

);

export default mongoose.model(
  "Hotel",
  hotelSchema
);