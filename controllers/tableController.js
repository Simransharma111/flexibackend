import Table from "../models/Table.js";

// CREATE TABLE
export const createTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    const table = await Table.create({
      hotelId: req.user.hotelId,
      tableNumber,
    });

    res.status(201).json(table);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
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