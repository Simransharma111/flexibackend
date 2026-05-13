import express from "express";

import Hotel from "../models/Hotel.js";
import Table from "../models/Table.js";

const router = express.Router();


// ==========================
// GET ALL HOTELS (PUBLIC)
// ==========================

router.get("/hotels", async (req, res) => {

  try {

    const hotels = await Hotel.find()
      .select("name");

    res.json(hotels);

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch hotels",
    });

  }

});


// ==========================
// GET TABLES BY HOTEL
// ==========================

router.get(
  "/tables/:hotelId",
  async (req, res) => {

    try {

      const tables = await Table.find({
        hotelId: req.params.hotelId,
      });

      res.json(tables);

    } catch (err) {

      res.status(500).json({
        message: "Failed to fetch tables",
      });

    }

  }
);

export default router;