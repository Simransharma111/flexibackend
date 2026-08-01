import Hotel from "../models/Hotel.js";
import cloudinary from "../config/cloudinary.js";

const HOTEL_THEMES = {
  stormy_morning: {
    id: "stormy_morning",
    primary: "#64748B",
    secondary: "#0F172A",
    accent: "#94A3B8",
    text: "#E6EEF8",
    mode: "dark",
  },
  mossy_hollow: {
    id: "mossy_hollow",
    primary: "#4D7C0F",
    secondary: "#1A2E05",
    accent: "#84CC16",
    text: "#F7FCE8",
    mode: "dark",
  },
  blue_eclipse: {
    id: "blue_eclipse",
    primary: "#1E293B",
    secondary: "#020617",
    accent: "#3B82F6",
    text: "#E6EEF8",
    mode: "dark",
  },
  lush_forest: {
    id: "lush_forest",
    primary: "#14532D",
    secondary: "#052E16",
    accent: "#22C55E",
    text: "#EAFBEC",
    mode: "dark",
  },
  green_juice: {
    id: "green_juice",
    primary: "#16A34A",
    secondary: "#052E16",
    accent: "#86EFAC",
    text: "#E9FFEF",
    mode: "dark",
  },
  chili_spice: {
    id: "chili_spice",
    primary: "#DC2626",
    secondary: "#1F0A0A",
    accent: "#F97316",
    text: "#FFF6F4",
    mode: "dark",
  },
  chocolate_truffle: {
    id: "chocolate_truffle",
    primary: "#7C2D12",
    secondary: "#1C0A00",
    accent: "#D97706",
    text: "#FFF6EC",
    mode: "dark",
  },
  ink_wash: {
    id: "ink_wash",
    primary: "#111827",
    secondary: "#F8FAFC",
    accent: "#64748B",
    text: "#0F172A",
    mode: "light",
  },
};

const getThemeDefinition = (id) =>
  HOTEL_THEMES[id] || HOTEL_THEMES.stormy_morning;

/* =========================================================
   SETUP HOTEL
========================================================= */

export const setupHotel = async (req, res) => {
  try {
    /* =======================================================
       FIND CURRENT OWNER'S HOTEL
    ======================================================= */

    const hotel = await Hotel.findById(req.user.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    /* =======================================================
       KEEP OLD IMAGES IF NO NEW IMAGE IS UPLOADED
    ======================================================= */

    let logoUrl = hotel.logo || "";
    let coverUrl = hotel.coverImage || "";

    /* =======================================================
       LOGO UPLOAD
    ======================================================= */

    if (req.files?.logo?.[0]) {
      const logoFile = req.files.logo[0];

      const logoBase64 = `data:${logoFile.mimetype};base64,${logoFile.buffer.toString(
        "base64"
      )}`;

      const uploadedLogo =
        await cloudinary.uploader.upload(logoBase64, {
          folder: "flexiorder/hotels/logo",
        });

      logoUrl = uploadedLogo.secure_url;
    }

    /* =======================================================
       COVER IMAGE UPLOAD
    ======================================================= */

    if (req.files?.coverImage?.[0]) {
      const coverFile = req.files.coverImage[0];

      const coverBase64 = `data:${coverFile.mimetype};base64,${coverFile.buffer.toString(
        "base64"
      )}`;

      const uploadedCover =
        await cloudinary.uploader.upload(coverBase64, {
          folder: "flexiorder/hotels/covers",
        });

      coverUrl = uploadedCover.secure_url;
    }

    /* =======================================================
       UPDATE BASIC INFORMATION
    ======================================================= */

    hotel.name = req.body.name || hotel.name;

    hotel.tagline =
      req.body.tagline ?? hotel.tagline;

    hotel.description =
      req.body.description ?? hotel.description;

    hotel.type =
      req.body.type || hotel.type;

    /* =======================================================
       CONTACT INFORMATION
    ======================================================= */

    hotel.address =
      req.body.address ?? hotel.address;

    hotel.phone =
      req.body.phone ?? hotel.phone;

    hotel.email =
      req.body.email ?? hotel.email;

    hotel.website =
      req.body.website ?? hotel.website;

    hotel.instagram =
      req.body.instagram ?? hotel.instagram;

    hotel.whatsapp =
      req.body.whatsapp ?? hotel.whatsapp;

    /* =======================================================
       IMAGES
    ======================================================= */

    hotel.logo = logoUrl;

    hotel.coverImage = coverUrl;

    /* =======================================================
       THEME
 
       Matches Hotel model:
 
       theme: {
         id: String,
         primary: String,
         secondary: String,
         accent: String,
         text: String,
         mode: String,
       }
    ======================================================= */
 
    const selectedThemeId =
      req.body.themeId || hotel.theme?.id || "stormy_morning";
    const selectedTheme = getThemeDefinition(selectedThemeId);
 
    hotel.theme = {
      id: selectedThemeId,
      primary:
        req.body.themePrimary || req.body.primaryColor ||
        hotel.theme?.primary ||
        selectedTheme.primary,
      secondary:
        req.body.themeSecondary || req.body.secondaryColor ||
        hotel.theme?.secondary ||
        selectedTheme.secondary,
      accent:
        req.body.themeAccent || req.body.accentColor ||
        hotel.theme?.accent ||
        selectedTheme.accent,
      text:
        req.body.themeText || req.body.text ||
        hotel.theme?.text ||
        selectedTheme.text,
      mode:
        req.body.themeMode || req.body.mode ||
        hotel.theme?.mode ||
        selectedTheme.mode,
    };

    /* =======================================================
       SETUP COMPLETE
    ======================================================= */

    hotel.setupCompleted = true;

    await hotel.save();

    /* =======================================================
       RESPONSE
    ======================================================= */

    return res.status(200).json({
      success: true,
      message: "Hotel setup completed successfully",
      hotel,
    });
  } catch (err) {
    console.error("HOTEL SETUP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Hotel setup failed",
    });
  }
};

/* =========================================================
   GET MY HOTEL
========================================================= */

export const getMyHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.user.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const responseHotel = hotel.toObject();
    responseHotel.theme = {
      ...getThemeDefinition(responseHotel.theme?.id || "stormy_morning"),
      ...responseHotel.theme,
    };

    return res.status(200).json({
      success: true,
      hotel: responseHotel,
    });
  } catch (err) {
    console.error("GET MY HOTEL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch hotel",
    });
  }
};
/* =========================================================
   UPDATE HOTEL PROFILE
========================================================= */

export const updateHotelProfile = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.user.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    hotel.tagline = req.body.tagline ?? hotel.tagline;
    hotel.description = req.body.description ?? hotel.description;

    hotel.address = req.body.address ?? hotel.address;
    hotel.phone = req.body.phone ?? hotel.phone;
    hotel.email = req.body.email ?? hotel.email;
    hotel.website = req.body.website ?? hotel.website;
    hotel.instagram = req.body.instagram ?? hotel.instagram;
    hotel.whatsapp = req.body.whatsapp ?? hotel.whatsapp;

    await hotel.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      hotel,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
/* =========================================================
   UPDATE BRANDING
========================================================= */

export const updateHotelBranding = async (req, res) => {

  try {

    const hotel = await Hotel.findById(req.user.hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    let logoUrl = hotel.logo;
    let coverUrl = hotel.coverImage;

    // Logo

    if (req.files?.logo?.[0]) {

      const file = req.files.logo[0];

      const base64 =
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const uploaded =
        await cloudinary.uploader.upload(base64, {
          folder: "flexiorder/hotels/logo",
        });

      logoUrl = uploaded.secure_url;
    }

    // Cover

    if (req.files?.coverImage?.[0]) {

      const file = req.files.coverImage[0];

      const base64 =
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const uploaded =
        await cloudinary.uploader.upload(base64, {
          folder: "flexiorder/hotels/covers",
        });

      coverUrl = uploaded.secure_url;
    }

    hotel.logo = logoUrl;
    hotel.coverImage = coverUrl;

    const selectedThemeId = req.body.themeId || hotel.theme.id || "stormy_morning";
    const selectedTheme = getThemeDefinition(selectedThemeId);

    // accept either legacy names (themePrimary) or new names (primaryColor)
    hotel.theme = {
      id: selectedThemeId,
      primary: req.body.themePrimary || req.body.primaryColor || hotel.theme.primary || selectedTheme.primary,
      secondary: req.body.themeSecondary || req.body.secondaryColor || hotel.theme.secondary || selectedTheme.secondary,
      accent: req.body.themeAccent || req.body.accentColor || hotel.theme.accent || selectedTheme.accent,
      text: req.body.themeText || req.body.text || hotel.theme.text || selectedTheme.text,
      mode: req.body.themeMode || req.body.mode || hotel.theme.mode || selectedTheme.mode,
    };

    await hotel.save();

    return res.status(200).json({
      success: true,
      message: "Branding updated",
      hotel,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};