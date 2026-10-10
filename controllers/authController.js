import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/mail.js";

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
// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body?.email
      ?.trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email,
    });

    /*
     * Always return the same response whether the
     * account exists or not.
     *
     * This prevents people from discovering which
     * email addresses have accounts.
     */

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    /*
     * Only owner and staff should use this
     * password recovery flow.
     *
     * Super Admin recovery will be handled
     * separately.
     */

    if (
      user.role !== "owner" &&
      user.role !== "staff"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // =================================================
    // GENERATE SECURE RESET TOKEN
    // =================================================

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    /*
     * Store only the hash in MongoDB.
     *
     * The actual token is sent through email.
     */

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    /*
     * Reset link will remain valid for 15 minutes.
     */

    user.resetPasswordExpires =
      new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // =================================================
    // FRONTEND RESET URL
    // =================================================

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    // =================================================
    // EMAIL
    // =================================================

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER,

      to: user.email,

      subject:
        "FlexiOrder - Reset Your Password",

      text: `
Hello ${user.name || "there"},

We received a request to reset your FlexiOrder password.

Use the following link to create a new password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
FlexiOrder Team
      `.trim(),

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          color: #1f2937;
        ">

          <h2 style="margin-bottom: 10px;">
            Reset Your FlexiOrder Password
          </h2>

          <p>
            Hello ${user.name || "there"},
          </p>

          <p>
            We received a request to reset your FlexiOrder password.
          </p>

          <p style="margin: 30px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 22px;
                background: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This password reset link will expire in
            <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <hr style="
            margin: 30px 0;
            border: 0;
            border-top: 1px solid #e5e7eb;
          ">

          <p style="
            font-size: 12px;
            color: #6b7280;
          ">
            FlexiOrder
          </p>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    /*
     * Remove the reset token if email sending
     * failed so that a broken token isn't left
     * in the database.
     */

    try {
      const email = req.body?.email
        ?.trim()
        .toLowerCase();

      if (email) {
        await User.findOneAndUpdate(
          { email },
          {
            $unset: {
              resetPasswordToken: 1,
              resetPasswordExpires: 1,
            },
          }
        );
      }
    } catch (cleanupError) {
      console.error(
        "RESET TOKEN CLEANUP ERROR:",
        cleanupError
      );
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to send password reset email. Please try again later.",
    });
  }
};
// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const newPassword =
      req.body?.password;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    // =================================================
    // HASH TOKEN
    // =================================================

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findOne({
      resetPasswordToken: hashedToken,

      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired.",
      });
    }

    // =================================================
    // ONLY OWNER / STAFF
    // =================================================

    if (
      user.role !== "owner" &&
      user.role !== "staff"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Password reset is not available for this account.",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    // =================================================
    // INVALIDATE RESET TOKEN
    // =================================================

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    /*
     * If an old temporary-password mechanism
     * set this flag, reset it here.
     */

    user.mustChangePassword = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });

  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password. Please try again later.",
    });
  }
};