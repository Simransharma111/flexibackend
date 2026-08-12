import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/menuCategoryController.js";

const router = express.Router();


// GET ALL CATEGORIES

router.get(
  "/",
  auth,
  authorizeRoles("owner", "staff"),
  getCategories
);


// GET CATEGORY BY ID

router.get(
  "/:id",
  auth,
  authorizeRoles("owner", "staff"),
  getCategoryById
);


// CREATE CATEGORY

router.post(
  "/",
  auth,
  authorizeRoles("owner"),
  createCategory
);


// UPDATE CATEGORY

router.put(
  "/:id",
  auth,
  authorizeRoles("owner"),
  updateCategory
);


// DELETE CATEGORY

router.delete(
  "/:id",
  auth,
  authorizeRoles("owner"),
  deleteCategory
);


export default router;