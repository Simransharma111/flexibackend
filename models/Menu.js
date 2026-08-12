import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
      index: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    prepTime: {
      type: Number,
      default: 15,
      min: 0,
    },

    foodType: {
      type: String,
      enum: ["veg", "nonveg"],
      default: "veg",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },

    isBestseller: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    todaySpecial: {
      type: Boolean,
      default: false,
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    chefChoice: {
      type: Boolean,
      default: false,
    },

    spiceLevel: {
      type: String,
      enum: ["", "mild", "medium", "hot"],
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    gst: {
      type: Number,
      default: null,
      min: 0,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

menuSchema.index({
  hotelId: 1,
  categoryId: 1,
});

export default mongoose.model("Menu", menuSchema);