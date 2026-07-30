import express from "express";
import auth from "../middlewares/auth.js";

import {
  createOrder,
  trackOrder,
  getTableOrders,
  getOwnerOrders,
} from "../controllers/orderController.js";

const router = express.Router();

/* =========================================
   GUEST
========================================= */

// Place new order
router.post("/", createOrder);

// Get previous orders for a table
router.get("/table/:tableId", getTableOrders);

// Track one specific order
router.get("/:id", trackOrder);


/* =========================================
   OWNER / STAFF
========================================= */

// Get all hotel orders
router.get(
  "/",
  auth,
  getOwnerOrders
);

export default router;