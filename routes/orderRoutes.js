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
   OWNER / STAFF
========================================= */

router.get("/", auth, getOwnerOrders);


/* =========================================
   GUEST
========================================= */

// Place new order
router.post("/", createOrder);

// Get all orders for this table
router.get("/table/:tableId", getTableOrders);

// Track one specific order
router.get("/:id", trackOrder);

export default router;