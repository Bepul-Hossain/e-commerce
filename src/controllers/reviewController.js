const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const reviewModel = require("../models/reviewModel");

// Review create
exports.createReview = async (req, res) => {
    try {
        const user_id = req.headers._id;
        const { product_id, invoice_id, des, rating } = req.body;
        let data = await reviewModel.updateOne(
            { user_id, product_id, invoice_id },
            { user_id, product_id, invoice_id, des, rating },
            { upsert: true, new: true });

        res.status(200).json({
            success: true,
            message: "Review created successfully.",
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
// Get all review with pagination
exports.allReview = async (req, res) => {
    try {
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
        let skipRow = (page_no - 1) * per_page;
        let sortStage = { createdAt: -1 };

        let joinStageWithUser = {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        };

        let joinStageWithProduct = {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product"
            }
        };

        let unwindStageUser = { $unwind: "$user" };
        let unwindStageProduct = { $unwind: "$product" };

        let projectStage = {
            $project: {
                _id: 1,
                user_id: 1,
                product_id: 1,
                invoice_id: 1,
                des: 1,
                rating: 1,
                createdAt: 1,
                user: {
                    cus_name: 1,
                    email: 1
                },
                product: {
                    title: 1,
                    images: 1
                }
            }
        }

        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                data: [
                    { $skip: skipRow },
                    { $limit: per_page },
                    { $sort: sortStage },
                    joinStageWithUser,
                    joinStageWithProduct,
                    unwindStageUser,
                    unwindStageProduct,
                    projectStage
                ]
            }
        }

        let data = await reviewModel.aggregate([facetStage]);
        res.status(200).json({
            success: true,
            message: "Review retrieved successfully.",
            data,
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

// Get Review by single product
exports.allReviewByProducts = async (req, res) => {
    try {
        let product_id = new ObjectId(req.params.product_id);
        console.log("🚀 > reviewController.js:117 > product_id:", product_id);
        
        let matchingStage = {
            $match: {
                product_id: product_id
            }
        }

        let joinWithUser = {
            $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }
        }

        let unwindStageUser = { $unwind: "$user" };

        let project = {
            $project: {
                des: 1,
                rating: 1,
                createdAt: 1,
                updatedAt: 1,
                user: {
                    cus_name: 1,
                    email: 1
                }
            }
        };

        let data = await reviewModel.aggregate([matchingStage, joinWithUser, unwindStageUser, project]);
        res.status(200).json({
            success: true,
            message: "Review retrieved successfully.",
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
