const express = require('express');

const router = express.Router();

const adminController = require('../controllers/adminController.js');
const userController = require('../controllers/userController.js');
const productController = require('../controllers/productController.js');
const categoryController = require('../controllers/categoryController.js');
const brandController = require('../controllers/brandController.js');
const reviewController = require('../controllers/reviewController.js');
const cartController = require('../controllers/cartController.js');
const invoiceController = require('../controllers/invoiceController.js');

const authVerificationAdmin = require('../middlewares/authVerificationAdmin.js');
const authVerificationUser = require('../middlewares/authVerificationUser.js');


// ===========For Super Admin==========
router.post('/admin-register', adminController.register);
router.get('/admin-login', adminController.login);
router.get('/admin', authVerificationAdmin, adminController.admin);
router.get('/admin-verify', authVerificationAdmin, adminController.adminVerify);
router.get('/admin-logout', authVerificationAdmin, adminController.logout);
router.put('/admin-update', authVerificationAdmin, adminController.update);

// ===========For User==========
router.post('/user-register', userController.register);
router.get('/user-login', userController.login);
router.get('/user', authVerificationUser, userController.user);
router.get('/user-verify', authVerificationUser, userController.userVerify);
router.get('/user-logout', authVerificationUser, userController.logout);
router.put('/user-update', authVerificationUser, userController.update);

// ===========For Product==========
router.post('/create-product', authVerificationAdmin, productController.createProduct);
router.get('/all-products/:category_id/:brand_id/:remark/:keyword/:per_page/:page_no', productController.allProduct);
router.get('/single-product/:id',  productController.signleProduct);
router.put('/update-product/:id', authVerificationAdmin, productController.updateProduct);
router.delete('/delete-product/:id', authVerificationAdmin, productController.deleteProduct);

// ===========For Category==========
router.post('/create-category', authVerificationAdmin, categoryController.createCategory);
router.get('/all-category/:per_page/:page_no', categoryController.allCategory);
router.get('/single-category/:id', categoryController.singleCategory);
router.put('/update-category/:id', authVerificationAdmin, categoryController.updateCategory);
router.delete('/delete-category/:id', authVerificationAdmin, categoryController.deleteCategory);

// ===========For Brand==========
router.post('/create-brand', authVerificationAdmin, brandController.createBrand);
router.get('/all-brand/:per_page/:page_no', brandController.allBrand);
router.get('/single-brand/:id', brandController.singleBrand);
router.put('/update-brand/:id', authVerificationAdmin, brandController.updateBrand);
router.delete('/delete-brand/:id', authVerificationAdmin, brandController.deleteBrand);

// ===========For Review==========
router.post('/create-review', authVerificationUser, reviewController.createReview);
router.get('/all-review/:per_page/:page_no', reviewController.allReview);
router.get('/all-review-by-product/:product_id', reviewController.allReviewByProducts);

// ===========For Cart==========
router.post('/create-cart', authVerificationUser, cartController.createCart);
router.get('/read-cart', authVerificationUser, cartController.readCart);
router.put('/update-cart/:cart_id', authVerificationUser, cartController.updateCart);
router.delete('/delete-cart/:cart_id', authVerificationUser, cartController.deleteCart);

// ===========For Invoice & Payment==========
//For user
router.post('/create-invoice', authVerificationUser, invoiceController.createInvoice);
router.get('/read-all-invoice-single-user/:per_page/:page_no', authVerificationUser, invoiceController.readAllInvoiceSingleUser);
router.get('/read-single-invoice-single-user/:invoice_id', authVerificationUser, invoiceController.readSignleInvoiceSingleUser);
router.get('/read-invoice-product-list-single-user/:per_page/:page_no', authVerificationUser, invoiceController.readInvoiceProductListSingleUser);
router.post('/payment-success/:trx_id', invoiceController.paymentSuccess);
router.post('/payment-cancel/:trx_id', invoiceController.paymentCancel);
router.post('/payment-fail/:trx_id', invoiceController.paymentFail);
router.post('/payment-ipn/:trx_id', invoiceController.paymentIpn);


module.exports = router;