import express from "express";

import auth from "../middlewares/auth.js";

import {
  saveFCMToken,
} from "../controllers/notificationController.js";

const router =
  express.Router();

// SAVE FCM TOKEN

router.post(
  "/save-token",
  auth,
  saveFCMToken
);

export default router;