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

    // =========================
    // BRANDING
    // =========================

    logo: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    // NEW: Mobile App Banner
    banner: {
      type: String,
      default: "",
    },

    // NEW: Restaurant Icon
    favicon: {
      type: String,
      default: "",
    },

    // =========================
    // MENU DISPLAY SETTINGS
    // =========================

    displaySettings: {
      featuredCarousel: {
        type: Boolean,
        default: true,
      },

      todaySpecial: {
        type: Boolean,
        default: true,
      },

      recommended: {
        type: Boolean,
        default: true,
      },

      mostPopular: {
        type: Boolean,
        default: true,
      },

      newArrivals: {
        type: Boolean,
        default: true,
      },
    },

    // =========================
    // CUSTOM DISH TAGS
    // =========================

    dishTags: {
      type: [String],
      default: [
        "Spicy",
        "Chef's Choice",
        "Best Seller",
        "Healthy",
        "Jain Friendly",
      ],
    },

    // =========================
    // SOCIAL LINKS
    // =========================

    socialLinks: {
      facebook: {
        type: String,
        default: "",
      },

      instagram: {
        type: String,
        default: "",
      },

      youtube: {
        type: String,
        default: "",
      },

      twitter: {
        type: String,
        default: "",
      },
    },

    // =========================
    // THEME
    // =========================

    theme: {
      id: {
        type: String,
        default: "stormy_morning",
      },
      primary: {
        type: String,
        default: "#64748B",
      },
      secondary: {
        type: String,
        default: "#0F172A",
      },
      accent: {
        type: String,
        default: "#94A3B8",
      },
      text: {
        type: String,
        default: "#E6EEF8",
      },
      mode: {
        type: String,
        default: "dark",
      },
    },

    // =========================
    // OWNER
    // =========================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // =========================
    // SETUP STATUS
    // =========================

    setupCompleted: {
      type: Boolean,
      default: false,
    },

    // =========================
    // STATUS
    // =========================

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("Hotel", hotelSchema);