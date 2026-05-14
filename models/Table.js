import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },

    type: {
      type: String,
      enum: ["room", "table"],
      required: true,
    },

    tableNumber: {
      type: String,
      required: true,
    },

    qrId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);