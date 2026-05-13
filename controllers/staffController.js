import User from "../models/User.js";
import bcrypt from "bcryptjs";

// =========================
// CREATE STAFF
// =========================

export const createStaff = async (
  req,
  res
) => {

  try {

    const {
      name,
      email,
      password,
      position,
    } = req.body;

    // CHECK EXISTING

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Staff already exists",
      });
    }

    // HASH PASSWORD

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // CREATE STAFF

    const staff =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
        role: "staff",
        position,
        hotelId:
          req.user.hotelId,
      });

    res.status(201).json(staff);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};

// =========================
// GET ALL STAFF
// =========================

export const getAllStaff =
  async (req, res) => {

    try {

      const staff =
        await User.find({
          hotelId:
            req.user.hotelId,
          role: "staff",
        }).sort({
          createdAt: -1,
        });

      res.json(staff);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: err.message,
      });

    }
};

// =========================
// UPDATE STAFF
// =========================

export const updateStaff =
  async (req, res) => {

    try {

      const {
        name,
        email,
        position,
      } = req.body;

      const updatedStaff =
        await User.findByIdAndUpdate(
          req.params.id,
          {
            name,
            email,
            position,
          },
          {
            new: true,
          }
        );

      res.json(updatedStaff);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: err.message,
      });

    }
};

// =========================
// DELETE STAFF
// =========================

export const deleteStaff =
  async (req, res) => {

    try {

      await User.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Staff removed",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: err.message,
      });

    }
};