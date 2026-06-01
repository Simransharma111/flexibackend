import User from "../models/User.js";
import admin from "../utils/firebase.js";

export const notifyKitchen =
  async (hotelId, order) => {

    try {

      const users =
        await User.find({
          hotelId,

          role: {
            $in: [
              "owner",
              "staff",
            ],
          },

          fcmToken: {
            $exists: true,
            $ne: "",
          },
        });

      const tokens =
        users.map(
          (u) => u.fcmToken
        );

      if (!tokens.length) {

        console.log(
          "No FCM tokens found"
        );

        return;

      }

      await admin
        .messaging()
        .sendEachForMulticast({

          tokens,

          notification: {

            title:
              "🔥 New Order",

            body:
              `${
                order.locationType === "room"
                  ? "Room"
                  : "Table"
              } ${
                order.locationNumber
              } placed an order`,
          },

          data: {

            orderId:
              order._id.toString(),

            hotelId:
              hotelId.toString(),

          },

        });

      console.log(
        "Notifications sent successfully"
      );

    } catch (err) {

      console.log(
        "FCM ERROR:",
        err
      );

    }

};