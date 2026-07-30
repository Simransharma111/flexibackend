import express from "express";

import {
  generateQRCodes,
  getQRMenu,
  toggleQRStatus,
  removeQRAssignment,
} from "../controllers/qrController.js";

import auth from "../middlewares/auth.js";

const router = express.Router();

// =====================================================
// GENERATE QR CODES
// =====================================================

router.post(
  "/generate",
  auth,
  generateQRCodes
);

// =====================================================
// PUBLIC - GUEST SCANS QR
// =====================================================

router.get(
  "/menu/:qrId",
  getQRMenu
);

// =====================================================
// PROTECTED - ENABLE / DISABLE QR
// =====================================================

router.put(
  "/toggle/:qrId",
  auth,
  toggleQRStatus
);

// =====================================================
// PROTECTED - REMOVE QR FROM TABLE
// =====================================================

router.put(
  "/remove-qr",
  auth,
  removeQRAssignment
);

export default router;