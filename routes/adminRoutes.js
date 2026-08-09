import express from "express";

import {
  createHotelWithOwner,
  getAllHotels,
  activateHotel,
  deactivateHotel,
  deleteHotel,resetUserPassword
} from "../controllers/adminController.js";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

const router = express.Router();

// =====================================================
// CREATE HOTEL
// =====================================================

router.post(
  "/create-hotel",
  auth,
  authorizeRoles("superadmin"),
  createHotelWithOwner
);

// =====================================================
// GET ALL HOTELS
// =====================================================

router.get(
  "/hotels",
  auth,
  authorizeRoles("superadmin"),
  getAllHotels
);

// =====================================================
// ACTIVATE HOTEL
// =====================================================

router.put(
  "/hotels/:id/activate",
  auth,
  authorizeRoles("superadmin"),
  activateHotel
);

// =====================================================
// DEACTIVATE HOTEL
// =====================================================

router.put(
  "/hotels/:id/deactivate",
  auth,
  authorizeRoles("superadmin"),
  deactivateHotel
);

// =====================================================
// DELETE HOTEL
// =====================================================

router.delete(
  "/hotels/:id",
  auth,
  authorizeRoles("superadmin"),
  deleteHotel
);
router.post(
  "/users/:id/reset-password",
  auth,
  authorizeRoles("superadmin"),
  resetUserPassword
);

export default router;