import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(
      decoded.id
    ).populate("hotelId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

    if (user.accountStatus === "inactive") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // =====================================================
    // HOTEL STATUS
    // Superadmin does not need a hotel
    // =====================================================

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

    // =====================================================
    // REQUEST USER
    // =====================================================

    req.user = {
      id: user._id,
      role: user.role,
      hotelId: user.hotelId?._id || null,
      accountStatus: user.accountStatus,
    };

    next();

  } catch (err) {
    console.error(
      "AUTH ERROR:",
      err.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default auth;