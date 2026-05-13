import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER (only for testing now)
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.json(user);
  } catch (err) {
  console.error("ERROR:", err);   // 🔥 MUST ADD
  res.status(500).json({
    message: err.message,
  });
}
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, role: user.role, hotelId: user.hotelId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({

  token,

  user: {

    id: user._id,

    role: user.role,

    name: user.name,

    email: user.email,

    hotelId: user.hotelId,

  },

});
  } catch (err) {
    res.status(500).json(err);
  }
};