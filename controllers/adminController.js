import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !hotelName?.trim() ||
      !ownerName?.trim() ||
      !ownerEmail?.trim() ||
      !ownerPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanEmail = ownerEmail
      .trim()
      .toLowerCase();

    // -------------------------------------------------
    // CHECK EXISTING OWNER
    // -------------------------------------------------

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      ownerPassword,
      10
    );

    // -------------------------------------------------
    // CREATE OWNER
    // -------------------------------------------------

    const owner = await User.create({
      name: ownerName.trim(),
      email: cleanEmail,
      password: hashedPassword,

      role: "owner",

      // Admin-created owner must change password
      mustChangePassword: true,

      accountStatus: "active",

      // This is an admin-created account
      createdBy: "admin",

      // Hotel is linked immediately after creation
      hotelId: null,
    });

    // -------------------------------------------------
    // CREATE HOTEL
    // -------------------------------------------------

    let hotel;

    try {
      hotel = await Hotel.create({
        name: hotelName.trim(),

        address: address?.trim() || "",
        phone: phone?.trim() || "",

        owner: owner._id,

        // Owner still needs to complete hotel setup
        setupCompleted: false,

        // Hotel is active unless superadmin deactivates it
        isActive: true,
      });
    } catch (hotelError) {
      // Prevent orphan owner if hotel creation fails
      await User.findByIdAndDelete(owner._id);

      throw hotelError;
    }

    // -------------------------------------------------
    // LINK OWNER → HOTEL
    // -------------------------------------------------

    owner.hotelId = hotel._id;

    await owner.save();

    // -------------------------------------------------
    // POPULATE RESPONSE
    // -------------------------------------------------

    const populatedHotel = await Hotel.findById(
      hotel._id
    ).populate(
      "owner",
      "name email accountStatus"
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message: "Hotel created successfully",

      hotel: populatedHotel,

      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        hotelId: owner.hotelId,
        accountStatus: owner.accountStatus,
        mustChangePassword: owner.mustChangePassword,
      },
    });

  } catch (err) {
    console.error(
      "CREATE HOTEL ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to create hotel",
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

    return res.status(200).json({
      success: true,
      hotels,
    });

  } catch (err) {
    console.error(
      "GET HOTELS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch hotels",
    });
  }
};

// =====================================================
// ACTIVATE HOTEL
// =====================================================

export const activateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(
      req.params.id
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Activate hotel
    hotel.isActive = true;

    await hotel.save();

    // Activate owner account
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

    return res.status(200).json({
      success: true,
      message: "Hotel activated successfully",
      hotel: updatedHotel,
    });

  } catch (err) {
    console.error(
      "ACTIVATE HOTEL ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to activate hotel",
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
    const hotel = await Hotel.findById(
      req.params.id
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Deactivate hotel
    hotel.isActive = false;

    await hotel.save();

    // Deactivate owner account
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

    return res.status(200).json({
      success: true,
      message: "Hotel deactivated successfully",
      hotel: updatedHotel,
    });

  } catch (err) {
    console.error(
      "DEACTIVATE HOTEL ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to deactivate hotel",
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
    const hotel = await Hotel.findById(
      req.params.id
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Delete owner
    if (hotel.owner) {
      await User.findByIdAndDelete(
        hotel.owner
      );
    }

    // Delete hotel
    await Hotel.findByIdAndDelete(
      hotel._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Hotel and owner deleted successfully",
    });

  } catch (err) {
    console.error(
      "DELETE HOTEL ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to delete hotel",
    });
  }
};

// =====================================================
// RESET USER PASSWORD
// =====================================================

export const resetUserPassword = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Superadmin cannot be reset by another
    // superadmin through this endpoint
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Super admin password cannot be reset from here",
      });
    }

    // -------------------------------------------------
    // GENERATE TEMPORARY PASSWORD
    // -------------------------------------------------

    const temporaryPassword =
      "FX-" +
      crypto.randomBytes(3).toString("hex") +
      "-" +
      crypto.randomBytes(2).toString("hex");

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    user.password = await bcrypt.hash(
      temporaryPassword,
      10
    );

    // Force user to change password
    // after next successful login
    user.mustChangePassword = true;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "Password reset successfully",

      temporaryPassword,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "RESET USER PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset user password",
    });
  }
};