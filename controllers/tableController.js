import Table from "../models/Table.js";

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
export const assignQRToTable = async (req, res) => {
  try {
    const { tableId, qrId } = req.body;

    if (!tableId || !qrId) {
      return res.status(400).json({
        success: false,
        message: "tableId and qrId are required",
      });
    }

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

    table.qrId = qrId;

    await table.save();

    return res.status(200).json({
      success: true,
      message: "QR assigned successfully",
      table,
    });
  } catch (err) {
    console.error("ASSIGN QR ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};