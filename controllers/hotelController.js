import Hotel from "../models/Hotel.js";

import cloudinary from "../config/cloudinary.js";

export const setupHotel = async (
  req,
  res
) => {

  try {

    const hotel =
      await Hotel.findById(
        req.user.hotelId
      );

    if (!hotel) {

      return res.status(404).json({
        message: "Hotel not found",
      });

    }

    let logoUrl = hotel.logo;

    let coverUrl =
      hotel.coverImage;

    // =====================
    // LOGO UPLOAD
    // =====================

    if (req.files?.logo?.[0]) {

      const logoBase64 =
        `data:${
          req.files.logo[0].mimetype
        };base64,${
          req.files.logo[0].buffer.toString(
            "base64"
          )
        }`;

      const uploadedLogo =
        await cloudinary.uploader.upload(
          logoBase64,
          {
            folder:
              "flexiorder/hotels/logo",
          }
        );

      logoUrl =
        uploadedLogo.secure_url;

    }

    // =====================
    // COVER IMAGE UPLOAD
    // =====================

    if (
      req.files?.coverImage?.[0]
    ) {

      const coverBase64 =
        `data:${
          req.files.coverImage[0]
            .mimetype
        };base64,${
          req.files.coverImage[0]
            .buffer.toString(
              "base64"
            )
        }`;

      const uploadedCover =
        await cloudinary.uploader.upload(
          coverBase64,
          {
            folder:
              "flexiorder/hotels/covers",
          }
        );

      coverUrl =
        uploadedCover.secure_url;

    }

    // =====================
    // SAVE HOTEL
    // =====================

    hotel.name = req.body.name;

    hotel.tagline =
      req.body.tagline;

    hotel.description =
      req.body.description;

    hotel.type =
      req.body.type;

    hotel.address =
      req.body.address;

    hotel.phone =
      req.body.phone;

    hotel.email =
      req.body.email;

    hotel.logo = logoUrl;

    hotel.coverImage =
      coverUrl;

    hotel.theme = {
      preset:
        req.body.themePreset,

      primaryColor:
        req.body.primaryColor,

      secondaryColor:
        req.body.secondaryColor,

      cardColor:
        req.body.cardColor,
    };

    hotel.setupCompleted = true;

    await hotel.save();

    res.json({
      message:
        "Hotel setup completed",
      hotel,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }

};
export const getMyHotel = async (
  req,
  res
) => {

  try {

    const hotel =
      await Hotel.findById(
        req.user.hotelId
      );

    res.json(hotel);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};