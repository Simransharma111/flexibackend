import express from "express";

import {
  createOrder,
  trackOrder,getOwnerOrders,
} from "../controllers/orderController.js";

const router = express.Router();

// guest routes
router.post("/", createOrder);

router.get("/:id", trackOrder);
router.get(
  "/",
  auth,
  getOwnerOrders
);

export default router;