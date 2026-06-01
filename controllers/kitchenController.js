import mongoose from "mongoose";
import Order from "../models/Order.js";
import { io } from "../server.js";

// GET HOTEL ORDERS

export const getHotelOrders = async (
  req,
  res
) => {

  try {

    if (!req.user?.hotelId) {
      return res.status(403).json({
        success: false,
        message: "Hotel access denied",
      });
    }

    const orders = await Order.find({

      hotelId: req.user.hotelId,

    }).sort({
      createdAt: -1,
    });

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

export const updateOrderStatus = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const { status } = req.body;

    // VALIDATE ORDER ID

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    // VALIDATE HOTEL ACCESS

    if (!req.user?.hotelId) {
      return res.status(403).json({
        success: false,
        message: "Hotel access denied",
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

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // SECURE QUERY
    // ONLY FETCH ORDER
    // BELONGING TO SAME HOTEL

    const order =
      await Order.findOne({

        _id: id,

        hotelId:
          req.user.hotelId,

      });

    if (!order) {

      return res.status(404).json({
        success: false,
        message:
          "Order not found or access denied",
      });

    }

    // UPDATE STATUS

    order.status = status;

    await order.save();

    // REALTIME UPDATE

    io.to(
      order._id.toString()
    ).emit(
      "orderUpdated",
      order
    );

    io.emit(
      "kitchenOrderUpdated",
      order
    );

    return res.json({
      success: true,
      order,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};