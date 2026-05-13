import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

import {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";

const router = express.Router();

// CREATE STAFF
router.post(
  "/create",
  auth,
  authorizeRoles("owner"),
  createStaff
);

// GET ALL STAFF
router.get(
  "/",
  auth,
  authorizeRoles("owner"),
  getAllStaff
);

// UPDATE STAFF
router.put(
  "/:id",
  auth,
  authorizeRoles("owner"),
  updateStaff
);

// DELETE STAFF
router.delete(
  "/:id",
  auth,
  authorizeRoles("owner"),
  deleteStaff
);

export default router;