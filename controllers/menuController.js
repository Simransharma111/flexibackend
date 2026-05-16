import Category from "../models/Category.js";
import Menu from "../models/Menu.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

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
      scheduledFor,
      foodType,

      isAvailable,
      isRecommended,
      isBestseller,

    } = req.body;

    let imageUrl = null;

    // IMAGE UPLOAD
    if (req.file) {

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "menu"
        );

      imageUrl = result.secure_url;
    }

    // FALLBACK IMAGE
    if (!imageUrl) {

      imageUrl =
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
    }

    const dish = await Menu.create({

      hotelId: req.user.hotelId,

      category,
      name,
      description,
      price,
      prepTime,
      foodType,

      scheduledFor,
      isScheduled: !!scheduledFor,

      image: imageUrl,

      // NEW FLAGS
      isAvailable:
        isAvailable === "true",

      isRecommended:
        isRecommended === "true",

      isBestseller:
        isBestseller === "true",

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
export const updateDish = async (req, res) => {
  try {

    const dish = await Menu.findById(
      req.params.id
    );

    if (!dish) {

      return res.status(404).json({
        message: "Dish not found",
      });
    }

    let updatedData = {
      ...req.body,

      // BOOLEAN FIX
      isAvailable:
        req.body.isAvailable === "true",

      isRecommended:
        req.body.isRecommended === "true",

      isBestseller:
        req.body.isBestseller === "true",
    };

    // IMAGE UPLOAD
    if (req.file) {

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "menu"
        );

      updatedData.image =
        result.secure_url;
    }

    const updatedDish =
      await Menu.findByIdAndUpdate(
        req.params.id,
        updatedData,
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