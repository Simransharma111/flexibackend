import express from "express";
import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";
import upload from "../middlewares/upload.js";
import { getHotelMenu } from "../controllers/menuController.js";
import {
  createCategory,
  addDish,getMenuByTable
} from "../controllers/menuController.js";
import {updateDish} from "../controllers/menuController.js";
import {deleteDish} from "../controllers/menuController.js";

const router = express.Router();

// owner only
router.post(
  "/category",
  auth,
  authorizeRoles("owner"),
  createCategory
);

router.post(
  "/dish",
  auth,
  authorizeRoles("owner"),
  upload.single("image"),
  addDish
);
router.get("/table/:tableId", getMenuByTable);

router.get("/:hotelId", getHotelMenu);
router.put(
  "/dish/:id",
  auth,
  authorizeRoles("owner"),
  upload.single("image"),
  updateDish
);

router.delete(
  "/dish/:id",
  auth,
  authorizeRoles("owner"),
  deleteDish
);
export default router;