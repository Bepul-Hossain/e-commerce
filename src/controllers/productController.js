const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const fileModel = require("../models/fileModel");

// "Red, Green" or ["Red", " Green "] -> ["Red", "Green"]
const toStringList = (value) => {
    const list = Array.isArray(value) ? value : (value ?? "").toString().split(",");
    return list.map((v) => v.toString().trim()).filter(Boolean);
};

// "", null, undefined -> NaN; otherwise Number(value)
const toNumber = (value) =>
    value === "" || value === null || value === undefined ? NaN : Number(value);

// true / "true" -> true, everything else -> false
const toBoolean = (value) => value === true || value === "true";

// Validate and normalize the product body (used by create and update).
// Returns { error } or { value } with clean, typed fields.
const validateProductInput = async (body = {}) => {
    const title = (body.title ?? "").toString().trim();
    const short_description = (body.short_description ?? "").toString().trim();
    const description = (body.description ?? "").toString().trim();
    const remark = (body.remark ?? "").toString().trim();
    // Unique, in the order picked (first = main image)
    const images = [...new Set(toStringList(body.images))];
    const color = toStringList(body.color);
    const size = toStringList(body.size);
    const price = toNumber(body.price);
    const stock = toNumber(body.stock);
    const is_discount = toBoolean(body.is_discount);
    let discount_price = toNumber(body.discount_price);
    const category_id = (body.category_id ?? "").toString();
    const brand_id = (body.brand_id ?? "").toString();

    if (!title) return { error: "Title is required." };
    if (images.length === 0) return { error: "Please select at least one image." };
    if (!Number.isFinite(price) || price < 0) return { error: "Price must be a number of 0 or more." };
    if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number of 0 or more." };

    if (is_discount) {
        if (!Number.isFinite(discount_price) || discount_price < 0) {
            return { error: "Discount price is required when discount is on." };
        }
        if (discount_price >= price) {
            return { error: "Discount price should be less than the original price." };
        }
    } else {
        // No discount: don't keep a stale discount price around
        discount_price = 0;
    }

    if (!mongoose.isValidObjectId(category_id)) return { error: "Please select a category." };
    if (!mongoose.isValidObjectId(brand_id)) return { error: "Please select a brand." };

    const [categoryExists, brandExists, foundImages] = await Promise.all([
        categoryModel.exists({ _id: category_id }),
        brandModel.exists({ _id: brand_id }),
        fileModel.countDocuments({ filename: { $in: images } }),
    ]);
    if (!categoryExists) return { error: "Selected category was not found." };
    if (!brandExists) return { error: "Selected brand was not found." };
    if (foundImages !== images.length) {
        return { error: "One or more selected images were not found. Please select them again." };
    }

    return {
        value: {
            title,
            images,
            short_description,
            price,
            is_discount,
            discount_price,
            remark,
            stock,
            color,
            size,
            description,
            category_id,
            brand_id,
        },
    };
};

// Product create
exports.createProduct = async (req, res) => {
    try {
        const { error, value } = await validateProductInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await productModel.create(value);
        res.status(200).json({
            success: true,
            message: "Product created successfully.",
            data,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// Get all products with pagination
exports.allProduct = async (req, res) => {
    try {
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
        let category_id = req.params.category_id;
        let brand_id = req.params.brand_id;
        let remark = req.params.remark;
        let keyword = req.params.keyword;
        console.log("🚀 > productController.js:70 > keyword:", keyword);

        let skipRow = (page_no - 1) * per_page;

        let sortStage = { createdAt: -1 };

        let MatchingStage;

        if (category_id != 0) {
            MatchingStage = {
                $match: {
                    category_id: new ObjectId(category_id),
                }
            }
        } else if (brand_id != 0) {
            MatchingStage = {
                $match: {
                    brand_id: new ObjectId(brand_id),
                }
            }
        } else if (remark != 0) {
            MatchingStage = {
                $match: {
                    remark: remark,
                }
            }
        } else if (keyword != 0) {
            let searchRegex = {
                $regex: keyword,
                $options: "i"
            }
            let searchParams = [{ title: searchRegex }]
            let searchStage = {
                $or: searchParams
            }
            MatchingStage = {
                $match: searchStage
            }
        } else {
            MatchingStage = {
                $match: {}
            }
        }

        let joinWithCategory = {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category"
            }
        }

        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                products: [
                    { $sort: sortStage },
                    { $skip: skipRow },
                    { $limit: per_page },
                    joinWithCategory,
                    {
                        $project: {
                            _id: 1,
                            category_id: 1,
                            brand_id: 1,
                            title: 1,
                            images: 1,
                            price: 1,
                            is_discount: 1,
                            discount_price: 1,
                            remark: 1,
                            stock: 1,
                            createdAt: 1,
                            "category.category_name": 1
                        }
                    }
                ]
            }
        }

        let products = await productModel.aggregate([MatchingStage, facetStage]);
        let totalCount = products[0]?.totalCount[0]?.count || 0;
        res.status(200).json({
            success: true,
            message: "Products retrieved successfully.",
            data: products[0],
            totalCount,
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

exports.signleProduct = async (req, res) => {
    try {
        let id = new ObjectId(req.params.id);

        let matchStage = {
            $match: {
                _id: id,
            }
        }
        let joinMatchCategory = {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category"
            }
        }

        let joinMatchBrand = {
            $lookup: {
                from: "brands",
                localField: "brand_id",
                foreignField: "_id",
                as: "brand"
            }
        }

        let data = await productModel.aggregate([matchStage, joinMatchCategory, joinMatchBrand]);

        res.status(200).json({
            success: true,
            message: "Product retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// Update product single (same validation as create; replaces all fields)
exports.updateProduct = async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid product id." });
        }

        const { error, value } = await validateProductInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await productModel.findByIdAndUpdate(id, value, { new: true, runValidators: true });
        if (!data) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            data
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// Product delete single
exports.deleteProduct = async (req, res) => {
    try {
        let id = req.params.id;
        let data = await productModel.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
            data
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}