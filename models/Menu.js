import mongoose from "mongoose";
const menuSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },

    category: {
      type: String,
    },

    name: {
      type: String,
      required: true,
    },

    description: String,

    price: {
      type: Number,
      required: true,
    },

    prepTime: {
      type: Number,
      required: true,
    },
category: {
  type: String,
},

foodType: {
  type: String,
  enum: ["veg", "nonveg"],
  default: "veg",
},
scheduledFor: {
  type: Date,
  default: null,
},

isScheduled: {
  type: Boolean,
  default: false,
},
    image: String,

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("Menu", menuSchema);