import mongoose from "mongoose";

import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import Table from "../models/Table.js";
import admin from "../utils/firebase.js";
import User from "../models/User.js";
import { io } from "../server.js";

/* =========================================
   CREATE ORDER
========================================= */

export const createOrder = async (req, res) => {
  try {
    const {
      tableId,
      guestName,
      items,
      orderType,
      scheduledFor,
    } = req.body;

    // ---------------------------------------
    // VALIDATION
    // ---------------------------------------

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: "Table ID is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // ---------------------------------------
    // CHECK TABLE
    // ---------------------------------------

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // ---------------------------------------
    // SCHEDULE VALIDATION
    // ---------------------------------------

    let scheduledDate = null;

    if (orderType === "schedule") {
      if (!scheduledFor) {
        return res.status(400).json({
          success: false,
          message: "Please select a schedule time",
        });
      }

      scheduledDate = new Date(scheduledFor);

      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid schedule time",
        });
      }

      const minimumTime = new Date(
        Date.now() + 60 * 60 * 1000
      );

      if (scheduledDate < minimumTime) {
        return res.status(400).json({
          success: false,
          message:
            "Scheduled orders must be at least 1 hour in advance",
        });
      }
    }

    // ---------------------------------------
    // CALCULATE ORDER
    // ---------------------------------------

    let subtotal = 0;
    let estimatedTime = 0;

    const orderItems = [];

    for (const item of items) {
      if (!item.menuId) {
        continue;
      }

      const menuItem = await Menu.findById(item.menuId);

      if (!menuItem) {
        continue;
      }

      const quantity = Number(item.quantity);

      if (!quantity || quantity <= 0) {
        continue;
      }

      const itemTotal =
        Number(menuItem.price) * quantity;

      subtotal += itemTotal;

      estimatedTime +=
        Number(menuItem.prepTime || 10) * quantity;

      orderItems.push({
        menuId: menuItem._id,
        name: menuItem.name,
        quantity,
        price: Number(menuItem.price),
        total: itemTotal,
      });
    }

    // ---------------------------------------
    // MAKE SURE VALID ITEMS EXIST
    // ---------------------------------------

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items found in cart",
      });
    }

    // ---------------------------------------
    // BILLING
    // ---------------------------------------

    const gstAmount = subtotal * 0.05;

    const serviceCharge = subtotal * 0.02;

    // Currently keeping final amount as subtotal
    // as you were doing previously.
    const finalAmount = subtotal;

    // If later you want GST + service charge:
    //
    // const finalAmount =
    //   subtotal + gstAmount + serviceCharge;

    // ---------------------------------------
    // CREATE ORDER
    // ---------------------------------------

    const order = await Order.create({
      hotelId: table.hotelId,

      table: table._id,

      roomNumber:
        table.tableNumber ||
        table.number ||
        table.name ||
        "",

      locationNumber:
        table.tableNumber ||
        table.number ||
        table.name ||
        "",

      locationType: table.type || "table",

      guestName:
        guestName || "Guest",

      items: orderItems,

      subtotal,

      gstAmount,

      serviceCharge,

      discountAmount: 0,

      totalAmount: finalAmount,

      estimatedTime,

      status: "pending",

      // NOTE:
      // Your current Order schema does NOT have
      // orderType or scheduledFor fields.
      //
      // We will add those to the schema in the
      // NEXT step.
    });

    // ---------------------------------------
    // SOCKET.IO
    // ---------------------------------------

    io.emit("newOrder", order);

    // ---------------------------------------
    // PUSH NOTIFICATION
    // ---------------------------------------

    try {
      const hotelId =
        table.hotelId?.toString?.() ||
        table.hotelId;

      const users = await User.find({
        hotelId,
        role: {
          $in: ["owner", "staff"],
        },
        fcmToken: {
          $exists: true,
          $ne: "",
        },
      });

      const messages = users
        .filter((user) => user.fcmToken)
        .map((user) => ({
          token: user.fcmToken,

          notification: {
            title: "🍽️ New Order Received",
            body: `${guestName || "Guest"} placed an order`,
          },

          data: {
            orderId: order._id.toString(),
            hotelId: hotelId.toString(),
            type: "NEW_ORDER",
          },

          android: {
            priority: "high",

            notification: {
              sound: "default",
            },
          },
        }));

      if (messages.length > 0) {
        const results =
          await Promise.allSettled(
            messages.map((message) =>
              admin.messaging().send(message)
            )
          );

        results.forEach(
          (result, index) => {
            const user = users[index];

            if (result.status === "fulfilled") {
              console.log(
                "✅ FCM SENT:",
                user.email
              );
            } else {
              console.log(
                "❌ FCM FAILED:",
                user.email,
                result.reason?.message ||
                  result.reason
              );
            }
          }
        );
      }
    } catch (notificationError) {
      console.log(
        "❌ PUSH NOTIFICATION ERROR:",
        notificationError.message
      );
    }

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
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

export const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .populate("table")
      .populate("hotelId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
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
   GET TABLE ORDER HISTORY
========================================= */

export const getTableOrders = async (
  req,
  res
) => {
  try {
    const { tableId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        tableId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID",
      });
    }

    const orders = await Order.find({
      table: tableId,
    })
      .populate("table")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error(
      "TABLE ORDERS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch table orders",
    });
  }
};

/* =========================================
   OWNER ALL ORDERS
========================================= */

export const getOwnerOrders = async (
  req,
  res
) => {
  try {
    const orders = await Order.find({
      hotelId: req.user.hotelId,
    })
      .populate("table")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(orders);
  } catch (err) {
    console.error(
      "OWNER ORDERS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};