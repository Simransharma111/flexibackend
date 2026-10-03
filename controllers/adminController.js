import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// =====================================================
// SUBSCRIPTION CONFIG
// =====================================================

const PLAN_DURATIONS = {
  trial: 14,
  basic: 30,
  premium: 30,
};

const VALID_PLANS = [
  "trial",
  "basic",
  "premium",
];

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
      subscriptionPlan,
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

    const cleanEmail =
      ownerEmail.trim().toLowerCase();

    // -------------------------------------------------
    // PLAN
    // -------------------------------------------------

    const plan = VALID_PLANS.includes(
      subscriptionPlan
    )
      ? subscriptionPlan
      : "trial";

    const subscriptionStartedAt =
      new Date();

    const subscriptionExpiresAt =
      new Date(subscriptionStartedAt);

    subscriptionExpiresAt.setDate(
      subscriptionExpiresAt.getDate() +
        PLAN_DURATIONS[plan]
    );

    // -------------------------------------------------
    // CHECK EXISTING OWNER
    // -------------------------------------------------

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
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

      hotelId: null,

      accountStatus: "active",

      createdBy: "admin",

      subscriptionPlan: plan,

      subscriptionStartedAt,

      subscriptionExpiresAt,

      mustChangePassword: true,
    });

    // -------------------------------------------------
    // CREATE HOTEL
    // -------------------------------------------------

    let hotel;

    try {
      hotel = await Hotel.create({
        name: hotelName.trim(),

        address:
          address?.trim() || "",

        phone:
          phone?.trim() || "",

        owner: owner._id,

        setupCompleted: false,

        isActive: true,
      });
    } catch (hotelError) {
      await User.findByIdAndDelete(
        owner._id
      );

      throw hotelError;
    }

    // -------------------------------------------------
    // LINK OWNER
    // -------------------------------------------------

    owner.hotelId = hotel._id;

    await owner.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    const populatedHotel =
      await Hotel.findById(
        hotel._id
      ).populate(
        "owner",
        "name email accountStatus subscriptionPlan subscriptionStartedAt subscriptionExpiresAt"
      );

    return res.status(201).json({
      success: true,

      message:
        "Hotel created successfully",

      hotel: populatedHotel,

      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        hotelId: owner.hotelId,
        accountStatus:
          owner.accountStatus,

        subscriptionPlan:
          owner.subscriptionPlan,

        subscriptionStartedAt:
          owner.subscriptionStartedAt,

        subscriptionExpiresAt:
          owner.subscriptionExpiresAt,

        mustChangePassword:
          owner.mustChangePassword,
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

export const getAllHotels = async (
  req,
  res
) => {
  try {
    const hotels =
      await Hotel.find()
        .populate(
          "owner",
          [
            "name",
            "email",
            "accountStatus",
            "hotelId",
            "subscriptionPlan",
            "subscriptionStartedAt",
            "subscriptionExpiresAt",
          ].join(" ")
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

export const activateHotel = async (
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
        success: false,
        message: "Hotel not found",
      });
    }

    hotel.isActive = true;

    await hotel.save();

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
        "name email accountStatus subscriptionPlan subscriptionStartedAt subscriptionExpiresAt"
      );

    return res.status(200).json({
      success: true,
      message:
        "Hotel activated successfully",
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
    const hotel =
      await Hotel.findById(
        req.params.id
      );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    hotel.isActive = false;

    await hotel.save();

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
        "name email accountStatus subscriptionPlan subscriptionStartedAt subscriptionExpiresAt"
      );

    return res.status(200).json({
      success: true,
      message:
        "Hotel deactivated successfully",
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
// HOTEL + OWNER + STAFF
// =====================================================

export const deleteHotel = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const hotel =
      await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // -------------------------------------------------
    // DELETE ALL STAFF + OWNER
    // -------------------------------------------------

    const userDeleteResult =
      await User.deleteMany({
        hotelId: hotel._id,
        role: {
          $in: [
            "owner",
            "staff",
          ],
        },
      });

    // -------------------------------------------------
    // SAFETY:
    // DELETE OWNER EVEN IF HOTEL'S owner FIELD
    // WAS NOT CORRECTLY LINKED
    // -------------------------------------------------

    if (hotel.owner) {
      await User.deleteOne({
        _id: hotel.owner,
        role: "owner",
      });
    }

    // -------------------------------------------------
    // DELETE HOTEL
    // -------------------------------------------------

    await Hotel.deleteOne({
      _id: hotel._id,
    });

    return res.status(200).json({
      success: true,

      message:
        "Hotel, owner and staff accounts deleted successfully",

      deleted: {
        hotel: 1,
        users:
          userDeleteResult.deletedCount,
      },
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
// GET HOTEL STAFF
// =====================================================

export const getHotelStaff = async (
  req,
  res
) => {
  try {
    const { hotelId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        hotelId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const hotel =
      await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const staff =
      await User.find({
        hotelId,
        role: "staff",
      })
        .select(
          "name email role position accountStatus createdAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (err) {
    console.error(
      "GET HOTEL STAFF ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch hotel staff",
    });
  }
};

// =====================================================
// RESET USER PASSWORD
// OWNER OR STAFF
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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // NEVER RESET SUPERADMIN
    // -------------------------------------------------

    if (
      user.role === "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Super admin password cannot be reset from here",
      });
    }

    // -------------------------------------------------
    // ONLY OWNER / STAFF
    // -------------------------------------------------

    if (
      !["owner", "staff"].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only owner or staff passwords can be reset",
      });
    }

    // -------------------------------------------------
    // GENERATE TEMPORARY PASSWORD
    // -------------------------------------------------

    const temporaryPassword =
      "FX-" +
      crypto
        .randomBytes(3)
        .toString("hex") +
      "-" +
      crypto
        .randomBytes(2)
        .toString("hex");

    // -------------------------------------------------
    // HASH
    // -------------------------------------------------

    user.password =
      await bcrypt.hash(
        temporaryPassword,
        10
      );

    user.mustChangePassword = true;

    user.resetPasswordToken = null;

    user.resetPasswordExpires = null;

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

// =====================================================
// EXTEND SUBSCRIPTION
// =====================================================

export const extendSubscription = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      days,
      plan,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const hotel =
      await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    const owner =
      await User.findOne({
        _id: hotel.owner,
        role: "owner",
      });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message:
          "Owner account not found",
      });
    }

    const extensionDays =
      Number(days);

    if (
      !Number.isInteger(
        extensionDays
      ) ||
      extensionDays <= 0 ||
      extensionDays > 3650
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Extension must be between 1 and 3650 days",
      });
    }

    // -------------------------------------------------
    // OPTIONAL PLAN CHANGE
    // -------------------------------------------------

    if (
      plan &&
      VALID_PLANS.includes(plan)
    ) {
      owner.subscriptionPlan =
        plan;
    }

    // -------------------------------------------------
    // CALCULATE NEW EXPIRY
    // -------------------------------------------------

    const now = new Date();

    let baseDate = now;

    if (
      owner.subscriptionExpiresAt &&
      new Date(
        owner.subscriptionExpiresAt
      ) > now
    ) {
      baseDate = new Date(
        owner.subscriptionExpiresAt
      );
    }

    const newExpiry =
      new Date(baseDate);

    newExpiry.setDate(
      newExpiry.getDate() +
        extensionDays
    );

    if (
      !owner.subscriptionStartedAt
    ) {
      owner.subscriptionStartedAt =
        now;
    }

    owner.subscriptionExpiresAt =
      newExpiry;

    owner.accountStatus = "active";

    await owner.save();

    return res.status(200).json({
      success: true,

      message:
        "Subscription extended successfully",

      subscription: {
        plan:
          owner.subscriptionPlan,

        startedAt:
          owner.subscriptionStartedAt,

        expiresAt:
          owner.subscriptionExpiresAt,
      },
    });
  } catch (error) {
    console.error(
      "EXTEND SUBSCRIPTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to extend subscription",
    });
  }
};