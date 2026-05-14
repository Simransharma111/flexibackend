import express from "express";

import { generateQRCodes,getQRMenu} from "../controllers/qrController.js";


const router = express.Router();

router.post("/generate", generateQRCodes);
router.get("/:qrId", getQRMenu);
// router.post("/assign", assignQR);
export default router;