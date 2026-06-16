const brandModel = require("../models/brandModel");
const categoryModel = require("../models/categoryModel");
const invoiceModel = require("../models/invoiceModel");
const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");

exports.dashboadSummary = async (req, res) => {
    try {
        //Count documents
        const totalUsers = await userModel.countDocuments();
        const totalProducts = await productModel.countDocuments();
        const totalOrders = await invoiceModel.countDocuments();
        const totalReviews = await reviewModel.countDocuments();
        const totalCategories = await categoryModel.countDocuments();
        const totalBrands = await brandModel.countDocuments();

        // filter counts
        const pendingDeliver = await invoiceModel.countDocuments({
            delivery_status: "pending"
        });
        const deliveredOrders = await invoiceModel.countDocuments({
            delivery_status: "delivered"
        });
        const cancelOrders = await invoiceModel.countDocuments({
            delivery_status: "cancel"
        });

        // Total incode from succefull payments
        const totalIncomeAgg = await invoiceModel.aggregate([
            {
                $match: {
                    payment_status: "success"
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$payable"
                    }
                }
            }
        ]);

        const totalIncome = totalIncomeAgg.length > 0 ? totalIncomeAgg[0].total : 0;

        res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully.",
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalIncome,
                pendingDeliver,
                deliveredOrders,
                cancelOrders,
                totalReviews,
                totalCategories,
                totalBrands,
            }
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