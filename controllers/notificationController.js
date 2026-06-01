// controllers/notificationController.js

import User from "../models/User.js";

export const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      fcmToken: token,
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};