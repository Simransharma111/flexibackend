import Subscription from "../models/Subscription.js";
import { io } from "../server.js"; // ADD THIS

export const notifyKitchen = async (hotelId, order) => {
  try {
    const users = await User.find({
      hotelId,
      role: { $in: ["owner", "staff"] },
      fcmToken: { $exists: true, $ne: "" },
    });

    const tokens = users.map(u => u.fcmToken);

    if (!tokens.length) return;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "🔥 New Order",
        body: `Table ${order.roomNumber} placed an order`,
      },
      data: {
        orderId: order._id.toString(),
        hotelId: hotelId.toString(),
      },
    });

  } catch (err) {
    console.log("FCM ERROR:", err.message);
  }
};