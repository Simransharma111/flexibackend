import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // HOTEL
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // TABLE / ROOM
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
    },

    roomNumber: {
      type: String,
      required: true,
    },

    // GUEST
    guestName: {
      type: String,
      default: "Guest",
    },

    // ITEMS
    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },

        name: String,

        quantity: Number,

        price: Number,

        total: Number,
      },
    ],

    // BILLING
    subtotal: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    serviceCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    // PAYMENT
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
      ],
      default: "pending",
    },

    billGenerated: {
      type: Boolean,
      default: false,
    },

    // ESTIMATION
    estimatedTime: {
      type: Number,
      default: 20,
    },

    // STATUS
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

    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Order",
  orderSchema
);