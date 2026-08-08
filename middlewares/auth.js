import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
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

    if (!decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Role missing in token",
      });
    }

    // hotelId can be null for self-registered owners
    req.user = {
      id: decoded.id,
      role: decoded.role,
      hotelId: decoded.hotelId || null,
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