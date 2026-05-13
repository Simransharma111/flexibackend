import express from "express";

import {
  createOrder,
  trackOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// guest routes
router.post("/", createOrder);

router.get("/:id", trackOrder);

export default router;