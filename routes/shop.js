// const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');

const router = express.Router();

const isAuth = require('../middleware/authentication');

router.get('/', shopController.getIndex);

router.post('/cart',isAuth, shopController.postCart);

router.get('/cart',isAuth, shopController.getCart);

router.get('/products', shopController.getProducts);

router.post('/cart-delete-item',isAuth, shopController.postCartDeleteProduct);

router.post('/create-order',isAuth, shopController.postOrder);

router.get('/orders',isAuth, shopController.getOrder);

router.get('/products/:productId', shopController.getProduct); 

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;