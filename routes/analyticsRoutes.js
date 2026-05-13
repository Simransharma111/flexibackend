import express from "express";

import auth from "../middlewares/auth.js";

import { authorizeRoles }
from "../middlewares/role.js";

import { getAnalytics,exportTodayOrdersCSV }
from "../controllers/analyticsController.js";

const router = express.Router();

router.get(
  "/",
  auth,
  authorizeRoles(
    "owner",
    "superadmin"
  ),
  getAnalytics
);
router.get(
  "/today-csv",
  auth,
  authorizeRoles("owner"),
  exportTodayOrdersCSV
);
export default router;