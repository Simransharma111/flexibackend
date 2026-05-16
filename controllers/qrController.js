import QRCode from "qrcode";
import { nanoid } from "nanoid";

import QR from "../models/qrModel.js";
import Table from "../models/Table.js";
import Menu from "../models/Menu.js";

export const generateQRCodes = async (req, res) => {
  try {
    const { count } = req.body;

    const qrCodes = [];

    for (let i = 0; i < count; i++) {
      const qrId = nanoid(8);

      const qrUrl = `${process.env.FRONTEND_URL}/qr/${qrId}`;

      const qrImage = await QRCode.toDataURL(qrUrl);

      await QR.create({
        qrId,
      });

      qrCodes.push({
        qrId,
        qrUrl,
        qrImage,
      });
    }

    res.json(qrCodes);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getQRMenu = async (req, res) => {
  try {
    const { qrId } = req.params;

    console.log("QR ID:", qrId);

    // FIND TABLE WITH HOTEL
    const table = await Table.findOne({ qrId }).populate("hotelId");

    console.log("TABLE:", table);

    if (!table) {
      return res.status(404).json({
        message: "QR not assigned",
      });
    }

    // EXTRACT HOTEL
    const hotel = table.hotelId;

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found for this QR",
      });
    }

    // GET MENU
    const dishes = await Menu.find({
      hotelId: hotel._id,
      isAvailable: { $ne: false },
    });

    console.log("DISHES:", dishes.length);

    return res.json({
      hotel,     // 🔥 THIS WAS MISSING (MAIN FIX)
      table,
      dishes,
    });

  } catch (err) {
    console.log("QR MENU ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};
// DISABLE QR
export const toggleQRStatus = async (req, res) => {
  try {

    const { qrId } = req.params;

    const qr = await QR.findOne({ qrId });

    if (!qr) {
      return res.status(404).json({
        message: "QR not found",
      });
    }

    qr.isActive = !qr.isActive;

    await qr.save();

    res.json({
      success: true,
      message: qr.isActive
        ? "QR Enabled"
        : "QR Disabled",
      qr,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });

  }
};
export const reassignQR = async (req, res) => {
  try {

    const {
      qrId,
      newTableId,
    } = req.body;

    const qr = await QR.findOne({ qrId });

    if (!qr) {
      return res.status(404).json({
        message: "QR not found",
      });
    }

    const table = await Table.findById(
      newTableId
    );

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    // REMOVE OLD TABLE QR
    await Table.findByIdAndUpdate(
      qr.tableId,
      {
        qrId: null,
      }
    );

    // UPDATE QR
    qr.tableId = table._id;

    qr.tableNumber =
      table.tableNumber;

    qr.hotelId = table.hotelId;

    await qr.save();

    // UPDATE NEW TABLE
    table.qrId = qr.qrId;

    await table.save();

    res.json({
      success: true,
      message: "QR reassigned",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });

  }
};
export const removeQRAssignment = async (req, res) => {
  try {
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: "tableId is required",
      });
    }

    // find table
    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    const oldQrId = table.qrId;

    // 1. remove from TABLE
    table.qrId = null;
    await table.save();

    // 2. free QR in QR collection (IMPORTANT)
    if (oldQrId) {
      await QR.findOneAndUpdate(
        { qrId: oldQrId },
        {
          assigned: false,
          tableId: null,
          tableNumber: null,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "QR assignment removed successfully",
    });

  } catch (err) {
    console.error("REMOVE QR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};