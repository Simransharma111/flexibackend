import Table from "../models/Table.js";
import QR from "../models/qrModel.js";

// ========================================
// CREATE TABLE / ROOM
// ========================================
export const createTable = async (req, res) => {
  try {
    const { tableNumber, type } = req.body;

    if (!req.user?.hotelId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a hotel",
      });
    }

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Table/Room number is required",
      });
    }

    if (!["table", "room"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be table or room",
      });
    }

    const cleanNumber = String(tableNumber).trim();

    const existingTable = await Table.findOne({
      hotelId: req.user.hotelId,
      tableNumber: cleanNumber,
      type,
    });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `${
          type === "room" ? "Room" : "Table"
        } ${cleanNumber} already exists`,
      });
    }

    const table = await Table.create({
      hotelId: req.user.hotelId,
      tableNumber: cleanNumber,
      type,
      qrId: null,
    });

    return res.status(201).json({
      success: true,
      message: `${
        type === "room" ? "Room" : "Table"
      } created successfully`,
      table,
    });

  } catch (err) {
    console.error("CREATE TABLE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ========================================
// GET ALL TABLES / ROOMS
// ========================================
export const getTables = async (req, res) => {
  try {

    if (!req.user?.hotelId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a hotel",
      });
    }

    const tables = await Table.find({
      hotelId: req.user.hotelId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      tables,
    });

  } catch (err) {

    console.error("GET TABLES ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};


// ========================================
// ASSIGN / REASSIGN QR
// ========================================
export const assignQRToTable = async (req, res) => {

  try {

    const { tableId, qrId } = req.body;

    if (!tableId || !qrId) {
      return res.status(400).json({
        success: false,
        message: "tableId and qrId are required",
      });
    }

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a hotel",
      });
    }

    // ----------------------------------------
    // FIND TABLE
    // ----------------------------------------

    const table = await Table.findOne({
      _id: tableId,
      hotelId,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table or room not found",
      });
    }

    // ----------------------------------------
    // FIND QR
    // ----------------------------------------

    const cleanQrId = qrId.trim();

    const qr = await QR.findOne({
      qrId: cleanQrId,
    });

    if (!qr) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // ----------------------------------------
    // QR BELONGS TO ANOTHER HOTEL
    // ----------------------------------------

    if (
      qr.hotelId &&
      qr.hotelId.toString() !== hotelId.toString()
    ) {

      return res.status(403).json({
        success: false,
        message: "This QR code belongs to another hotel",
      });

    }

    // ----------------------------------------
    // SAME QR ALREADY ASSIGNED TO THIS TABLE
    // ----------------------------------------

    if (
      qr.assigned &&
      qr.tableId &&
      qr.tableId.toString() === table._id.toString()
    ) {

      return res.status(200).json({
        success: true,
        message: "QR is already assigned to this table or room",
        table,
        qr,
      });

    }

    // ----------------------------------------
    // IF QR IS ASSIGNED SOMEWHERE ELSE
    // ----------------------------------------

    if (
      qr.assigned &&
      qr.tableId &&
      qr.tableId.toString() !== table._id.toString()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "This QR is already assigned to another table or room",
      });

    }

    // ----------------------------------------
    // RELEASE CURRENT QR FROM THIS TABLE
    // ----------------------------------------

    if (
      table.qrId &&
      table.qrId !== cleanQrId
    ) {

      const oldQR = await QR.findOne({
        qrId: table.qrId,
      });

      if (oldQR) {

        oldQR.assigned = false;

        // Keep QR itself alive.
        // It can be assigned again later.
        oldQR.hotelId = null;
        oldQR.tableId = null;
        oldQR.tableNumber = null;

        await oldQR.save();

      }

    }

    // ----------------------------------------
    // ASSIGN NEW QR TO TABLE
    // ----------------------------------------

    table.qrId = cleanQrId;

    await table.save();

    // ----------------------------------------
    // UPDATE QR
    // ----------------------------------------

    qr.assigned = true;
    qr.hotelId = hotelId;
    qr.tableId = table._id;
    qr.tableNumber = table.tableNumber;
    qr.isActive = true;

    await qr.save();

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message: "QR assigned successfully",
      table,
      qr,
    });

  } catch (err) {

    console.error("ASSIGN QR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to assign QR",
    });

  }

};