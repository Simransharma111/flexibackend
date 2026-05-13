import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },

    roomNumber: String,

    guestName: String,

    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },

        name: String,

        quantity: Number,

        price: Number,
      },
    ],

    totalAmount: Number,

    estimatedTime: {
      type: Number,
      default: 20,
    },

 status: {
  type: String,
  enum: [
    "pending",
    "accepted",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ],
  default: "pending",
},
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);