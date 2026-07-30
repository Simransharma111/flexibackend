import express from "express";

import {
  generateQRCodes,
  getQRMenu,
  toggleQRStatus,
} from "../controllers/qrController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// PUBLIC
// =====================================================

// Guest scans QR
router.get(
  "/menu/:qrId",
  getQRMenu
);


// =====================================================
// PROTECTED
// =====================================================

// Generate QR
router.post(
  "/generate",
  authMiddleware,
  generateQRCodes
);

// Enable / Disable QR
router.patch(
  "/status/:qrId",
  authMiddleware,
  toggleQRStatus
);


export default router;
// import express from "express";

// import { generateQRCodes,getQRMenu,toggleQRStatus,reassignQR,removeQRAssignment} from "../controllers/qrController.js";
// import auth from "../middlewares/auth.js";


// const router = express.Router();

// router.post("/generate", generateQRCodes);
// router.get("/:qrId", getQRMenu);
// router.put(
//   "/toggle/:qrId",
//   auth,
//   toggleQRStatus
// );

// router.put(
//   "/reassign",
//   auth,
//   reassignQR
// );
// router.put("/remove-qr", removeQRAssignment);
// // router.post("/assign", assignQR);
// export default router;