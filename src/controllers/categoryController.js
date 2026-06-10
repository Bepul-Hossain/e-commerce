const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
// Category create
exports.createCategory = async (req, res) => {
    try {
        const { category_name, category_img } = req.body;
        let data = await categoryModel.create({
            category_name,
            category_img
        });
        res.status(200).json({
            success: true,
            message: "Category created successfully.",
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
// Get all categories with pagination
exports.allCategory = async (req, res) => {
    try {
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
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
                    { $skip: skipRow },
                    { $limit: per_page },
                    { $sort: sortStage },
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
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

exports.singleCategory = async (req, res) => {
    try {
        let { id } = req.params;

        let data = await categoryModel.findById(id);
        res.status(200).json({
            success: true,
            message: "Category retrieved successfully.",
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

// Update category single
exports.updateCategory = async (req, res) => {
    try {
        let id = req.params.id;
        const { category_name, category_img } = req.body;
        let data = await categoryModel.findByIdAndUpdate(id, {
            category_name,
            category_img
        }, { new: true });
        res.status(200).json({
            success: true,
            message: "Category updated successfully.",
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

// Category delete single
exports.deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        let products = await productModel.find({ category_id: id });
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please delete the products with this category first.",
            });
        }
        let data = await categoryModel.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Category deleted successfully.",
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