import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },

    tableNumber: {
      type: String,
      required: true,
    },

    qrCode: String,
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);