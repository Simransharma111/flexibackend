import User from "../models/User.js";

export const saveFCMToken =
  async (req, res) => {

    try {

      const { token } =
        req.body;

      if (!token) {

        return res.status(400).json({
          message: "FCM token required",
        });

      }

      await User.findByIdAndUpdate(
        req.user.id,
        {
          fcmToken: token,
        }
      );

      res.json({
        success: true,
        message:
          "FCM token saved successfully",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message:
          "Failed to save FCM token",
      });

    }

};