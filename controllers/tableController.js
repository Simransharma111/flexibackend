import Table from "../models/Table.js";

// CREATE TABLE
export const createTable = async (req, res) => {

  try {

    const {
      tableNumber,
      type,
    } = req.body;

    const table = await Table.create({

      hotelId: req.user.hotelId,

      tableNumber,

      type,
    });

    res.status(201).json(table);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};

// GET ALL TABLES (optional)
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({
      hotelId: req.user.hotelId,
    });

    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const assignQRToTable = async (req, res) => {

  try {

    const {
      tableId,
      qrId,
    } = req.body;

    // FIND TABLE
    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    // ASSIGN QR
    table.qrId = qrId;

    await table.save();

    res.json({
      message: "QR assigned successfully",
      table,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};