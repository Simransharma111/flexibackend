import Category from "../models/Category.js";
import Menu from "../models/Menu.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create({
      name: req.body.name,
      hotelId: req.user.hotelId,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// ADD DISH
export const addDish = async (req, res) => {

  try {

    const {
      name,
      description,
      price,
      prepTime,
      category,
    } = req.body;

    // CATEGORY BASED IMAGES

    // NORMALIZE CATEGORY

const normalizedCategory =
  category
    ?.replace(/\s/g, "")
    .toLowerCase();

// CATEGORY IMAGES

const categoryImages = {

  drinks:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e",

  pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591",

  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",

  dessert:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb",

  snacks:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836",

  breakfast:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8",

  maincourse:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",

  chinese:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d",

  southindian:
    "https://images.unsplash.com/photo-1630383249896-424e482df921",

};

    // DEFAULT IMAGE

    const imageUrl =
      categoryImages[category] ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";

    // CREATE DISH

    const dish = await Menu.create({

      hotelId: req.user.hotelId,

      category,

      name,

      description,

      price,

      prepTime,

      image: imageUrl,

    });

    res.status(201).json(dish);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    });

  }
};
export const getHotelMenu = async (req, res) => {
  try {

    const { hotelId } = req.params;

    // validate id
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid Hotel ID",
      });
    }

    const dishes = await Menu.find({
      hotelId,
      isAvailable: true,
    });

    res.json(dishes);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
// UPDATE DISH

export const updateDish =
  async (req, res) => {

    try {

      const updatedDish =
        await Menu.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

      res.json(updatedDish);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
};

// DELETE DISH

export const deleteDish =
  async (req, res) => {

    try {

      await Menu.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Dish deleted",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });

    }
};


export const getMenuByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    const dishes = await Menu.find({
  hotelId: table.hotelId,
  $or: [
    { isAvailable: true },
    { isAvailable: { $exists: false } }
  ]
});
res.status(200).json({
  success: true,
  table,
  dishes,
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};