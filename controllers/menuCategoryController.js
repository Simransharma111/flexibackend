import MenuCategory from "../models/MenuCategory.js";

// =====================================================
// CREATE CATEGORY
// =====================================================

export const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      sortOrder,
    } = req.body;

    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not found",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name required",
      });
    }

    const existingCategory =
      await MenuCategory.findOne({
        hotelId,
        name: name.trim(),
      });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category already exists",
      });
    }

    const category =
      await MenuCategory.create({
        hotelId,
        name: name.trim(),
        description:
          description?.trim() || "",
        image: image || "",
        sortOrder:
          sortOrder !== undefined
            ? Number(sortOrder)
            : 0,
      });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(
      "CREATE CATEGORY ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET HOTEL CATEGORIES
// =====================================================

export const getCategories = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    if (!hotelId) {
      return res.status(400).json({
        message: "Hotel not found",
      });
    }

    const categories =
      await MenuCategory.find({
        hotelId,
      }).sort({
        sortOrder: 1,
        createdAt: 1,
      });

    res.json({
      categories,
    });
  } catch (error) {
    console.error(
      "GET CATEGORIES ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================================
// GET CATEGORY BY ID
// =====================================================

export const getCategoryById = async (
  req,
  res
) => {
  try {
    const category =
      await MenuCategory.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (
      category.hotelId.toString() !==
      req.user.hotelId.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json({
      category,
    });
  } catch (error) {
    console.error(
      "GET CATEGORY ERROR:",
      error
    );

    res.status(500).json({
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
      description,
      image,
      isActive,
      sortOrder,
    } = req.body;

    const category =
      await MenuCategory.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (
      category.hotelId.toString() !==
      req.user.hotelId.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message:
            "Category name required",
        });
      }

      const duplicate =
        await MenuCategory.findOne({
          hotelId: req.user.hotelId,
          name: name.trim(),
          _id: {
            $ne: category._id,
          },
        });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Category already exists",
        });
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description =
        description.trim();
    }

    if (image !== undefined) {
      category.image = image;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    if (sortOrder !== undefined) {
      category.sortOrder =
        Number(sortOrder);
    }

    await category.save();

    res.json({
      message:
        "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(
      "UPDATE CATEGORY ERROR:",
      error
    );

    res.status(500).json({
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
    const category =
      await MenuCategory.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (
      category.hotelId.toString() !==
      req.user.hotelId.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await MenuCategory.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Category deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE CATEGORY ERROR:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};