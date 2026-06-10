const brandModel = require("../models/brandModel");
const productModel = require("../models/productModel");
// Brand create
exports.createBrand = async (req, res) => {
    try {
        const { brand_name, brand_img } = req.body;
        let data = await brandModel.create({
            brand_name,
            brand_img
        });
        res.status(200).json({
            success: true,
            message: "Brand created successfully.",
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
// Get all brand with pagination
exports.allBrand = async (req, res) => {
    try {
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
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
        let data = await brandModel.aggregate([facetStage]);
        res.status(200).json({
            success: true,
            message: "Brands retrieved successfully.",
            data: data[0],
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

exports.singleBrand = async (req, res) => {
    try {
        let { id } = req.params;

        let data = await brandModel.findById(id);
        res.status(200).json({
            success: true,
            message: "Brand retrieved successfully.",
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

// Update brand single
exports.updateBrand = async (req, res) => {
    try {
        let id = req.params.id;
        const { brand_name, brand_img } = req.body;
        let data = await brandModel.findByIdAndUpdate(id, {
            brand_name,
            brand_img
        }, { new: true });
        res.status(200).json({
            success: true,
            message: "Brand updated successfully.",
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

// Brand delete single
exports.deleteBrand = async (req, res) => {
    try {
        const id = req.params.id;
        let products = await productModel.find({ category_id: id });
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please delete the products with this category first.",
            });
        }
        let data = await brandModel.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Brand deleted successfully.",
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