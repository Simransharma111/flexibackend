import express from "express";

import { generateQRCodes,getQRMenu,toggleQRStatus,reassignQR} from "../controllers/qrController.js";
import auth from "../middlewares/auth.js";


const router = express.Router();

router.post("/generate", generateQRCodes);
router.get("/:qrId", getQRMenu);
router.put(
  "/toggle/:qrId",
  auth,
  toggleQRStatus
);

router.put(
  "/reassign",
  auth,
  reassignQR
);
// router.post("/assign", assignQR);
export default router;