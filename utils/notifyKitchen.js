export const notifyKitchen = async (hotelId, order) => {
  const subs = await Subscription.find({ hotelId });

  const payload = JSON.stringify({
    title: "🔥 New Order Received",
    body: `Table ${order.roomNumber} placed an order`,
    url: "/kitchen",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        console.log("Push failed:", err.message);
      }
    })
  );
};