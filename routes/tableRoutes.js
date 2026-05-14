import express from "express";
import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";
import { createTable, getTables,assignQRToTable } from "../controllers/tableController.js";

const router = express.Router();

router.post(
  "/",
  auth,
  authorizeRoles("owner"),
  createTable
);

router.get(
  "/",
  auth,
  authorizeRoles("owner"),
  getTables
);
router.put(
  "/assign-qr",
  auth,
  authorizeRoles("owner"),
  assignQRToTable
);

export default router;