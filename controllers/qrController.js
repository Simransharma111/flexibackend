import QRCode from "qrcode";
import { nanoid } from "nanoid";

import QR from "../models/qrModel.js";
import Table from "../models/Table.js";
import Menu from "../models/Menu.js";
import Hotel from "../models/Hotel.js";

// =====================================================
// GENERATE QR CODES
// =====================================================

export const generateQRCodes = async (req, res) => {

  try {

    const count = Number(req.body.count);

    if (!count || count <= 0) {

      return res.status(400).json({
        success: false,
        message: "Valid QR count is required",
      });

    }

    const qrCodes = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const qrId = nanoid(8);

      const qrUrl =
        `${process.env.FRONTEND_URL}/qr/${qrId}`;

      const qrImage =
        await QRCode.toDataURL(qrUrl);

      await QR.create({
        qrId,
        isActive: true,
        assigned: false,
      });

      qrCodes.push({
        qrId,
        qrUrl,
        qrImage,
      });

    }

    return res.status(201).json({
      success: true,
      qrCodes,
    });

  } catch (error) {

    console.error(
      "GENERATE QR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// =====================================================
// GET MENU USING QR ID
// =====================================================

export const getQRMenu = async (req, res) => {
  try {
    const { qrId } = req.params;

    console.log("=================================");
    console.log("GUEST QR REQUEST");
    console.log("QR ID:", qrId);

    // =====================================================
    // FIND QR
    // =====================================================

    const qr = await QR.findOne({
      qrId: qrId?.trim(),
    });

    if (!qr) {
      console.log("QR NOT FOUND");

      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // =====================================================
    // CHECK QR STATUS
    // =====================================================

    if (qr.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This QR code is disabled",
      });
    }

    // =====================================================
    // FIND TABLE / ROOM
    // =====================================================
    // FIRST:
    // Use QR.tableId from the new structure.
    //
    // FALLBACK:
    // Use Table.qrId for old QR records.
    // =====================================================

    let table = null;

    // -----------------------------------------------------
    // NEW METHOD
    // -----------------------------------------------------

    if (qr.tableId) {
      table = await Table.findOne({
        _id: qr.tableId,
        hotelId: qr.hotelId,
      });
    }

    // -----------------------------------------------------
    // OLD QR COMPATIBILITY
    // -----------------------------------------------------

    if (!table) {
      table = await Table.findOne({
        qrId: qr.qrId,
      });
    }

    // -----------------------------------------------------
    // NO TABLE FOUND
    // -----------------------------------------------------

    if (!table) {
      return res.status(404).json({
        success: false,
        message:
          "This QR code is not assigned to any table or room",
      });
    }

    // =====================================================
    // REPAIR OLD QR DATA
    // =====================================================
    // If this QR came from the old Table.qrId relationship,
    // update the QR document with the current assignment.
    // =====================================================

    const needsRepair =
      !qr.assigned ||
      !qr.hotelId ||
      !qr.tableId ||
      !qr.tableNumber;

    if (needsRepair) {
      qr.assigned = true;
      qr.hotelId = table.hotelId;
      qr.tableId = table._id;
      qr.tableNumber = table.tableNumber;

      await qr.save();

      console.log(
        "OLD QR DATA REPAIRED:",
        qr.qrId
      );
    }

    // =====================================================
    // FIND HOTEL
    // =====================================================

    const hotel = await Hotel.findById(
      table.hotelId
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // =====================================================
    // FIND MENU
    // =====================================================

    const dishes = await Menu.find({
      hotelId: table.hotelId,

      $or: [
        {
          isAvailable: true,
        },
        {
          isAvailable: {
            $exists: false,
          },
        },
      ],
    }).sort({
      displayOrder: 1,
      featured: -1,
      todaySpecial: -1,
      isPopular: -1,
      isBestseller: -1,
      isRecommended: -1,
      isNewArrival: -1,
      createdAt: -1,
    });

    // =====================================================
    // LOG
    // =====================================================

    console.log(
      "HOTEL:",
      hotel.name
    );

    console.log(
      table.type === "room"
        ? "ROOM:"
        : "TABLE:",
      table.tableNumber
    );

    console.log(
      "DISHES:",
      dishes.length
    );

    console.log(
      "================================="
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      qrId,
      hotel,
      table,
      dishes,
    });

  } catch (err) {
    console.error(
      "GET QR MENU ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to load QR menu",
    });
  }
};


// =====================================================
// TOGGLE QR STATUS
// =====================================================

export const toggleQRStatus = async (
  req,
  res
) => {

  try {

    const { qrId } =
      req.params;

    const qr =
      await QR.findOne({
        qrId,
      });

    if (!qr) {

      return res.status(404).json({
        success: false,
        message: "QR not found",
      });

    }

    qr.isActive =
      !qr.isActive;

    await qr.save();

    return res.json({

      success: true,

      message:
        qr.isActive
          ? "QR Enabled"
          : "QR Disabled",

      qr,

    });

  } catch (err) {

    console.error(
      "TOGGLE QR ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  }

};
// =====================================================
// REMOVE QR ASSIGNMENT
// =====================================================

export const removeQRAssignment = async (req, res) => {
  try {
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: "tableId is required",
      });
    }

    // ----------------------------------------
    // FIND TABLE BELONGING TO CURRENT HOTEL
    // ----------------------------------------

    const table = await Table.findOne({
      _id: tableId,
      hotelId: req.user.hotelId,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table or room not found",
      });
    }

    // ----------------------------------------
    // IF NO QR ASSIGNED
    // ----------------------------------------

    if (!table.qrId) {
      return res.status(400).json({
        success: false,
        message: "No QR is assigned to this table",
      });
    }

    // ----------------------------------------
    // FIND QR
    // ----------------------------------------

    const qr = await QR.findOne({
      qrId: table.qrId,
    });

    // ----------------------------------------
    // REMOVE QR FROM TABLE
    // ----------------------------------------

    table.qrId = null;

    await table.save();

    // ----------------------------------------
    // RELEASE QR
    // ----------------------------------------

    if (qr) {
      qr.assigned = false;
      qr.hotelId = null;
      qr.tableId = null;
      qr.tableNumber = null;

      await qr.save();
    }

    return res.status(200).json({
      success: true,
      message: "QR assignment removed successfully",
    });

  } catch (err) {

    console.error(
      "REMOVE QR ASSIGNMENT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to remove QR assignment",
    });
  }
};