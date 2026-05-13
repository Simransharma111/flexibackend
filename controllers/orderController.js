import mongoose from "mongoose";

import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import Table from "../models/Table.js";


// ===============================
// CREATE ORDER
// ===============================

export const createOrder = async (req, res) => {
  try {

    const {
      tableId,
      guestName,
      items,
    } = req.body;

    // VALIDATION

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: "Table ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // FIND TABLE

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

    // PROCESS ITEMS

    for (const item of items) {

      const menuItem = await Menu.findById(item.menuId);

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Dish not found",
        });
      }

      const quantity = Number(item.quantity);

      totalAmount += menuItem.price * quantity;

      estimatedTime += menuItem.prepTime;

      orderItems.push({
        menuId: menuItem._id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
      });
    }

    // CREATE ORDER

    const order = await Order.create({

      hotelId: table.hotelId,

      roomNumber: table.tableNumber,

      guestName: guestName || "Guest",

      items: orderItems,

      totalAmount,

      estimatedTime,

      status: "pending",
    });

    // SUCCESS RESPONSE

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

    const order = await Order.findById(id);

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