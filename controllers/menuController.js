import MenuCategory from "../models/MenuCategory.js";
import Menu from "../models/Menu.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
};

const cleanTags = (tags) => {
  if (!tags) return [];

  const values = Array.isArray(tags)
    ? tags
    : String(tags).split(",");

  return [
    ...new Set(
      values
        .map((tag) => String(tag).trim())
        .filter(Boolean)
    ),
  ];
};

const getHotelId = (req) => {
  const hotelId = req.user?.hotelId;

  if (!hotelId) {
    return null;
  }

  return String(hotelId);
};

const populateCategory = {
  path: "categoryId",
  select: "name subCategories displayOrder isActive",
};

/* =====================================================
   CREATE CATEGORY
===================================================== */

export const createCategory = async (req, res) => {
  try {
    const hotelId = getHotelId(req);

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Category name required",
      });
    }

    const subCategories = Array.isArray(
      req.body.subCategories
    )
      ? [
          ...new Set(
            req.body.subCategories
              .map((item) => String(item).trim())
              .filter(Boolean)
          ),
        ]
      : [];

    const existing = await MenuCategory.findOne({
      hotelId,
      name,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.subCategories = subCategories;

        await existing.save();

        return res.status(200).json(existing);
      }

      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category = await MenuCategory.create({
      hotelId,
      name,
      subCategories,
      description: req.body.description || "",
      displayOrder: Number(req.body.displayOrder || 0),
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   GET CATEGORIES
===================================================== */

export const getCategories = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const categories = await MenuCategory.find({
      hotelId,
      isActive: true,
    }).sort({
      displayOrder: 1,
      createdAt: 1,
    });

    return res.json(categories);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   UPDATE CATEGORY
===================================================== */

export const updateCategory = async (req, res) => {
  try {
    const hotelId = getHotelId(req);

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    const categoryId = req.params.id;

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Category name required",
      });
    }

    const category = await MenuCategory.findOne({
      _id: categoryId,
      hotelId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const duplicate = await MenuCategory.findOne({
      _id: { $ne: categoryId },
      hotelId,
      name,
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const subCategories = Array.isArray(
      req.body.subCategories
    )
      ? [
          ...new Set(
            req.body.subCategories
              .map((item) => String(item).trim())
              .filter(Boolean)
          ),
        ]
      : [];

    category.name = name;
    category.description = req.body.description || "";
    category.subCategories = subCategories;
    category.displayOrder = Number(
      req.body.displayOrder || 0
    );

    await category.save();

    return res.json(category);
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   DELETE CATEGORY
===================================================== */

export const deleteCategory = async (req, res) => {
  try {
    const hotelId = getHotelId(req);
    const categoryId = req.params.id;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const dishCount = await Menu.countDocuments({
      hotelId,
      categoryId,
      isDeleted: false,
    });

    if (dishCount > 0) {
      return res.status(400).json({
        message:
          "This category contains dishes. Move or delete the dishes first.",
      });
    }

    const category =
      await MenuCategory.findOneAndUpdate(
        {
          _id: categoryId,
          hotelId,
        },
        {
          isActive: false,
        },
        {
          new: true,
        }
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.json({
      message: "Category disabled",
      category,
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   ADD DISH
===================================================== */

export const addDish = async (req, res) => {
  try {
    const hotelId = getHotelId(req);

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const categoryId = String(
      req.body.categoryId || ""
    ).trim();

    console.log("ADD DISH:", {
      hotelId,
      categoryId,
      name: req.body.name,
    });

    if (!categoryId) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await MenuCategory.findOne({
      _id: categoryId,
      hotelId,
      isActive: true,
    });

    if (!category) {
      return res.status(400).json({
        message:
          "Invalid category. Please select an active category belonging to this hotel.",
      });
    }

    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Dish name is required",
      });
    }

    const price = Number(req.body.price);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        message: "Invalid dish price",
      });
    }

    const subCategory = String(
      req.body.subCategory || ""
    ).trim();

    if (
      subCategory &&
      category.subCategories.length > 0 &&
      !category.subCategories.includes(subCategory)
    ) {
      return res.status(400).json({
        message: "Invalid subcategory",
      });
    }

    let image = "";

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "menu"
      );

      image = result.secure_url;
    }

    const dish = await Menu.create({
      hotelId,

      categoryId,

      subCategory,

      name,

      description: String(
        req.body.description || ""
      ),

      price,

      prepTime:
        Number(req.body.prepTime) || 15,

      foodType:
        req.body.foodType === "nonveg"
          ? "nonveg"
          : "veg",

      image,

      isAvailable: toBoolean(
        req.body.isAvailable,
        true
      ),

      isRecommended: toBoolean(
        req.body.isRecommended
      ),

      isBestseller: toBoolean(
        req.body.isBestseller
      ),

      featured: toBoolean(
        req.body.featured
      ),

      todaySpecial: toBoolean(
        req.body.todaySpecial
      ),

      isPopular: toBoolean(
        req.body.isPopular
      ),

      isNewArrival: toBoolean(
        req.body.isNewArrival
      ),

      chefChoice: toBoolean(
        req.body.chefChoice
      ),

      spiceLevel:
        req.body.spiceLevel || "",

      tags: cleanTags(req.body.tags),

      gst:
        req.body.gst !== undefined &&
        req.body.gst !== ""
          ? Number(req.body.gst)
          : null,

      displayOrder:
        Number(req.body.displayOrder) || 0,

      isScheduled: Boolean(
        req.body.scheduledFor
      ),

      scheduledFor:
        req.body.scheduledFor || null,
    });

    const populatedDish =
      await Menu.findById(dish._id).populate(
        populateCategory
      );

    return res.status(201).json({
      success: true,
      dish: populatedDish,
    });
  } catch (error) {
    console.error("ADD DISH ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   GET HOTEL MENU
===================================================== */

export const getHotelMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const dishes = await Menu.find({
      hotelId,
      isDeleted: false,
    })
      .populate(populateCategory)
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    return res.json(dishes);
  } catch (error) {
    console.error("GET MENU ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   UPDATE DISH
===================================================== */

export const updateDish = async (req, res) => {
  try {
    const hotelId = getHotelId(req);
    const dishId = req.params.id;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    if (!isValidObjectId(dishId)) {
      return res.status(400).json({
        message: "Invalid dish ID",
      });
    }

    const dish = await Menu.findOne({
      _id: dishId,
      hotelId,
      isDeleted: false,
    });

    if (!dish) {
      return res.status(404).json({
        message: "Dish not found",
      });
    }

    const categoryId = String(
      req.body.categoryId ||
        dish.categoryId ||
        ""
    ).trim();

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await MenuCategory.findOne({
      _id: categoryId,
      hotelId,
      isActive: true,
    });

    if (!category) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    const updateData = {
      categoryId,
      subCategory:
        req.body.subCategory !== undefined
          ? String(req.body.subCategory).trim()
          : dish.subCategory,
    };

    if (
      updateData.subCategory &&
      category.subCategories.length > 0 &&
      !category.subCategories.includes(
        updateData.subCategory
      )
    ) {
      return res.status(400).json({
        message: "Invalid subcategory",
      });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (!name) {
        return res.status(400).json({
          message: "Dish name is required",
        });
      }

      updateData.name = name;
    }

    if (req.body.description !== undefined) {
      updateData.description =
        req.body.description;
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Invalid dish price",
        });
      }

      updateData.price = price;
    }

    if (req.body.prepTime !== undefined) {
      updateData.prepTime =
        Number(req.body.prepTime) || 15;
    }

    if (req.body.foodType !== undefined) {
      updateData.foodType =
        req.body.foodType === "nonveg"
          ? "nonveg"
          : "veg";
    }

    const booleanFields = [
      "isAvailable",
      "isRecommended",
      "isBestseller",
      "featured",
      "todaySpecial",
      "isPopular",
      "isNewArrival",
      "chefChoice",
    ];

    booleanFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = toBoolean(
          req.body[field]
        );
      }
    });

    if (req.body.spiceLevel !== undefined) {
      updateData.spiceLevel =
        req.body.spiceLevel || "";
    }

    if (req.body.tags !== undefined) {
      updateData.tags = cleanTags(
        req.body.tags
      );
    }

    if (req.body.gst !== undefined) {
      updateData.gst =
        req.body.gst === ""
          ? null
          : Number(req.body.gst);
    }

    if (req.body.displayOrder !== undefined) {
      updateData.displayOrder =
        Number(req.body.displayOrder) || 0;
    }

    if (req.body.scheduledFor !== undefined) {
      updateData.isScheduled =
        Boolean(req.body.scheduledFor);

      updateData.scheduledFor =
        req.body.scheduledFor || null;
    }

    if (req.file) {
      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "menu"
        );

      updateData.image =
        result.secure_url;
    }

    const updatedDish =
      await Menu.findOneAndUpdate(
        {
          _id: dishId,
          hotelId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(populateCategory);

    return res.json({
      success: true,
      dish: updatedDish,
    });
  } catch (error) {
    console.error("UPDATE DISH ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   DELETE DISH
===================================================== */

export const deleteDish = async (req, res) => {
  try {
    const hotelId = getHotelId(req);
    const dishId = req.params.id;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account",
      });
    }

    if (!isValidObjectId(dishId)) {
      return res.status(400).json({
        message: "Invalid dish ID",
      });
    }

    const dish =
      await Menu.findOneAndUpdate(
        {
          _id: dishId,
          hotelId,
          isDeleted: false,
        },
        {
          isDeleted: true,
          isAvailable: false,
        },
        {
          new: true,
        }
      );

    if (!dish) {
      return res.status(404).json({
        message: "Dish not found",
      });
    }

    return res.json({
      success: true,
      message: "Dish moved to deleted",
      dish,
    });
  } catch (error) {
    console.error("DELETE DISH ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   GET MENU BY TABLE / QR
===================================================== */

export const getMenuByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    let table = null;

    if (isValidObjectId(tableId)) {
      table = await Table.findById(tableId);
    }

    if (!table) {
      table = await Table.findOne({
        qrId: tableId,
      });
    }

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    const dishes = await Menu.find({
      hotelId: table.hotelId,
      isAvailable: true,
      isDeleted: false,
    })
      .populate(populateCategory)
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    return res.json({
      success: true,
      table,
      dishes,
    });
  } catch (error) {
    console.error(
      "GET MENU BY TABLE ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   GET FEATURED MENU
===================================================== */

export const getFeaturedMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const dishes = await Menu.find({
      hotelId,
      isAvailable: true,
      isDeleted: false,
    })
      .populate(populateCategory)
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    return res.json({
      todaySpecial: dishes.filter(
        (dish) => dish.todaySpecial
      ),

      recommended: dishes.filter(
        (dish) => dish.isRecommended
      ),

      popular: dishes.filter(
        (dish) => dish.isPopular
      ),

      bestSeller: dishes.filter(
        (dish) => dish.isBestseller
      ),

      newArrival: dishes.filter(
        (dish) => dish.isNewArrival
      ),

      featured: dishes.filter(
        (dish) => dish.featured
      ),

      all: dishes,
    });
  } catch (error) {
    console.error(
      "GET FEATURED MENU ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};