const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/productModel");
// Product create
exports.createProduct = async (req, res) => {
    try {
        const {
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
            brand_id
        } = req.body;

        if (discount_price > price) {
            return res.status(400).json({
                success: false,
                message: "Discount price should be less than the original price.",
            });
        }

        let data = await productModel.create({
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
            brand_id
        });
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
                $match: {
                    title: searchStage,
                }
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
        let totalCount = products[0].totalCount[0].count;
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