const mongoose = require("mongoose");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const axios = require("axios");
const productModel = require("../models/productModel");
const invoiceModel = require("../models/invoiceModel");
const invoiceProductModel = require("../models/invoiceProductModel");
const ObjectId = mongoose.Types.ObjectId;

let redirect_url = "/cart-thank-you"

// Invoice create
exports.createInvoice = async (req, res) => {
    try {
        let user_id = new ObjectId(req.headers._id);
        let cus_email = req.headers.email;

        // Step 1: Calculate payable & vat
        let matchStage = { $match: { user_id } };
        let joinStageWithProduct = {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product"
            }
        }

        let unwindStage = { $unwind: "$product" };
        let cartProducts = await cartModel.aggregate([matchStage, joinStageWithProduct, unwindStage]);

        if (cartProducts.length > 0) {
            let totalAmount = 0;

            cartProducts.forEach(item => {
                let price;
                if (item?.product?.is_discount === true) {
                    price = parseInt(item?.product?.discount_price);
                } else {
                    price = parseInt(item?.product?.price);
                }

                totalAmount = totalAmount + price * parseInt(item?.qty);
            });

            let vat = totalAmount * 0.15;
            let shipping = 75;

            let totalPayable = totalAmount + vat + shipping;

            // Step 2: Prepare customer details & shipping details
            let user = await userModel.findOne({ _id: user_id });
            if ([user.cus_add,
            user.cus_city,
            user.cus_country,
            user.cus_fax,
            user.cus_name,
            user.cus_phone,
            user.cus_postcode,
            user.cus_state,
            user.ship_add,
            user.ship_city,
            user.ship_country,
            user.ship_name,
            user.ship_phone,
            user.ship_postcode,
            user.ship_state
            ].every(v => v === undefined)) {
                return res.status(400).json({
                    success: false,
                    message: "Please update your profile before checkout.",
                });
            }

            let cus_details = {
                Name: user.cus_name,
                Email: cus_email,
                Address: user.cus_add,
                Phone: user.cus_phone,
            }
            let ship_details = {
                Name: user.ship_name,
                City: user.ship_city,
                Address: user.ship_add,
                Phone: user.ship_phone,
            }
            // Step 3: Transaction & Other's Id
            let tran_id = "tra-" + Date.now() + Math.floor(Math.random() * 90000000);
            let val_id = "val-" + Date.now() + Math.floor(Math.random() * 90000000);

            // Step 4: Create invoice
            let createInvoice = await invoiceModel.create({
                user_id,
                payable: parseFloat(totalPayable).toFixed(2),
                cus_details,
                ship_details,
                tran_id,
                val_id,
                vat,
                total: totalAmount
            })

            // Step 5: create Invoice product

            let invoice_id = createInvoice._id;
            cartProducts.forEach(async (item) => {
                await invoiceProductModel.create({
                    user_id,
                    product_name: item.product_name,
                    product_id: item.product_id,
                    invoice_id,
                    qty: item.qty,
                    price: item.product.is_discount === true ? item.product.discount_price : item.product.price,
                    color: item.color,
                    size: item.size
                })
            })

            // Step 6: Stock remove
            for (const item of cartProducts) {
                await productModel.updateOne(
                    {
                        _id: item.product_id,
                    },
                    {
                        $inc: { stock: -item.qty },
                    }
                )
            }

            // Step 7: Remove cart
            await cartModel.deleteMany({ user_id });

            // Step 8 Prepare SSL Payment

            let paymentSetting = {
                store_id: process.env.SSLCZ_STORE_ID,
                store_passwd: process.env.SSLCZ_STORE_PASSWD,
                currency: process.env.SSLCZ_CURRENCY,
                success_url: process.env.SSLCZ_SUCCESS_URL,
                fail_url: process.env.SSLCZ_FAIL_URL,
                cancel_url: process.env.SSLCZ_CANCEL_URL,
                ipn_url: process.env.SSLCZ_IPN_URL,
                init_url: process.env.SSLCZ_INIT_URL,
            }

            let form = new FormData();
            // Request parameters
            form.append('store_id', paymentSetting.store_id);
            form.append('store_passwd', paymentSetting.store_passwd);
            form.append('total_amount', totalPayable.toString());
            form.append('currency', paymentSetting.currency);
            form.append('tran_id', tran_id);
            form.append('success_url', `${paymentSetting.success_url}/${tran_id}`);
            form.append('fail_url', `${paymentSetting.fail_url}/${tran_id}`);
            form.append('cancel_url', `${paymentSetting.cancel_url}/${tran_id}`);
            form.append('ipn_url', `${paymentSetting.ipn_url}/${tran_id}`);
            form.append('init_url', `${paymentSetting.init_url}/${tran_id}`);

            // Customer Information
            form.append('cus_name', user.cus_name);
            form.append('cus_email', cus_email);
            form.append('cus_add1', user.cus_add);
            form.append('cus_add2', user.cus_add);
            form.append('cus_city', user.cus_city);
            form.append('cus_state', user.cus_state);
            form.append('cus_postcode', user.cus_postcode);
            form.append('cus_country', user.cus_country);
            form.append('cus_phone', user.cus_phone);

            // Shipping Information
            form.append('shipping_method', 'YES');
            form.append('ship_name', user.ship_name);
            form.append('ship_add1', user.ship_add);
            form.append('ship_add2', user.ship_add);
            form.append('ship_city', user.ship_city);
            form.append('ship_state', user.ship_state);
            form.append('ship_country', user.ship_country);
            form.append('ship_postcode', user.ship_postcode);
            form.append('ship_phone', user.ship_phone);

            // Product Information
            form.append('product_name', "Accounting Invoice");
            form.append('product_category', "Accounting Invoice");
            form.append('product_profile', "Accounting Invoice");
            form.append('product_amount', totalPayable.toString());

            let SSLRes = await axios.post(paymentSetting.init_url, form);

            res.status(200).json({
                success: true,
                message: "Payment updated successfully.",
                data: SSLRes.data
            })
        } else {
            res.status(400).json({
                success: false,
                message: "Cart is empty.",
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

// Read all invoice single user
exports.readAllInvoiceSingleUser = async (req, res) => {
    try {
        let user_id = new ObjectId(req.headers._id);
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
        let skipRow = (page_no - 1) * per_page;
        let matchStage = {
            $match: {
                user_id,
            }
        }
        let sortStage = { createdAt: -1 };

        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                data: [
                    { $sort: sortStage },
                    { $skip: skipRow },
                    { $limit: per_page },
                ],
            }
        }

        let products = await invoiceModel.aggregate([matchStage, facetStage]);

        res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully.",
            data: products[0],
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

// Read single invoice single user
exports.readSignleInvoiceSingleUser = async (req, res) => {
    try {
        let invoice_id = new ObjectId(req.params.invoice_id);

        let matchStage = {
            $match: {
                _id: invoice_id,
            }
        }

        let joinStageWithInvoiceProduct = {
            $lookup: {
                from: "invoicesproducts",
                localField: "_id",
                foreignField: "invoice_id",
                as: "invoicesproducts",
            }
        }

        let data = await invoiceModel.aggregate([matchStage, joinStageWithInvoiceProduct]);

        res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully.",
            data: data[0],
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

// Read single invoice product list single user
exports.readInvoiceProductListSingleUser = async (req, res) => {
    try {
        let user_id = new ObjectId(req.headers._id);
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
        let skipRow = (page_no - 1) * per_page;
        let matchStage = {
            $match: {
                user_id,
            }
        }
        let sortStage = { createdAt: -1 };

        let joinStageWithProduct = {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product",
            }
        }

        let unwindStage = { $unwind: "$product" };

        let projectionStage = {

        }
        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                products: [
                    { $sort: sortStage },
                    { $skip: skipRow },
                    { $limit: per_page },
                    unwindStage
                ],
            }
        }

        let products = await invoiceProductModel.aggregate([matchStage, joinStageWithProduct, facetStage]);

        res.status(200).json({
            success: true,
            message: "Invoice product list retrieved successfully.",
            data: products[0],
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

// Payment success
exports.paymentSuccess = async (req, res) => {
    try {
        let trx_id = req.params.trx_id;
        await invoiceModel.updateOne({ tran_id: trx_id }, { $set: { payment_status: "success" } });

        res.redirect(redirect_url )
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}
// Payment cancel
exports.paymentCancel = async (req, res) => {
    try {
        let trx_id = req.params.trx_id;
        await invoiceModel.updateOne({ tran_id: trx_id }, { $set: { payment_status: "cancel" } });

        res.redirect(redirect_url )
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}
// Payment fail
exports.paymentFail = async (req, res) => {
    try {
        let trx_id = req.params.trx_id;
        await invoiceModel.updateOne({ tran_id: trx_id }, { $set: { payment_status: "fail" } });

        res.redirect(redirect_url )
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}
// Payment IPN
exports.paymentIpn = async (req, res) => {
    try {
        let trx_id = req.params.trx_id;
        // await invoiceModel.updateOne({ tran_id: trx_id }, { $set: { payment_status: "fail" } });

        res.status(200).json({
            success: true,
            message: "Here do something. you have to need.",
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
