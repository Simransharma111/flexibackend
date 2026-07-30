import Table from "../models/Table.js";
import QR from "../models/qrModel.js";

// ========================================
// CREATE TABLE / ROOM
// ========================================
export const createTable = async (req, res) => {
  try {
    const { tableNumber, type } = req.body;

    // Check hotel
    if (!req.user?.hotelId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a hotel",
      });
    }

    // Check table number
    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Table/Room number is required",
      });
    }

    // Check type
    if (!["table", "room"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be table or room",
      });
    }

    // Prevent duplicate table/room
    const existingTable = await Table.findOne({
      hotelId: req.user.hotelId,
      tableNumber: String(tableNumber).trim(),
      type,
    });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `${type === "room" ? "Room" : "Table"} ${tableNumber} already exists`,
      });
    }

    const table = await Table.create({
      hotelId: req.user.hotelId,
      tableNumber: String(tableNumber).trim(),
      type,
    });

    return res.status(201).json({
      success: true,
      message: `${type === "room" ? "Room" : "Table"} created successfully`,
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
// ASSIGN QR
// ========================================
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
        message: "Table not found",
      });
    }

    // ----------------------------------------
    // FIND QR
    // ----------------------------------------
    const qr = await QR.findOne({
      qrId: qrId.trim(),
    });

    if (!qr) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // ----------------------------------------
    // PREVENT USING QR FROM ANOTHER HOTEL
    // ----------------------------------------
    if (
      qr.assigned &&
      qr.hotelId &&
      qr.hotelId.toString() !== req.user.hotelId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "This QR code belongs to another hotel",
      });
    }

    // ----------------------------------------
    // IF THIS TABLE ALREADY HAS ANOTHER QR
    // RELEASE OLD QR
    // ----------------------------------------
    if (
      table.qrId &&
      table.qrId !== qr.qrId
    ) {
      const oldQR = await QR.findOne({
        qrId: table.qrId,
      });

      if (oldQR) {
        oldQR.assigned = false;
        oldQR.hotelId = null;
        oldQR.tableId = null;
        oldQR.tableNumber = null;

        await oldQR.save();
      }
    }

    // ----------------------------------------
    // IF QR IS ALREADY ASSIGNED TO ANOTHER
    // TABLE IN SAME HOTEL
    // ----------------------------------------
    if (
      qr.assigned &&
      qr.tableId &&
      qr.tableId.toString() !== table._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "This QR is already assigned to another table or room",
      });
    }

    // ----------------------------------------
    // ASSIGN QR TO TABLE
    // ----------------------------------------

    table.qrId = qr.qrId;

    await table.save();

    // ----------------------------------------
    // UPDATE QR OWNERSHIP
    // ----------------------------------------

    qr.assigned = true;
    qr.hotelId = req.user.hotelId;
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
      message: err.message,
    });
  }
};