import MenuCategory from "../models/MenuCategory.js";
import Menu from "../models/Menu.js";
import mongoose from "mongoose";
import Table from "../models/Table.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

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

  if (Array.isArray(tags)) {
    return [
      ...new Set(
        tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      ),
    ];
  }

  return [
    ...new Set(
      String(tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
};

const validateHotelId = (hotelId) => {
  return (
    hotelId &&
    mongoose.Types.ObjectId.isValid(hotelId)
  );
};

// =====================================================
// CREATE CATEGORY
// =====================================================

export const createCategory = async (req, res) => {
  try {
    const {
      name,
      subCategories = [],
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name required",
      });
    }

    const hotelId = req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    if (!validateHotelId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const cleanName = name.trim();

    const exists =
      await MenuCategory.findOne({
        hotelId,
        name: cleanName,
        isActive: true,
      });

    if (exists) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const cleanSubCategories =
      Array.isArray(subCategories)
        ? [
            ...new Set(
              subCategories
                .map((item) =>
                  String(item).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    const category =
      await MenuCategory.create({
        hotelId,
        name: cleanName,
        subCategories:
          cleanSubCategories,
      });

    return res.status(201).json(
      category
    );
  } catch (error) {
    console.error(
      "CREATE CATEGORY ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET CATEGORIES
// =====================================================

export const getCategories = async (
  req,
  res
) => {
  try {
    const { hotelId } =
      req.params;

    if (!validateHotelId(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotel ID",
      });
    }

    const categories =
      await MenuCategory.find({
        hotelId,
        isActive: true,
      }).sort({
        displayOrder: 1,
        createdAt: 1,
      });

    return res.json(
      categories
    );
  } catch (error) {
    console.error(
      "GET CATEGORIES ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE CATEGORY
// =====================================================

export const updateCategory = async (
  req,
  res
) => {
  try {
    const {
      name,
      subCategories = [],
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Category name required",
      });
    }

    const hotelId =
      req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid category ID",
      });
    }

    const category =
      await MenuCategory.findOne({
        _id: req.params.id,
        hotelId,
        isActive: true,
      });

    if (!category) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    const cleanName =
      name.trim();

    const duplicate =
      await MenuCategory.findOne({
        _id: {
          $ne: category._id,
        },
        hotelId,
        name: cleanName,
        isActive: true,
      });

    if (duplicate) {
      return res.status(400).json({
        message:
          "Category already exists",
      });
    }

    const cleanSubCategories =
      Array.isArray(
        subCategories
      )
        ? [
            ...new Set(
              subCategories
                .map((item) =>
                  String(item).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    category.name =
      cleanName;

    category.subCategories =
      cleanSubCategories;

    await category.save();

    return res.json(
      category
    );
  } catch (error) {
    console.error(
      "UPDATE CATEGORY ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// DELETE CATEGORY
// =====================================================

export const deleteCategory = async (
  req,
  res
) => {
  try {
    const hotelId =
      req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid category ID",
      });
    }

    /*
     * Don't allow deletion of a category
     * that still has dishes.
     */
    const dishes =
      await Menu.countDocuments({
        categoryId:
          req.params.id,
        hotelId,
        isDeleted: false,
      });

    if (dishes > 0) {
      return res.status(400).json({
        message:
          "This category contains dishes. Move or delete the dishes first.",
      });
    }

    const category =
      await MenuCategory.findOneAndUpdate(
        {
          _id: req.params.id,
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
        message:
          "Category not found",
      });
    }

    return res.json({
      message:
        "Category disabled",
      category,
    });
  } catch (error) {
    console.error(
      "DELETE CATEGORY ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// ADD DISH
// =====================================================

export const addDish = async (
  req,
  res
) => {
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
      scheduledFor,
      displayOrder,
      gst,
    } = req.body;

    const hotelId =
      req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    if (!validateHotelId(hotelId)) {
      return res.status(400).json({
        message:
          "Invalid hotel ID",
      });
    }

    /*
     * IMPORTANT:
     * categoryId is mandatory.
     */
    if (!categoryId) {
      return res.status(400).json({
        message:
          "Category is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        categoryId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid category ID",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Dish name is required",
      });
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid dish price",
      });
    }

    const category =
      await MenuCategory.findOne({
        _id: categoryId,
        hotelId,
        isActive: true,
      });

    if (!category) {
      return res.status(400).json({
        message:
          "Invalid category",
      });
    }

    const cleanSubCategory =
      typeof subCategory ===
      "string"
        ? subCategory.trim()
        : "";

    if (
      cleanSubCategory &&
      category.subCategories
        .length > 0 &&
      !category.subCategories.includes(
        cleanSubCategory
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid subcategory",
      });
    }

    let image = "";

    if (req.file) {
      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "menu"
        );

      image =
        result.secure_url;
    }

    const dish =
      await Menu.create({
        hotelId,

        categoryId,

        subCategory:
          cleanSubCategory,

        name:
          name.trim(),

        description:
          description || "",

        price:
          numericPrice,

        prepTime:
          Number(prepTime) || 15,

        foodType:
          foodType || "veg",

        image,

        isAvailable:
          req.body.isAvailable ===
            undefined
            ? true
            : toBoolean(
                req.body.isAvailable,
                true
              ),

        featured:
          toBoolean(
            featured
          ),

        todaySpecial:
          toBoolean(
            todaySpecial
          ),

        isRecommended:
          toBoolean(
            isRecommended
          ),

        isBestseller:
          toBoolean(
            isBestseller
          ),

        isPopular:
          toBoolean(
            isPopular
          ),

        isNewArrival:
          toBoolean(
            isNewArrival
          ),

        chefChoice:
          toBoolean(
            chefChoice
          ),

        spiceLevel:
          spiceLevel || "",

        tags:
          cleanTags(tags),

        gst:
          gst !== undefined &&
          gst !== ""
            ? Number(gst)
            : null,

        displayOrder:
          Number(
            displayOrder || 0
          ),

        isScheduled:
          Boolean(
            scheduledFor
          ),

        scheduledFor:
          scheduledFor ||
          null,
      });

    const populatedDish =
      await Menu.findById(
        dish._id
      ).populate({
        path: "categoryId",
        select:
          "name subCategories displayOrder isActive",
      });

    return res
      .status(201)
      .json(
        populatedDish
      );
  } catch (error) {
    console.error(
      "ADD DISH ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET HOTEL MENU
// =====================================================

export const getHotelMenu = async (
  req,
  res
) => {
  try {
    const { hotelId } =
      req.params;

    if (
      !validateHotelId(
        hotelId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid Hotel ID",
      });
    }

    const dishes =
      await Menu.find({
        hotelId,
        isDeleted: false,
      })
        .populate({
          path: "categoryId",
          select:
            "name subCategories displayOrder isActive",
        })
        .sort({
          displayOrder: 1,
          createdAt: -1,
        });

    return res
      .status(200)
      .json(dishes);
  } catch (error) {
    console.error(
      "GET MENU ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE DISH
// =====================================================

export const updateDish = async (
  req,
  res
) => {
  try {
    const hotelId =
      req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid dish ID",
      });
    }

    const dish =
      await Menu.findById(
        req.params.id
      );

    if (!dish) {
      return res.status(404).json({
        message:
          "Dish not found",
      });
    }

    if (
      dish.hotelId.toString() !==
      hotelId.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot update this dish",
      });
    }

    let categoryId =
      req.body.categoryId ||
      dish.categoryId;

    if (
      !mongoose.Types.ObjectId.isValid(
        categoryId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid category ID",
      });
    }

    const category =
      await MenuCategory.findOne({
        _id: categoryId,
        hotelId,
        isActive: true,
      });

    if (!category) {
      return res.status(400).json({
        message:
          "Invalid category",
      });
    }

    const cleanSubCategory =
      typeof req.body.subCategory ===
      "string"
        ? req.body.subCategory.trim()
        : dish.subCategory ||
          "";

    if (
      cleanSubCategory &&
      category.subCategories
        .length > 0 &&
      !category.subCategories.includes(
        cleanSubCategory
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid subcategory",
      });
    }

    const updateData = {};

    if (
      req.body.name !==
      undefined
    ) {
      updateData.name =
        req.body.name.trim();
    }

    if (
      req.body.description !==
      undefined
    ) {
      updateData.description =
        req.body.description;
    }

    updateData.categoryId =
      categoryId;

    updateData.subCategory =
      cleanSubCategory;

    if (
      req.body.price !==
      undefined
    ) {
      updateData.price =
        Number(
          req.body.price
        );
    }

    if (
      req.body.prepTime !==
      undefined
    ) {
      updateData.prepTime =
        Number(
          req.body.prepTime
        ) || 15;
    }

    if (
      req.body.foodType !==
      undefined
    ) {
      updateData.foodType =
        req.body.foodType ||
        "veg";
    }

    const booleanFields = [
      "isAvailable",
      "featured",
      "todaySpecial",
      "isRecommended",
      "isBestseller",
      "isPopular",
      "isNewArrival",
      "chefChoice",
    ];

    booleanFields.forEach(
      (field) => {
        if (
          req.body[field] !==
          undefined
        ) {
          updateData[field] =
            toBoolean(
              req.body[field]
            );
        }
      }
    );

    if (
      req.body.spiceLevel !==
      undefined
    ) {
      updateData.spiceLevel =
        req.body.spiceLevel ||
        "";
    }

    if (
      req.body.tags !==
      undefined
    ) {
      updateData.tags =
        cleanTags(
          req.body.tags
        );
    }

    if (
      req.body.displayOrder !==
      undefined
    ) {
      updateData.displayOrder =
        Number(
          req.body.displayOrder ||
            0
        );
    }

    if (
      req.body.scheduledFor !==
      undefined
    ) {
      updateData.isScheduled =
        Boolean(
          req.body.scheduledFor
        );

      updateData.scheduledFor =
        req.body.scheduledFor ||
        null;
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
          _id: req.params.id,
          hotelId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate({
        path: "categoryId",
        select:
          "name subCategories displayOrder isActive",
      });

    return res.json(
      updatedDish
    );
  } catch (error) {
    console.error(
      "UPDATE DISH ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// DELETE DISH
// =====================================================

export const deleteDish = async (
  req,
  res
) => {
  try {
    const hotelId =
      req.user?.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message:
          "Hotel not assigned to this account",
      });
    }

    const dish =
      await Menu.findOneAndUpdate(
        {
          _id: req.params.id,
          hotelId,
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
        message:
          "Dish not found",
      });
    }

    return res.json({
      message:
        "Dish moved to deleted",
      dish,
    });
  } catch (error) {
    console.error(
      "DELETE DISH ERROR:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET MENU BY TABLE / QR
// =====================================================

export const getMenuByTable = async (
  req,
  res
) => {
  try {
    const { tableId } =
      req.params;

    let table = null;

    if (
      mongoose.Types.ObjectId.isValid(
        tableId
      )
    ) {
      table =
        await Table.findById(
          tableId
        );
    }

    if (!table) {
      table =
        await Table.findOne({
          qrId: tableId,
        });
    }

    if (!table) {
      return res.status(404).json({
        message:
          "Table not found",
      });
    }

    const dishes =
      await Menu.find({
        hotelId:
          table.hotelId,
        isAvailable: true,
        isDeleted: false,
      })
        .populate({
          path: "categoryId",
          select:
            "name subCategories displayOrder isActive",
        })
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

// =====================================================
// GET FEATURED MENU
// =====================================================

export const getFeaturedMenu = async (
  req,
  res
) => {
  try {
    const {
      hotelId,
    } = req.params;

    if (
      !validateHotelId(
        hotelId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid hotel ID",
      });
    }

    const dishes =
      await Menu.find({
        hotelId,
        isAvailable: true,
        isDeleted: false,
      })
        .populate({
          path: "categoryId",
          select:
            "name subCategories displayOrder isActive",
        })
        .sort({
          displayOrder: 1,
          createdAt: -1,
        });

    return res.json({
      todaySpecial:
        dishes.filter(
          (d) =>
            d.todaySpecial
        ),

      recommended:
        dishes.filter(
          (d) =>
            d.isRecommended
        ),

      popular:
        dishes.filter(
          (d) =>
            d.isPopular
        ),

      bestSeller:
        dishes.filter(
          (d) =>
            d.isBestseller
        ),

      newArrival:
        dishes.filter(
          (d) =>
            d.isNewArrival
        ),

      featured:
        dishes.filter(
          (d) =>
            d.featured
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