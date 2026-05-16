import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // HOTEL
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    // TABLE / ROOM REFERENCE
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
    },

    // KEEP THIS FOR BACKWARD COMPATIBILITY
    roomNumber: {
      type: String,
      required: true,
    },

    // NEW CLEAN FIELD
    locationNumber: {
      type: String,
    },

    // OPTIONAL
    locationType: {
      type: String,
      enum: ["table", "room"],
      default: "table",
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

    discountAmount: {
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
      enum: ["pending", "paid"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "card"],
      default: "cash",
    },

    billGenerated: {
      type: Boolean,
      default: false,
    },

    billNumber: {
      type: String,
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

    cancelledAt: Date,

    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Order",
  orderSchema
);