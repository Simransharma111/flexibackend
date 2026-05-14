import Subscription from "../models/Subscription.js";

export const saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    await Subscription.create({
      hotelId: req.user.hotelId,
      subscription,
    });

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getVapidKey = (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
};