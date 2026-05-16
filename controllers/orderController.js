import mongoose from "mongoose";

import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import Table from "../models/Table.js";

import { notifyKitchen } from "../utils/notifyKitchen.js";

/* =========================================
   CREATE ORDER
========================================= */

export const createOrder = async (
  req,
  res
) => {
  try {

    const {
      tableId,
      guestName,
      items,
    } = req.body;

    if (
      !tableId ||
      !items?.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const table =
      await Table.findById(
        tableId
      );

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

      const menuItem =
        await Menu.findById(
          item.menuId
        );

      if (!menuItem) continue;

      const quantity =
        Number(item.quantity);

      totalAmount +=
        menuItem.price *
        quantity;

      estimatedTime +=
        (menuItem.prepTime || 10) *
        quantity;

    orderItems.push({
  menuId: menuItem._id,
  name: menuItem.name,
  quantity,
  price: menuItem.price,
  total:
    menuItem.price * quantity,
});
    }

    const subtotal = totalAmount;

const gstAmount =
  subtotal * 0.05;

const serviceCharge =
  subtotal * 0.02;

const finalAmount =
  subtotal +
  gstAmount +
  serviceCharge;

const order =
  await Order.create({

        hotelId:
          table.hotelId,

        table:
          table._id,

        roomNumber:
          table.tableNumber,

          
        locationNumber: table.tableNumber,
        locationType: table.type,


        guestName:
          guestName || "Guest",

        items: orderItems,

       subtotal,
gstAmount,
serviceCharge,
totalAmount: finalAmount,

        estimatedTime,

        status: "pending",

      });

    // PUSH NOTIFICATION
    await notifyKitchen(
      table.hotelId,
      order
    );

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully",
      order,
    });

  } catch (err) {

    console.error(
      "CREATE ORDER ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  }
};

/* =========================================
   TRACK SINGLE ORDER
========================================= */

export const trackOrder = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    const order =
      await Order.findById(id)
        .populate("table");

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    return res.status(200).json(
      order
    );

  } catch (err) {

    console.error(
      "TRACK ORDER ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  }
};

/* =========================================
   OWNER ALL ORDERS
========================================= */

export const getOwnerOrders =
  async (req, res) => {

    try {

      const orders =
        await Order.find({

          hotelId:
            req.user.hotelId,

        })
          .populate("table")
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(
        orders
      );

    } catch (err) {

      console.error(
        "OWNER ORDERS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch orders",
      });

    }
  };