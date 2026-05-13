import QRCode from "qrcode";
import Table from "../models/Table.js";

// CREATE QR
export const createTableQR = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    // frontend URL
    const qrData = `${process.env.FRONTEND_URL}/menu/${req.user.hotelId}/${tableNumber}`;

    // generate QR image
    const qrCode = await QRCode.toDataURL(qrData);

    // save table
    const table = await Table.create({
      hotelId: req.user.hotelId,
      tableNumber,
      qrCode,
    });

    res.status(201).json(table);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};