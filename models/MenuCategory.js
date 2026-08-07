import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema(
  {
    // Restaurant
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    // Category Name
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Optional Subcategory Names
    // Example:
    // ["Veg Starter", "Non Veg Starter"]
    subCategories: {
      type: [String],
      default: [],
    },

    // Display Order
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Show / Hide Category
    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional Category Image/Icon
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate category names within the same hotel
menuCategorySchema.index(
  { hotelId: 1, name: 1 },
  { unique: true }
);

export default mongoose.model(
  "MenuCategory",
  menuCategorySchema
);