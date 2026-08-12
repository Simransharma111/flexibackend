import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addDish,
  getHotelMenu,
  updateDish,
  deleteDish,
  getMenuByTable,
  getFeaturedMenu,
} from "../controllers/menuController.js";

import auth from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import { authorizeRoles } from "../middlewares/role.js";

const router = express.Router();

/* =========================
   CATEGORIES
========================= */

router.post(
  "/category",
  auth,
  authorizeRoles("owner", "staff"),
  createCategory
);

router.get(
  "/categories/:hotelId",
  auth,
  authorizeRoles("owner", "staff"),
  getCategories
);

router.put(
  "/category/:id",
  auth,
  authorizeRoles("owner", "staff"),
  updateCategory
);

router.delete(
  "/category/:id",
  auth,
  authorizeRoles("owner", "staff"),
  deleteCategory
);

/* =========================
   DISHES
========================= */

router.post(
  "/dish",
  auth,
  authorizeRoles("owner", "staff"),
  upload.single("image"),
  addDish
);

/*
  OWNER MENU
  GET /api/menu/:hotelId
*/
router.get(
  "/:hotelId",
  auth,
  authorizeRoles("owner", "staff"),
  getHotelMenu
);

router.put(
  "/dish/:id",
  auth,
  authorizeRoles("owner", "staff"),
  upload.single("image"),
  updateDish
);

router.delete(
  "/dish/:id",
  auth,
  authorizeRoles("owner", "staff"),
  deleteDish
);

/* =========================
   QR MENU
========================= */

router.get(
  "/table/:tableId",
  getMenuByTable
);

/* =========================
   FEATURED
========================= */

router.get(
  "/featured/:hotelId",
  getFeaturedMenu
);

export default router;