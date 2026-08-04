import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";
import upload from "../middlewares/upload.js"; 

import {
  setupHotel,
  getMyHotel,updateHotelProfile,
  updateHotelBranding,
} from "../controllers/hotelController.js";

const router = express.Router();

router.put(
  "/setup",

  auth,

  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  setupHotel
);
router.get(
  "/me",
  auth,
  getMyHotel
);
router.patch(
  "/profile",
  auth,
  updateHotelProfile
);

router.patch(
  "/branding",
  auth,
  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  updateHotelBranding
);
export default router;