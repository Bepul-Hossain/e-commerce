const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");

// Cart create
exports.createCart = async (req, res) => {
    try {
        const user_id = req.headers._id;
        const { product_id, product_name, color, qty, size } = req.body;

        // find the stock products
        let product = await productModel.findById(product_id);

        // Find existing cart
        let existingCart = await cartModel.findOne({
            user_id,
            product_id,
            product_name,
            color,
            size
        });

        if (existingCart) {
            let newReqBody = {
                user_id,
                product_id,
                product_name,
                color,
                qty: parseInt(existingCart.qty) + parseInt(qty),
                size
            }

            const carts = await cartModel.find({ product_id }).select('qty');
            let totalQty = carts.reduce((sum, item) => sum + item.qty, 0);

            if (product?.stock < totalQty + qty) {
                return res.status(400).json({
                    success: false,
                    message: "You have added all the products in your cart.",
                })
            }

            const updateData = await cartModel.updateOne(
                {
                    _id: existingCart._id,
                    user_id: existingCart.user_id,
                },

                {
                    $set: newReqBody,
                },
                // { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Cart updated successfully.",
                updateData,
            });
        } else {
            // For new Products
            const carts = await cartModel.find({ product_id }).select('qty');
            let totalQty = carts.reduce((sum, item) => sum + item.qty, 0);

            if (product?.stock < totalQty + qty) {
                return res.status(400).json({
                    success: false,
                    message: "You have added all the products in your cart.",
                })
            }
            let data = await cartModel.create({
                user_id,
                product_id,
                product_name,
                color,
                qty,
                size
            });

            return res.status(200).json({
                success: true,
                message: "Cart created successfully.",
                data,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// cart read
exports.readCart = async (req, res) => {
    try {
        const user_id = new ObjectId(req.headers._id);
        console.log("🚀 > cartController.js:102 > user_id:", user_id);
        let matchStage = { $match: { user_id } };
        let joinWithProduct = {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product"
            }
        };

        let unwindStageProduct = { $unwind: "$product" };

        let joinWithBrand = {
            $lookup: {
                from: "brands",
                localField: "product.brand_id",
                foreignField: "_id",
                as: "brand"
            }
        };

        let unwindStageBrand = { $unwind: "$brand" };

        let joinWithCategory = {
            $lookup: {
                from: "categories",
                localField: "product.category_id",
                foreignField: "_id",
                as: "category"
            }
        };

        let unwindStageCategory = { $unwind: "$category" };

        let projectionStage = {
            $project: {
                _id: 1,
                user_id: 0,
                "product._id": 0,
                "product.category_id": 0,
                "product.brand_id": 0,
                "product.createdAt": 0,
                "product.updatedAt": 0,
                "product.description": 0,
                "brand._id": 0,
                "brand.createdAt": 0,
                "brand.updatedAt": 0,
                "category._id": 0,
                "category.createdAt": 0,
                "category.updatedAt": 0,

                category_id: 0,
                brand_id: 0,
                createdAt: 0,
                updatedAt: 0
            }
        }
        let data = await cartModel.aggregate([
            matchStage,
            joinWithProduct,
            unwindStageProduct,
            joinWithBrand,
            unwindStageBrand,
            joinWithCategory,
            unwindStageCategory,
            projectionStage
        ])

        return res.status(200).json({
            success: true,
            message: "Cart read successfully.",
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

// cart update
exports.updateCart = async (req, res) => {
    try {
        const { product_id, qty, inc } = req.body;

        let user_id = req.headers._id;
        let cart_id = new ObjectId(req.params.cart_id);
        let initQTY = 1;

        if (inc) {
            // find the stock products
            let product = await productModel.findById(product_id);
            const carts = await cartModel.find({ product_id }).select('qty');

            let totalQty = carts.reduce((sum, item) => sum + item.qty, 0);

            if (product?.stock > totalQty + qty) {
                const data = await cartModel.updateOne(
                    {
                        _id: cart_id,
                        user_id: user_id,
                    },
                    {
                        $set: { user_id, product_id, qty },
                    }
                )

                return res.status(200).json({
                    success: true,
                    message: "Cart updated successfully. inc",
                    data,
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "You have added all the products in stock.",
                })
            }

        } else {
            const data = await cartModel.updateOne(
                {
                    _id: cart_id,
                    user_id: user_id,
                },
                {
                    $set: { user_id, product_id, qty },
                }
            )

            return res.status(200).json({
                success: true,
                message: "Cart updated successfully. inc-",
                data,
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// cart delete 
exports.deleteCart = async (req, res) => {
    try {
        const cart_id = req.params.cart_id;

        let data = await cartModel.findByIdAndDelete(cart_id);
        return res.status(200).json({
            success: true,
            message: "Cart deleted successfully.",
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
