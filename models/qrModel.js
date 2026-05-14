import mongoose from "mongoose";

const qrSchema = new mongoose.Schema({

  qrId: {
    type: String,
    unique: true,
  },

  assigned: {
    type: Boolean,
    default: false,
  },

  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    default: null,
  },

  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    default: null,
  },

  tableNumber: {
    type: String,
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

});

export default mongoose.model("QR", qrSchema);