import webpush from "../config/push.js";
import Subscription from "../models/Subscription.js";

export const notifyKitchen = async (hotelId, order) => {
  const subs = await Subscription.find({ hotelId });

  const payload = JSON.stringify({
    title: "🔥 New Order Received",
    body: `Table ${order.tableNumber} placed an order`,
  });

  subs.forEach((sub) => {
    webpush.sendNotification(sub.subscription, payload);
  });
};