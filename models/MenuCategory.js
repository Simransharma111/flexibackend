import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    subCategories: {
      type: [String],
      default: [],
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

menuCategorySchema.index(
  { hotelId: 1, name: 1 },
  { unique: true }
);

export default mongoose.model(
  "MenuCategory",
  menuCategorySchema
);