import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

import { createTableQR } from "../controllers/qrController.js";

const router = express.Router();

// owner creates QR
router.post(
  "/create",
  auth,
  authorizeRoles("owner"),
  createTableQR
);

export default router;