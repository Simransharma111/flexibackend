import express from "express";

import auth from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/role.js";

import {
  getHotelOrders,
  updateOrderStatus,
} from "../controllers/kitchenController.js";

const router = express.Router();

// owner + staff
router.get(
  "/orders",
  auth,
  authorizeRoles("owner", "staff"),
  getHotelOrders
);

router.put(
  "/orders/:id",
  auth,
  authorizeRoles("owner", "staff"),
  updateOrderStatus
);

export default router;