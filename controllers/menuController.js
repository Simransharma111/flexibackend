import MenuCategory from "../models/MenuCategory.js";
import Menu from "../models/Menu.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// =====================================================
// CREATE CATEGORY
// =====================================================

export const createCategory = async (req, res) => {
  try {
    const {
      name,
      subCategories = []
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name required"
      });
    }

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID"
      });
    }

    const exists = await MenuCategory.findOne({
      hotelId,
      name: name.trim()
    });

    if (exists) {
      return res.status(400).json({
        message: "Category already exists"
      });
    }

    const cleanSubCategories = Array.isArray(subCategories)
      ? [...new Set(
          subCategories
            .map(item => String(item).trim())
            .filter(Boolean)
        )]
      : [];

    const category = await MenuCategory.create({
      hotelId,
      name: name.trim(),
      subCategories: cleanSubCategories
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// GET CATEGORIES
// =====================================================

export const getCategories = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID"
      });
    }

    const categories = await MenuCategory.find({
      hotelId,
      isActive: true
    }).sort({
      displayOrder: 1,
      createdAt: 1
    });

    res.json(categories);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// UPDATE CATEGORY
// =====================================================

export const updateCategory = async (req, res) => {
  try {
    const {
      name,
      subCategories = []
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name required"
      });
    }

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account"
      });
    }

    const category = await MenuCategory.findOne({
      _id: req.params.id,
      hotelId,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    const duplicate = await MenuCategory.findOne({
      _id: { $ne: category._id },
      hotelId,
      name: name.trim()
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Category already exists"
      });
    }

    const cleanSubCategories = Array.isArray(subCategories)
      ? [...new Set(
          subCategories
            .map(item => String(item).trim())
            .filter(Boolean)
        )]
      : [];

    category.name = name.trim();
    category.subCategories = cleanSubCategories;

    await category.save();

    res.json(category);
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// DELETE CATEGORY
// =====================================================

export const deleteCategory = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account"
      });
    }

    const category = await MenuCategory.findOneAndUpdate(
      {
        _id: req.params.id,
        hotelId
      },
      {
        isActive: false
      },
      {
        new: true
      }
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.json({
      message: "Category disabled",
      category
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// ADD DISH
// =====================================================

export const addDish = async (req, res) => {
  try {
    const {
      categoryId,
      subCategory,
      name,
      description,
      price,
      prepTime,
      foodType,
      featured,
      todaySpecial,
      isRecommended,
      isBestseller,
      isPopular,
      isNewArrival,
      chefChoice,
      spiceLevel,
      tags,
      scheduledFor
    } = req.body;

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account"
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        message: "Category is required"
      });
    }

    const category = await MenuCategory.findOne({
      _id: categoryId,
      hotelId,
      isActive: true
    });

    if (!category) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    // Validate subcategory against category
    const cleanSubCategory =
      typeof subCategory === "string"
        ? subCategory.trim()
        : "";

    if (
      cleanSubCategory &&
      category.subCategories.length > 0 &&
      !category.subCategories.includes(cleanSubCategory)
    ) {
      return res.status(400).json({
        message: "Invalid subcategory"
      });
    }

    // IMAGE
    let image = "";

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "menu"
      );

      image = result.secure_url;
    }

    const cleanTags = tags
      ? (
          Array.isArray(tags)
            ? tags
            : tags
                .split(",")
                .map(tag => tag.trim())
                .filter(Boolean)
        )
      : [];

    const dish = await Menu.create({
      hotelId,

      categoryId,

      subCategory: cleanSubCategory,

      name: name?.trim(),

      description: description || "",

      price: Number(price || 0),

      prepTime: Number(prepTime || 15),

      foodType: foodType || "veg",

      image,

      isAvailable:
        req.body.isAvailable === true ||
        req.body.isAvailable === "true",

      featured:
        featured === true ||
        featured === "true",

      todaySpecial:
        todaySpecial === true ||
        todaySpecial === "true",

      isRecommended:
        isRecommended === true ||
        isRecommended === "true",

      isBestseller:
        isBestseller === true ||
        isBestseller === "true",

      isPopular:
        isPopular === true ||
        isPopular === "true",

      isNewArrival:
        isNewArrival === true ||
        isNewArrival === "true",

      chefChoice:
        chefChoice === true ||
        chefChoice === "true",

      spiceLevel: spiceLevel || "",

      tags: cleanTags,

      isScheduled: !!scheduledFor,

      scheduledFor: scheduledFor || null
    });

    const populatedDish = await Menu.findById(
      dish._id
    ).populate({
      path: "categoryId",
      select: "name subCategories displayOrder isActive"
    });

    res.status(201).json(populatedDish);
  } catch (error) {
    console.error("ADD DISH ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// GET HOTEL MENU
// =====================================================

export const getHotelMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid Hotel ID"
      });
    }

    const dishes = await Menu.find({
      hotelId,
      isDeleted: false
    })
      .populate({
        path: "categoryId",
        select: "name subCategories displayOrder isActive"
      })
      .sort({
        displayOrder: 1,
        createdAt: -1
      });

    res.status(200).json(dishes);
  } catch (error) {
    console.error("GET MENU ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// UPDATE DISH
// =====================================================

export const updateDish = async (req, res) => {
  try {
    const dish = await Menu.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        message: "Dish not found"
      });
    }

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not assigned to this account"
      });
    }

    if (dish.hotelId.toString() !== hotelId.toString()) {
      return res.status(403).json({
        message: "You cannot update this dish"
      });
    }

    if (req.body.categoryId) {
      const category = await MenuCategory.findOne({
        _id: req.body.categoryId,
        hotelId,
        isActive: true
      });

      if (!category) {
        return res.status(400).json({
          message: "Invalid category"
        });
      }

      const subCategory =
        typeof req.body.subCategory === "string"
          ? req.body.subCategory.trim()
          : "";

      if (
        subCategory &&
        category.subCategories.length > 0 &&
        !category.subCategories.includes(subCategory)
      ) {
        return res.status(400).json({
          message: "Invalid subcategory"
        });
      }
    }

    const updateData = {
      name: req.body.name?.trim(),
      description: req.body.description || "",

      categoryId:
        req.body.categoryId || dish.categoryId,

      subCategory:
        typeof req.body.subCategory === "string"
          ? req.body.subCategory.trim()
          : dish.subCategory || "",

      price: Number(req.body.price || 0),

      prepTime: Number(
        req.body.prepTime || 15
      ),

      foodType:
        req.body.foodType || "veg",

      isAvailable:
        req.body.isAvailable === true ||
        req.body.isAvailable === "true",

      featured:
        req.body.featured === true ||
        req.body.featured === "true",

      todaySpecial:
        req.body.todaySpecial === true ||
        req.body.todaySpecial === "true",

      isRecommended:
        req.body.isRecommended === true ||
        req.body.isRecommended === "true",

      isBestseller:
        req.body.isBestseller === true ||
        req.body.isBestseller === "true",

      isPopular:
        req.body.isPopular === true ||
        req.body.isPopular === "true",

      isNewArrival:
        req.body.isNewArrival === true ||
        req.body.isNewArrival === "true",

      chefChoice:
        req.body.chefChoice === true ||
        req.body.chefChoice === "true",

      spiceLevel:
        req.body.spiceLevel || "",

      tags:
        req.body.tags
          ? (
              Array.isArray(req.body.tags)
                ? req.body.tags
                : req.body.tags
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(Boolean)
            )
          : []
    };

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "menu"
      );

      updateData.image = result.secure_url;
    }

    const updatedDish =
      await Menu.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).populate({
        path: "categoryId",
        select: "name subCategories displayOrder isActive"
      });

    res.json(updatedDish);
  } catch (error) {
    console.error("UPDATE DISH ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// DELETE DISH
// =====================================================

export const deleteDish = async (req, res) => {
  try {
    const hotelId = req.user?.hotelId;

    const dish =
      await Menu.findOneAndUpdate(
        {
          _id: req.params.id,
          hotelId
        },
        {
          isDeleted: true,
          isAvailable: false
        },
        {
          new: true
        }
      );

    if (!dish) {
      return res.status(404).json({
        message: "Dish not found"
      });
    }

    res.json({
      message: "Dish moved to deleted",
      dish
    });
  } catch (error) {
    console.error("DELETE DISH ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// GET MENU BY TABLE / QR
// =====================================================

export const getMenuByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    let table = null;

    // Try MongoDB _id
    if (
      mongoose.Types.ObjectId.isValid(tableId)
    ) {
      table = await Table.findById(tableId);
    }

    // Try QR ID
    if (!table) {
      table = await Table.findOne({
        qrId: tableId
      });
    }

    if (!table) {
      return res.status(404).json({
        message: "Table not found"
      });
    }

    const dishes = await Menu.find({
      hotelId: table.hotelId,
      isAvailable: true,
      isDeleted: false
    })
      .populate({
        path: "categoryId",
        select:
          "name subCategories displayOrder isActive"
      })
      .sort({
        displayOrder: 1,
        createdAt: -1
      });

    res.json({
      success: true,
      table,
      dishes
    });
  } catch (error) {
    console.error(
      "GET MENU BY TABLE ERROR:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// =====================================================
// GET FEATURED MENU
// =====================================================

export const getFeaturedMenu = async (
  req,
  res
) => {
  try {
    const dishes = await Menu.find({
      hotelId: req.params.hotelId,
      isAvailable: true,
      isDeleted: false
    })
      .populate({
        path: "categoryId",
        select:
          "name subCategories displayOrder isActive"
      });

    res.json({
      todaySpecial: dishes.filter(
        d => d.todaySpecial
      ),

      recommended: dishes.filter(
        d => d.isRecommended
      ),

      popular: dishes.filter(
        d => d.isPopular
      ),

      bestSeller: dishes.filter(
        d => d.isBestseller
      ),

      newArrival: dishes.filter(
        d => d.isNewArrival
      ),

      featured: dishes.filter(
        d => d.featured
      ),

      all: dishes
    });
  } catch (error) {
    console.error(
      "GET FEATURED MENU ERROR:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

