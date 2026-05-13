import express from "express";

import {
  createHotelWithOwner,
  getAllHotels,
  deleteHotel,
} from "../controllers/adminController.js";

import auth from "../middlewares/auth.js";

import { authorizeRoles } from "../middlewares/role.js";

const router = express.Router();


// ==========================
// CREATE HOTEL
// ==========================

router.post(
  "/create-hotel",
  auth,
  authorizeRoles("superadmin"),
  createHotelWithOwner
);


// ==========================
// GET ALL HOTELS
// ==========================

router.get(
  "/hotels",
  auth,
  authorizeRoles("superadmin"),
  getAllHotels
);


// ==========================
// DELETE HOTEL
// ==========================

router.delete(
  "/hotels/:id",
  auth,
  authorizeRoles("superadmin"),
  deleteHotel
);

export default router;