const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/authentication');
const {
    body
} = require('express-validator');

//  /admin/add-product => GET
//  passing object berupa pageTitle dll untuk params rendering di ejs
router.get('/add-product', isAuth, adminController.getAddProduct);

//  /admin/products => GET perlu diingat, bahwa web url ini adalah /admin/product
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',
    isAuth,
    [
        body('title')
        .isString()
        .trim()
        .isLength({
            min: 5,
            max: 100
        })
        .withMessage('Invalid title'),
        body('price')
        .isFloat()
        .withMessage('Invalid price'),
        // body('imageUrl')
        // .isURL()
        // .withMessage('Invalid url'),
        body('description')
        .isString()
        .isLength({
            min: 10,
            max: 400
        })
        .withMessage('Invalid description')
    ],
    adminController.postAddProduct);

// //  /admin/delete-product/productId => POST

// pakai spesial method delete yg dikirim dari browser
router.delete('/product/:productId', isAuth, adminController.filteredProduct);

//  /admin/edit-product/productId
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

//  /admin/edit-product => POST
router.post('/edit-product', isAuth, [
        body('title')
        .isString()
        .trim()
        .isLength({
            min: 5,
            max: 100
        })
        .withMessage('Invalid title'),
        body('price')
        .isFloat()
        .withMessage('Invalid price'),
        body('description')
        .isString()
        .isLength({
            min: 10,
            max: 400
        })
        .withMessage('Invalid description')
    ],
    adminController.postEditProduct);

// // exports.routes = router;
module.exports = router;