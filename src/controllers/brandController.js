const mongoose = require("mongoose");
const brandModel = require("../models/brandModel");
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

// Validate brand_name + brand_img from the request body.
// brand_img is a single filename that must exist in the File Manager
// (the client picks it from /all-file). Returns { error } or { value }.
const validateBrandInput = async (body) => {
    const brand_name = (body?.brand_name ?? "").toString().trim();
    const brand_img = (body?.brand_img ?? "").toString().trim();

    if (!brand_name) return { error: "Brand name is required." };
    if (!brand_img) return { error: "Brand image is required." };

    const fileExists = await fileModel.exists({ filename: brand_img });
    if (!fileExists) return { error: "Selected brand image was not found. Please choose another image." };

    return { value: { brand_name, brand_img } };
};

const isDuplicateKey = (error) => error?.code === 11000;

// Brand create
exports.createBrand = async (req, res) => {
    try {
        const { error, value } = await validateBrandInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await brandModel.create(value);
        res.status(200).json({
            success: true,
            message: "Brand created successfully.",
            data,
        });

    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(400).json({ success: false, message: "Brand name already exists." });
        }
        serverError(res, error);
    }
}

// Get all brand with pagination
exports.allBrand = async (req, res) => {
    try {
        let page_no = Math.max(parseInt(req.params.page_no) || 1, 1);
        let per_page = Math.max(parseInt(req.params.per_page) || 10, 1);
        let skipRow = (page_no - 1) * per_page;
        let sortStage = { createdAt: -1 };

        let joinWithProduct = {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "brand_id",
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
                brands: [
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
        let data = await brandModel.aggregate([facetStage]);
        res.status(200).json({
            success: true,
            message: "Brands retrieved successfully.",
            data: data[0],
        });
    }
    catch (error) {
        serverError(res, error);
    }
}

exports.singleBrand = async (req, res) => {
    try {
        let { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid brand id." });
        }

        let data = await brandModel.findById(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.status(200).json({
            success: true,
            message: "Brand retrieved successfully.",
            data,
        });
    } catch (error) {
        serverError(res, error);
    }
}

// Update brand single
exports.updateBrand = async (req, res) => {
    try {
        let id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid brand id." });
        }

        const { error, value } = await validateBrandInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        let data = await brandModel.findByIdAndUpdate(id, value, { new: true, runValidators: true });
        if (!data) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.status(200).json({
            success: true,
            message: "Brand updated successfully.",
            data
        })
    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(400).json({ success: false, message: "Brand name already exists." });
        }
        serverError(res, error);
    }
}

// Brand delete single
exports.deleteBrand = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid brand id." });
        }

        // Block delete while products still use this brand
        // (previously this wrongly checked category_id)
        let hasProducts = await productModel.exists({ brand_id: id });
        if (hasProducts) {
            return res.status(400).json({
                success: false,
                message: "Please delete the products with this brand first.",
            });
        }
        let data = await brandModel.findByIdAndDelete(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.status(200).json({
            success: true,
            message: "Brand deleted successfully.",
            data
        })
    } catch (error) {
        serverError(res, error);
    }
}
