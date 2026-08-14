import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// =====================================================
// SELF REGISTER OWNER
// =====================================================
//
// IMPORTANT:
// Self-registration creates ONLY the owner account.
//
// Hotel is NOT created here.
//
// After registration:
//   owner.hotelId = null
//   owner logs in
//   frontend checks hotelSetupCompleted
//   owner is sent to /hotel-setup
//   setupHotel() creates the hotel
//
// =====================================================

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    console.log("================================");
    console.log("SELF REGISTRATION REQUEST");
    console.log("================================");

    // -------------------------------------------------
    // CLEAN INPUT
    // -------------------------------------------------

    const cleanName = String(name || "").trim();

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    const cleanPhone = String(phone || "").trim();

    const cleanPassword = String(password || "");

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Owner name, email and password are required",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING USER
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
        cleanPassword,
        10
      );

    // -------------------------------------------------
    // CREATE OWNER ONLY
    // -------------------------------------------------

    const user = await User.create({
      name: cleanName,

      email: cleanEmail,

      password: hashedPassword,

      role: "owner",

      accountStatus: "active",

      subscriptionPlan: "trial",

      createdBy: "self",

      mustChangePassword: false,

      // VERY IMPORTANT:
      // No hotel exists yet.
      hotelId: null,
    });

    console.log(
      "SELF REGISTERED OWNER:",
      user._id.toString()
    );

    // -------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,

        // No hotel yet
        hotelId: null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Registration successful. Please complete your hotel setup.",

      token,

      // VERY IMPORTANT
      hotelSetupCompleted: false,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: cleanPhone,
        role: user.role,

        hotelId: null,

        accountStatus:
          user.accountStatus,

        subscriptionPlan:
          user.subscriptionPlan,

        createdBy:
          user.createdBy,

        hotel: null,
      },
    });

  } catch (err) {
    console.error("================================");
    console.error(
      "OWNER REGISTRATION ERROR:",
      err
    );
    console.error(
      "MESSAGE:",
      err.message
    );
    console.error("================================");

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Registration failed",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // -------------------------------------------------
    // CLEAN EMAIL
    // -------------------------------------------------

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // -------------------------------------------------
    // FIND USER + HOTEL
    // -------------------------------------------------

    const user =
      await User.findOne({
        email: cleanEmail,
      }).populate("hotelId");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // -------------------------------------------------
    // PASSWORD
    // -------------------------------------------------

    const match =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // -------------------------------------------------
    // ACCOUNT STATUS
    // -------------------------------------------------

    if (
      user.accountStatus ===
      "inactive"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // -------------------------------------------------
    // HOTEL STATUS
    // -------------------------------------------------
    //
    // Self-registered owner can have hotelId = null.
    //
    // Therefore:
    //
    // user.hotelId && ...
    //
    // is important.
    //
    // -------------------------------------------------

    if (
      user.role !== "superadmin" &&
      user.hotelId &&
      user.hotelId.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your hotel account is currently inactive. Please contact the administrator.",
      });
    }

    // -------------------------------------------------
    // HOTEL SETUP STATUS
    // -------------------------------------------------

    const hotelSetupCompleted =
      Boolean(
        user.hotelId &&
        user.hotelId.setupCompleted
      );

    // -------------------------------------------------
    // JWT
    // -------------------------------------------------

    const token = jwt.sign(
      {
        id: user._id,

        role: user.role,

        hotelId:
          user.hotelId?._id ||
          null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      token,

      mustChangePassword:
        user.mustChangePassword ||
        false,

      hotelSetupCompleted,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        accountStatus:
          user.accountStatus,

        subscriptionPlan:
          user.subscriptionPlan,

        createdBy:
          user.createdBy,

        hotelId:
          user.hotelId?._id ||
          null,

        hotel:
          user.hotelId ||
          null,
      },
    });

  } catch (err) {
    console.error(
      "LOGIN ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Login failed",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword = async (
  req,
  res
) => {
  try {
    const {
      oldPassword,
      newPassword,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findById(
        req.user.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // CHECK OLD PASSWORD
    // -------------------------------------------------

    const match =
      await bcrypt.compare(
        oldPassword,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        success: false,
        message:
          "Old password incorrect",
      });
    }

    // -------------------------------------------------
    // UPDATE PASSWORD
    // -------------------------------------------------

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    user.mustChangePassword = false;

    await user.save();

    // -------------------------------------------------
    // CHECK CURRENT HOTEL STATUS
    // -------------------------------------------------

    let hotelSetupCompleted = false;

    if (user.hotelId) {
      const hotel = await import(
        "../models/Hotel.js"
      ).then(
        (module) =>
          module.default.findById(
            user.hotelId
          )
      );

      hotelSetupCompleted =
        Boolean(
          hotel?.setupCompleted
        );
    }

    return res.status(200).json({
      success: true,

      message:
        "Password changed successfully",

      hotelSetupCompleted,
    });

  } catch (err) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Unable to change password",
    });
  }
};