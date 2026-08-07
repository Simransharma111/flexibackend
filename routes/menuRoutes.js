import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

import upload from "../middlewares/upload.js";

import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,

  addDish,
  updateDish,
  deleteDish,

  getHotelMenu,
  getMenuByTable,
  getFeaturedMenu

} from "../controllers/menuController.js";


const router = express.Router();



// =================================
// CATEGORY ROUTES
// =================================


// create category
router.post(
  "/category",
  auth,
  authorizeRoles("owner"),
  createCategory
);


// get categories
router.get(
  "/category/:hotelId",
  auth,
  getCategories
);


// update category
router.put(
  "/category/:id",
  auth,
  authorizeRoles("owner"),
  updateCategory
);


// disable category
router.delete(
  "/category/:id",
  auth,
  authorizeRoles("owner"),
  deleteCategory
);




// =================================
// DISH ROUTES
// =================================


// add dish
router.post(
  "/dish",
  auth,
  authorizeRoles("owner"),
  upload.single("image"),
  addDish
);



// update dish
router.put(
  "/dish/:id",
  auth,
  authorizeRoles("owner"),
  upload.single("image"),
  updateDish
);



// delete dish
router.delete(
  "/dish/:id",
  auth,
  authorizeRoles("owner"),
  deleteDish
);




// =================================
// PUBLIC MENU
// =================================


// QR menu
router.get(
  "/table/:tableId",
  getMenuByTable
);



// owner menu list
router.get(
  "/:hotelId",
  getHotelMenu
);



// featured menu
router.get(
  "/featured/:hotelId",
  getFeaturedMenu
);



export default router;