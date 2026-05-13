import mongoose from "mongoose";
import Order from "../models/Order.js";
import { io } from "../server.js";

// GET HOTEL ORDERS

export const getHotelOrders = async (req, res) => {

  try {

    const orders = await Order.find({
      hotelId: req.user.hotelId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// UPDATE ORDER STATUS

export const updateOrderStatus = async (req, res) => {

  try {

    const { id } = req.params;

    const { status } = req.body;

    // VALIDATE ID

    if (!mongoose.Types.ObjectId.isValid(id)) {

      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });

    }

    // VALIDATE STATUS

   const allowedStatuses = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

    if (!allowedStatuses.includes(status)) {

      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });

    }

    // FIND ORDER

    const order = await Order.findById(id);

    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });

    }

    // SECURITY CHECK

    if (
      order.hotelId.toString() !==
      req.user.hotelId.toString()
    ) {

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });

    }

    // UPDATE STATUS

    order.status = status;

    await order.save();

    // REALTIME UPDATE

    io.to(order._id.toString()).emit(
      "orderUpdated",
      order
    );

    io.emit(
      "kitchenOrderUpdated",
      order
    );

    res.json({
      success: true,
      order,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};