import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    // Restaurant

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // Category

    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Dish

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

    // Pricing

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    prepTime: {
      type: Number,
      required: true,
      default: 15,
    },

    // Veg / Non-Veg

    foodType: {
      type: String,
      enum: ["veg", "nonveg"],
      default: "veg",
    },

    // Availability

    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Featured Sections

    featured: {
      type: Boolean,
      default: false,
    },

    todaySpecial: {
      type: Boolean,
      default: false,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },

    isBestseller: {
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

    // Custom Tags

    tags: {
      type: [String],
      default: [],
    },

    // Spice Level

    spiceLevel: {
      type: String,
      enum: ["mild", "medium", "hot", ""],
      default: "",
    },

    // Rating

    rating: {
      type: Number,
      default: 0,
    },

    // Display Order

    displayOrder: {
      type: Number,
      default: 0,
    },

    // Scheduled Menu

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

export default mongoose.model("Menu", menuSchema);