import Hotel from "../models/Hotel.js";
import cloudinary from "../config/cloudinary.js";

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
         accent: String
       }
    ======================================================= */

    hotel.theme = {
      id:
        req.body.themeId ||
        hotel.theme?.id ||
        "stormy_morning",

      // accept either legacy names (themePrimary) or new names (primaryColor)
      primary:
        req.body.themePrimary || req.body.primaryColor ||
        hotel.theme?.primary ||
        "#64748B",

      secondary:
        req.body.themeSecondary || req.body.secondaryColor ||
        hotel.theme?.secondary ||
        "#0F172A",

      accent:
        req.body.themeAccent || req.body.accentColor ||
        hotel.theme?.accent ||
        "#94A3B8",
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

    return res.status(200).json({
      success: true,
      hotel,
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

    // accept either legacy names (themePrimary) or new names (primaryColor)
    hotel.theme = {
      id: req.body.themeId || hotel.theme.id,
      primary: req.body.themePrimary || req.body.primaryColor || hotel.theme.primary,
      secondary: req.body.themeSecondary || req.body.secondaryColor || hotel.theme.secondary,
      accent: req.body.themeAccent || req.body.accentColor || hotel.theme.accent,
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