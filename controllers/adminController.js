import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// =====================================================
// CREATE HOTEL + OWNER
// =====================================================

export const createHotelWithOwner = async (req, res) => {
  try {
    const {
      hotelName,
      address,
      phone,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = req.body;

    if (
      !hotelName ||
      !ownerName ||
      !ownerEmail ||
      !ownerPassword
    ) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const existingUser = await User.findOne({
      email: ownerEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Owner already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      ownerPassword,
      10
    );

    // CREATE OWNER

    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: "owner",
      mustChangePassword: true,
      accountStatus: "active",
    });

    // CREATE HOTEL

    const hotel = await Hotel.create({
      name: hotelName,
      address,
      phone,
      owner: owner._id,
      setupCompleted: false,
      isActive: true,
    });

    // LINK HOTEL TO OWNER

    owner.hotelId = hotel._id;

    await owner.save();

    const populatedHotel =
      await Hotel.findById(hotel._id).populate(
        "owner",
        "name email"
      );

    res.status(201).json({
      message: "Hotel created successfully",

      hotel: populatedHotel,

      owner: {
        name: owner.name,
        email: owner.email,
      },
    });

  } catch (err) {
    console.log(
      "CREATE HOTEL ERROR",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// GET ALL HOTELS
// =====================================================

export const getAllHotels = async (req, res) => {
  try {

    const hotels = await Hotel.find()
      .populate(
        "owner",
        "name email accountStatus hotelId"
      )
      .sort({
        createdAt: -1,
      });

    res.json(hotels);

  } catch (err) {

    console.log(
      "GET HOTELS ERROR",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// ACTIVATE HOTEL
// =====================================================

export const activateHotel = async (req, res) => {
  try {

    const hotel =
      await Hotel.findById(
        req.params.id
      );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Activate hotel
    hotel.isActive = true;

    await hotel.save();

    // Activate owner account too
    if (hotel.owner) {

      await User.findByIdAndUpdate(
        hotel.owner,
        {
          accountStatus: "active",
        }
      );

    }

    const updatedHotel =
      await Hotel.findById(
        hotel._id
      ).populate(
        "owner",
        "name email accountStatus"
      );

    res.json({
      message: "Hotel activated successfully",
      hotel: updatedHotel,
    });

  } catch (err) {

    console.log(
      "ACTIVATE HOTEL ERROR",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// DEACTIVATE HOTEL
// =====================================================

export const deactivateHotel = async (
  req,
  res
) => {

  try {

    const hotel =
      await Hotel.findById(
        req.params.id
      );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Deactivate hotel
    hotel.isActive = false;

    await hotel.save();

    // Deactivate owner account too
    if (hotel.owner) {

      await User.findByIdAndUpdate(
        hotel.owner,
        {
          accountStatus: "inactive",
        }
      );

    }

    const updatedHotel =
      await Hotel.findById(
        hotel._id
      ).populate(
        "owner",
        "name email accountStatus"
      );

    res.json({
      message: "Hotel deactivated successfully",
      hotel: updatedHotel,
    });

  } catch (err) {

    console.log(
      "DEACTIVATE HOTEL ERROR",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// DELETE HOTEL
// =====================================================

export const deleteHotel = async (
  req,
  res
) => {

  try {

    const hotel =
      await Hotel.findById(
        req.params.id
      );

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Delete owner as well
    if (hotel.owner) {

      await User.findByIdAndDelete(
        hotel.owner
      );

    }

    // Delete hotel
    await Hotel.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Hotel and owner deleted successfully",
    });

  } catch (err) {

    console.log(
      "DELETE HOTEL ERROR",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};