import mongoose from "mongoose";

import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import Table from "../models/Table.js";
import { notifyKitchen } from "../utils/notifyKitchen.js";

// ===============================
// CREATE ORDER
// ===============================

export const createOrder = async (req, res) => {
  try {
    const { tableId, guestName, items } = req.body;

    if (!tableId || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    let totalAmount = 0;
    let estimatedTime = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuId);

      if (!menuItem) continue;

      const quantity = Number(item.quantity);

      totalAmount += menuItem.price * quantity;
      estimatedTime += menuItem.prepTime || 10;

      orderItems.push({
        menuId: menuItem._id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
      });
    }

    const order = await Order.create({
      hotelId: table.hotelId,
      roomNumber: table.tableNumber,
      guestName: guestName || "Guest",
      items: orderItems,
      totalAmount,
      estimatedTime,
      status: "pending",
    });

    // ✅ FIX: CALL PUSH BEFORE RESPONSE
    await notifyKitchen(table.hotelId, order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ===============================
// TRACK ORDER
// ===============================

export const trackOrder = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

   const orders = await Order.find({
  hotel: req.user.hotelId,
})
.populate("table")
.sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });

  } catch (err) {

    console.error("TRACK ORDER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};