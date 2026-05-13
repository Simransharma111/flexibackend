import Order from "../models/Order.js";
import { Parser } from "json2csv";
export const getAnalytics =
  async (req, res) => {

    try {

      const hotelId =
        req.user.hotelId;

      // ALL ORDERS
      const orders =
        await Order.find({
          hotelId,
        });

      // TOTAL REVENUE
      const totalRevenue =
        orders.reduce(
          (acc, order) =>
            acc +
            order.totalAmount,
          0
        );

      // TOTAL ORDERS
      const totalOrders =
        orders.length;

      // PENDING
     const pendingOrders =
  orders.filter(
    (o) =>
      o.status !== "delivered"
  ).length;

      // COMPLETED
     const completedOrders =
  orders.filter(
    (o) =>
      o.status === "delivered"
  ).length;

      // AVG ORDER VALUE
      const avgOrderValue =
        totalOrders > 0
          ? Math.round(
              totalRevenue /
              totalOrders
            )
          : 0;

      // POPULAR DISHES
      const dishMap = {};

      orders.forEach((order) => {

        order.items.forEach(
          (item) => {

            if (
              dishMap[item.name]
            ) {

              dishMap[
                item.name
              ] += item.quantity;

            } else {

              dishMap[
                item.name
              ] = item.quantity;

            }
          }
        );
      });

      const popularDishes =
        Object.entries(
          dishMap
        )
          .map(
            ([name, qty]) => ({
              name,
              qty,
            })
          )
          .sort(
            (a, b) =>
              b.qty - a.qty
          )
          .slice(0, 5);

      res.json({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        avgOrderValue,
        popularDishes,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          err.message,
      });

    }
  };
  export const exportTodayOrdersCSV =
  async (req, res) => {

    try {

      const start = new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end = new Date();

      end.setHours(
        23,
        59,
        59,
        999
      );

      const orders =
        await Order.find({

          hotelId:
            req.user.hotelId,

          createdAt: {

            $gte: start,

            $lte: end,

          },

        });

      const formatted =
        orders.map((order) => ({

          OrderID:
            order._id,

          Guest:
            order.guestName,

          Table:
            order.roomNumber,

          Status:
            order.status,

          Total:
            order.totalAmount,

          Time:
            order.createdAt,

        }));

      const parser =
        new Parser();

      const csv =
        parser.parse(
          formatted
        );

      res.header(
        "Content-Type",
        "text/csv"
      );

      res.attachment(
        "today-orders.csv"
      );

      return res.send(csv);

    } catch (err) {

      console.error(err);

      res.status(500).json({

        success: false,

        message: err.message,

      });

    }

};