import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// =====================================================
// REGISTER
// =====================================================

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner",
      accountStatus: "pending",
      subscriptionPlan: "trial",
      createdBy: "self",
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        hotelId: user.hotelId || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message:
        "Owner registration successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus:
          user.accountStatus,
        subscriptionPlan:
          user.subscriptionPlan,
        createdBy: user.createdBy,
      },
    });
  } catch (err) {
    console.error(
      "REGISTER ERROR:",
      err
    );

    res.status(500).json({
      message: err.message,
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

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).populate("hotelId");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    if (
      user.accountStatus === "inactive"
    ) {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    if (
      user.hotelId &&
      user.hotelId.isActive === false
    ) {
      return res.status(403).json({
        message:
          "This hotel account is currently inactive. Please contact the administrator.",
      });
    }

    // ==========================================
    // PASSWORD
    // ==========================================

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // JWT
    // ==========================================

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        hotelId:
          user.hotelId?._id || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,

      mustChangePassword:
        user.mustChangePassword,

      hotelSetupCompleted:
        user.hotelId?.setupCompleted ||
        false,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus:
          user.accountStatus,
        hotel: user.hotelId,
      },
    });
  } catch (err) {
    console.error(
      "LOGIN ERROR:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword =
  async (req, res) => {
    try {
      const {
        oldPassword,
        newPassword,
      } = req.body;

      if (
        !oldPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Old and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message:
            "New password must be at least 6 characters",
        });
      }

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const match =
        await bcrypt.compare(
          oldPassword,
          user.password
        );

      if (!match) {
        return res.status(400).json({
          message:
            "Old password incorrect",
        });
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.mustChangePassword =
        false;

      await user.save();

      res.json({
        message:
          "Password changed successfully",

        hotelSetupCompleted:
          user.hotelId?.setupCompleted ||
          false,
      });
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  };

// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword =
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      // Don't reveal whether email exists
      if (!user) {
        return res.json({
          message:
            "If an account exists with this email, a password reset link has been sent.",
        });
      }

      // ==========================================
      // GENERATE RESET TOKEN
      // ==========================================

      const resetToken =
        crypto.randomBytes(32).toString("hex");

      // Hash token before storing
      const hashedToken =
        crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

      user.resetPasswordToken =
        hashedToken;

      // 15 minute expiry
      user.resetPasswordExpires =
        new Date(
          Date.now() +
            15 * 60 * 1000
        );

      await user.save();

      // ==========================================
      // RESET URL
      // ==========================================

      const frontendUrl =
        process.env.FRONTEND_URL;

      if (!frontendUrl) {
        console.error(
          "FRONTEND_URL is missing"
        );

        return res.status(500).json({
          message:
            "Password reset is not configured correctly",
        });
      }

      const resetUrl =
        `${frontendUrl}/reset-password/${resetToken}`;

      // ==========================================
      // SEND EMAIL
      // ==========================================

      await transporter.sendMail({
        from:
          `"FlexiOrder" <${process.env.EMAIL_USER}>`,

        to: user.email,

        subject:
          "Reset Your FlexiOrder Password",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #f8fafc;
          ">

            <div style="
              background: white;
              padding: 30px;
              border-radius: 16px;
            ">

              <h2 style="
                color:#2563eb;
                margin-bottom:10px;
              ">
                FlexiOrder
              </h2>

              <h3>
                Password Reset Request
              </h3>

              <p>
                Hello ${user.name || "there"},
              </p>

              <p>
                We received a request to reset
                your FlexiOrder account password.
              </p>

              <p>
                Click the button below to create
                a new password.
              </p>

              <div style="
                margin:30px 0;
              ">

                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    background:#2563eb;
                    color:white;
                    text-decoration:none;
                    border-radius:10px;
                    font-weight:bold;
                  "
                >
                  Reset Password
                </a>

              </div>

              <p style="
                color:#64748b;
              ">
                This link will expire in
                <strong>15 minutes</strong>.
              </p>

              <p style="
                color:#64748b;
              ">
                If you did not request this
                password reset, you can safely
                ignore this email.
              </p>

              <hr style="
                margin:30px 0;
                border:none;
                border-top:1px solid #eee;
              " />

              <p style="
                color:#94a3b8;
                font-size:13px;
              ">
                FlexiOrder
              </p>

            </div>

          </div>
        `,
      });

      return res.json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to process password reset request",
      });
    }
  };

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword =
  async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token) {
        return res.status(400).json({
          message:
            "Reset token is required",
        });
      }

      if (!password) {
        return res.status(400).json({
          message:
            "New password is required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters",
        });
      }

      // ==========================================
      // HASH TOKEN
      // ==========================================

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      // ==========================================
      // FIND VALID USER
      // ==========================================

      const user =
        await User.findOne({
          resetPasswordToken:
            hashedToken,

          resetPasswordExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Password reset link is invalid or expired",
        });
      }

      // ==========================================
      // UPDATE PASSWORD
      // ==========================================

      user.password =
        await bcrypt.hash(
          password,
          10
        );

      // ==========================================
      // CLEAR RESET TOKEN
      // ==========================================

      user.resetPasswordToken =
        null;

      user.resetPasswordExpires =
        null;

      user.mustChangePassword =
        false;

      await user.save();

      return res.json({
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reset password",
      });
    }
  };
