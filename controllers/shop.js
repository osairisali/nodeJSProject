//  impor class Product dari dir models
const Product = require('../models/product');
const Order = require('../models/order');
// const Cart = require('../models/cart');
const User = require('../models/user');

const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const ITEM_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product
                .find()
                .skip((page - 1) * ITEM_PER_PAGE)
                .limit(ITEM_PER_PAGE)
        })
        .then(products => {
            // const isLogin = req.get('Cookie').split('=')[1];
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Shop',
                path: '/products',
                hasProducts: products.length > 0,
                activeShop: true,
                productCSS: true,
                currentPage: page,
                hasNextPage: ITEM_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
                // isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product
        // dgn mongoose, prodId sbg kriterium filter akan otomatis diconvert jd ObjectId
        .findById(prodId)
        .then(product => {
            // const isLogin = req.get('Cookie').split('=')[1];
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: `${product.title}`
                // isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
}

exports.getIndex = (req, res, next) => {

    // pagination
    const page = +req.query.page || 1;
    // console.log(`pagination query -> ${page}`);
    let totalItems;

    //  dengan menggunakan mongoose, find() akan return array, bukan cursor
    Product
        // .find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product
                .find()
                .skip((page - 1) * ITEM_PER_PAGE)
                .limit(ITEM_PER_PAGE)
                .then(products => {
                    // const isLogin = req.get('Cookie').split('=')[1];
                    res.render('shop/index', {
                        prods: products,
                        pageTitle: 'Shop',
                        path: '/',
                        hasProducts: products.length > 0,
                        activeShop: true,
                        productCSS: true,
                        currentPage: page,
                        hasNextPage: ITEM_PER_PAGE * page < totalItems,
                        hasPreviousPage: page > 1,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
                        // isAuthenticated: req.session.isLoggedIn
                    });
                })
                .catch(err => {
                    const errorLog = new Error(err);
                    errorLog.httpStatusCode = 500;
                    return next(errorLog);
                });
        })

}

exports.getCart = (req, res, next) => {

    let filteredProducts;
    let cartProducts;

    req
        .user
        // populate tdk return promise, shg gunakan execPopulate()
        // populate referensi cart ke Product menurut productId
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            console.log('user.cart.items pertama dari getCart --> ', user.cart.items);

            // filter produk yang telah dihapus oleh admin
            cartProducts = [...user.cart.items];

            return cartProducts;
        })
        .then(cartProductsDoc => {

            // filter cart dari null productId akibat dihapus admin
            return filteredProducts = cartProductsDoc.filter(item => {
                return !!item.productId;
            })
        })
        .then(filteredCart => {
            // update cart items di user sesuai data yang ada di db
            return User
                .findById(req.user._id)
                .then(user => {
                    console.log('user yang ditemukan saat getCart --> ', user)
                    user.cart.items = filteredCart;
                    return user.save();
                })
                .then(results => {
                    console.log('user yg di return dari getCart --> ', results);
                    console.log('user cart yg sdh diupdate dgn db --> ', results.cart.items);

                    // const isLogin = req.get('Cookie').split('=')[1];
                    return res.render('shop/cart', {
                        pageTitle: 'Your Cart',
                        path: '/cart',
                        products: filteredProducts
                        // isAuthenticated: req.session.isLoggedIn
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });

}

exports.postCart = (req, res, next) => {
    const prodId = req.body.prodId;

    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product)
        })
        .then(prod => {
            // console.log(prod);
            res.redirect('/cart');
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
}

exports.postOrder = (req, res, next) => {
    req
        .user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            // console.log(user.cart.items);
            const products = user.cart.items.map(item => {
                // perhatikan di elemen product yg memasukkan object berupa seluruh product yg direferensikan
                // perhatikan juga notasi _doc yg memerintahkan hanya memasukkan metadata yg terkait dgn product
                // const prod = item.productId ? item.productId._doc : '';
                let prod = 'produk telah dihapus sebelum order';
                // console.log('tototototototototototoo ===>>>>', item.productId._doc);
                if (item.productId) {
                    prod = {
                        ...item.productId._doc
                    };
                    // prod = item.productId._doc;
                }

                return {
                    quantity: item.quantity,
                    product: prod
                };
            });
            // console.log('postOrder products --> ', products);
            const order = new Order({
                user: {
                    name: req.user.email,
                    userId: req.user
                },
                products: products
            });
            // ojok lali db yg terbentuk disave rek!!!
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            return res.redirect('/orders');
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    // console.log('prodId to delete --> ', prodId);

    req
        .user
        .removeFromCart(prodId)
        .then(_ => {
            console.log('cart deleted!');
            res.redirect('/cart');
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
};

exports.getOrder = (req, res, next) => {
    Order
        .find({
            'user.userId': req.user._id
        })
        .then(orders => {
            // const isLogin = req.get('Cookie').split('=')[1];
            // console.log(orders);
            res.render('shop/orders', {
                orders: orders,
                path: '/orders',
                pageTitle: 'Your Orders'
            })
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    const invoice = `invoice-${orderId}.pdf`;
    const invoicePath = path.join('data', 'invoices', invoice);

    Order
        .findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found!'));
            };

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized to access this invoice'));
            };

            // fs.readFile membaca file seluruhnya dan load ke memory, shg tdk efisien untuk scale up
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) {
            //         return next();
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoicePath + '"');
            //     res.send(data);
            // });

            // buat file pdf invoice dengan pdfkit yg bs distream (write & read)
            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="' + invoicePath + '"');

            // write stream pdf invoice ke file system dan res
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });

            pdfDoc.text('------------------------');

            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc
                    .fontSize(14)
                    .text(prod.product.title + ' - ' + prod.quantity + ' x ' + prod.product.price + ' = ' + '$ ' + prod.quantity * prod.product.price);
            });

            pdfDoc.text('----------------');
            pdfDoc.text('Total Price = $ ' + totalPrice);


            // end write streaming
            pdfDoc.end();

            // // jika file yang dituju tidak ada di file system
            // if(!fs.existsSync(invoicePath)){
            //     return next(new Error('No invoice file exist!'));
            // }

            // // buat file streaming, shg tdk membebani memory
            // const file = fs.createReadStream(invoicePath);

            // console.log('file stream -> ', file);

            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', 'attachment; filename="' + invoicePath + '"');

            // // res sebetulnya adalah stream object, jd bs stream file ke res. tdk semua object bs stream.
            // file.pipe(res);
        })
        .catch(err => next(err));
};

// // exports.getCheckout = (req, res, next) => {
// //     res.render('shop/checkout', {
// //         pageTitle: 'Checkout',
// //         path: '/checkout'
// //     });
// // }