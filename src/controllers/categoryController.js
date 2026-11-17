const mongoose = require("mongoose");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const fileModel = require("../models/fileModel");

const serverError = (res, error) => {
    console.error(error);
    res.status(500).json({
        success: false,
        error: error.toString(),
        message: "Something went wrong.",
    });
};

// Validate category_name + category_img from the request body.
// category_img is a single filename that must exist in the File Manager
// (the client picks it from /all-file). Returns { error } or { value }.
const validateCategoryInput = async (body) => {
    const category_name = (body?.category_name ?? "").toString().trim();
    const category_img = (body?.category_img ?? "").toString().trim();

    if (!category_name) return { error: "Category name is required." };
    if (!category_img) return { error: "Category image is required." };

    const fileExists = await fileModel.exists({ filename: category_img });
    if (!fileExists) return { error: "Selected category image was not found. Please choose another image." };

    return { value: { category_name, category_img } };
};

const isDuplicateKey = (error) => error?.code === 11000;

// Category create
exports.createCategory = async (req, res) => {
    try {
        const { error, value } = await validateCategoryInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await categoryModel.create(value);
        res.status(200).json({
            success: true,
            message: "Category created successfully.",
            data,
        });

    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(400).json({ success: false, message: "Category name already exists." });
        }
        serverError(res, error);
    }
}

// Get all categories with pagination
exports.allCategory = async (req, res) => {
    try {
        let page_no = Math.max(parseInt(req.params.page_no) || 1, 1);
        let per_page = Math.max(parseInt(req.params.per_page) || 10, 1);
        let skipRow = (page_no - 1) * per_page;
        let sortStage = { createdAt: -1 };

        let joinWithProduct = {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "category_id",
                as: "products"
            }
        }

        const addProductCount = {
            $addFields: {
                totalCount: { $size: "$products" }
            }
        }

        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                categories: [
                    // Sort BEFORE skip/limit, otherwise each page is an
                    // arbitrary slice that is only sorted within itself
                    { $sort: sortStage },
                    { $skip: skipRow },
                    { $limit: per_page },
                    joinWithProduct,
                    addProductCount,
                    {
                        $project: {
                            updatedAt: 0,
                            products: 0
                        }
                    }
                ]
            }
        }

        let categories = await categoryModel.aggregate([facetStage]);

        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully.",
            data: categories[0],
        });

    }
    catch (error) {
        serverError(res, error);
    }
}

// All categories, without pagination, for dropdowns (e.g. Create Product).
// Returns only _id and category_name, sorted A-Z.
exports.categoryList = async (req, res) => {
    try {
        let data = await categoryModel
            .find({}, { category_name: 1 })
            .sort({ category_name: 1 })
            .collation({ locale: "en", strength: 2 }) // case-insensitive A-Z
            .lean();
        res.status(200).json({
            success: true,
            message: "Category list retrieved successfully.",
            data,
        });
    } catch (error) {
        serverError(res, error);
    }
}

exports.singleCategory = async (req, res) => {
    try {
        let { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid category id." });
        }

        let data = await categoryModel.findById(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.status(200).json({
            success: true,
            message: "Category retrieved successfully.",
            data,
        });
    } catch (error) {
        serverError(res, error);
    }
}

// Update category single
exports.updateCategory = async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid category id." });
        }

        const { error, value } = await validateCategoryInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await categoryModel.findByIdAndUpdate(id, value, { new: true, runValidators: true });
        if (!data) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            data
        })
    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(400).json({ success: false, message: "Category name already exists." });
        }
        serverError(res, error);
    }
}

// Category delete single
exports.deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid category id." });
        }

        // Block delete while products still use this category
        let hasProducts = await productModel.exists({ category_id: id });
        if (hasProducts) {
            return res.status(400).json({
                success: false,
                message: "Please delete the products with this category first.",
            });
        }
        let data = await categoryModel.findByIdAndDelete(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.status(200).json({
            success: true,
            message: "Category deleted successfully.",
            data
        })
    } catch (error) {
        serverError(res, error);
    }
}
