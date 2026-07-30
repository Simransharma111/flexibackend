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

  featured,
  todaySpecial,
  isPopular,
  isNewArrival,
  chefChoice,

  spiceLevel,
  rating,
  displayOrder,

  tags,
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

  isAvailable: isAvailable === "true",

  isRecommended: isRecommended === "true",

  isBestseller: isBestseller === "true",

  featured: featured === "true",

  todaySpecial: todaySpecial === "true",

  isPopular: isPopular === "true",

  isNewArrival: isNewArrival === "true",

  chefChoice: chefChoice === "true",

  spiceLevel: spiceLevel || "",

  rating: Number(rating || 0),

  displayOrder: Number(displayOrder || 0),

  tags: tags
    ? Array.isArray(tags)
      ? tags
      : tags.split(",").map(tag => tag.trim())
    : [],
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

    // VALIDATE HOTEL ID
    if (
      !mongoose.Types.ObjectId.isValid(
        hotelId
      )
    ) {
      return res.status(400).json({
        message: "Invalid Hotel ID",
      });
    }

    // GET ALL DISHES
    // FRONTEND WILL HANDLE UI
    const dishes = await Menu.find({
      hotelId,
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

    res.status(200).json(dishes);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message ||
        "Failed to fetch menu",
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

  isAvailable: req.body.isAvailable === "true",

  isRecommended: req.body.isRecommended === "true",

  isBestseller: req.body.isBestseller === "true",

  featured: req.body.featured === "true",

  todaySpecial: req.body.todaySpecial === "true",

  isPopular: req.body.isPopular === "true",

  isNewArrival: req.body.isNewArrival === "true",

  chefChoice: req.body.chefChoice === "true",

  spiceLevel: req.body.spiceLevel || "",

  rating: Number(req.body.rating || 0),

  displayOrder: Number(req.body.displayOrder || 0),

  tags: req.body.tags
    ? Array.isArray(req.body.tags)
      ? req.body.tags
      : req.body.tags.split(",").map(tag => tag.trim())
    : [],
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

    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: "Table information is missing",
      });
    }

    let table = null;

    // First try MongoDB Table _id
    if (mongoose.Types.ObjectId.isValid(tableId)) {
      table = await Table.findById(tableId);
    }

    // If not found, treat it as QR ID
    if (!table) {
      table = await Table.findOne({
        qrId: tableId,
      });
    }

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    // Get only available dishes
    const dishes = await Menu.find({
      hotelId: table.hotelId,
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } },
      ],
    }).sort({
      isBestseller: -1,
      isRecommended: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      table,
      dishes,
    });
  } catch (err) {
    console.error("GET MENU BY TABLE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load menu",
    });
  }
};
export const getFeaturedMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const dishes = await Menu.find({
      hotelId,
      isAvailable: true,
    });

    res.json({
      todaySpecial: dishes.filter(d => d.todaySpecial),
      recommended: dishes.filter(d => d.isRecommended),
      popular: dishes.filter(d => d.isPopular),
      bestSeller: dishes.filter(d => d.isBestseller),
      newArrival: dishes.filter(d => d.isNewArrival),
      featured: dishes.filter(d => d.featured),
      all: dishes,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};