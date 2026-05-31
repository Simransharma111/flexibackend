import express from "express";
import User from "../models/User.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// SAVE FCM TOKEN
router.post(
  "/save-token",
  auth,
  async (req, res) => {

    try {

      await User.findByIdAndUpdate(
        req.user.id,
        {
          fcmToken: req.body.token,
        }
      );

      res.json({
        success: true,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: "Failed to save token",
      });

    }

  }
);

export default router;