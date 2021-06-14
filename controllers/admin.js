const Product = require('../models/product');

// const mongoose = require('mongoose');

const User = require('../models/user');

const {
    validationResult
} = require('express-validator');

const deleteFile = require('../util/deleteFile');

const ITEM_PER_PAGE = 1;


exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;
    console.log('image upload -> ', image);
    // const userId = req.user;
    // atau bisa jg eksplisit nentukan userId berikut
    // ingat, user._id ini ditentukan otomatis oleh mongoose
    const userId = req.user;

    // di sini ketika input error terjadi dan form reload, image url malah menghilang, sehingga harus input kembali
    // sementara itu, gambar terus kesubmit krn multer langsung beroperasi terus. di script ini hanya menyimpan alamat 
    // gambar pada db.
    // const imagePath = image.path;
    // console.log(`image path -> ${imagePath}`);

    const errors = validationResult(req);

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: "Edit Product (There's error in the field)",
            path: '/admin/add-product',
            editing: false,
            activeAddProduct: true,
            formsCSS: true,
            productCSS: true,
            product: {
                title: title,
                description: description,
                price: price
            },
            errorMessage: 'Invalid image'
        });
    };

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).render('admin/edit-product', {
            pageTitle: "Edit Product (There's error in the field",
            path: '/admin/add-product',
            editing: false,
            activeAddProduct: true,
            formsCSS: true,
            productCSS: true,
            product: {
                title: title,
                description: description,
                imageUrl: image.path,
                price: price
            },
            errorMessage: errors.array()[0].msg
        });
    };

    const product = new Product({
        // _id: new mongoose.Types.ObjectId('5f143717ad042f53f76cd54f'),
        title: title,
        imageUrl: image.path,
        description: description,
        price: price,
        userId: userId
    });

    return product
        .save()
        .then(result => {
            console.log('Product db loaded/created!');
            return res.redirect('/admin/products');
        })
        .catch(err => {
            // console.log(err);
            // res.redirect('/500');
            const errorLog = new Error(err);
            // tempelkan httpStatusCode untuk info tambahan saja. objek ini bukan objek builtin.
            errorLog.httpStatusCode = 500;

            // return next dgn errorLog
            return next(errorLog);
        });
};

exports.getAddProduct = (req, res, next) => {
    // const isLogin = req.get('Cookie').split('=')[1];
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        activeAddProduct: true,
        formsCSS: true,
        productCSS: true,
        product: {
            title: '',
            description: '',
            price: ''
        },
        errorMessage: null
    });
}

// exports.getProducts = (req, res, next) => {

//     Product
//         .find()
//         // menentukan field apa sj yg diretrieve: hanya title, price, serta menghilangkan _id
//         // .select('title price -_id')
//         // menentukan field apa sj yg diretrieve: hanya userId dan name
//         // .populate('userId', 'name')
//         .then(products => {
//             console.log(products);
//             res.render('admin/products', {
//                 prods: products,
//                 path: 'admin/products',
//                 pageTitle: 'Admin Products'
//             })
//         })
//         .catch(err => console.log(err));
// };

// exports.getAddProduct = (req, res, next) => {
//     res.render('admin/edit-product', {
//         pageTitle: 'Add Product',
//         path: '/admin/add-product',
//         editing: false,
//         activeAddProduct: true,
//         formsCSS: true,
//         productCSS: true
//     });
// }

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        res.redirect('/');
    };

    const userId = req.user._id
    const prodId = req.params.productId;
    console.log('userId dari req di getEditProduct -> ', userId);
    console.log('prodId dari Product di getEditProduct -> ', prodId);

    Product
        .find({
            userId: userId,
            _id: prodId
        })
        .then(product => {
            // throw new Error('dummy');
            // console.log(product);
            // const isLogin = req.get('Cookie').split('=')[1];
            // Model.find() akan return query berupa Array, jd pengecekannya pake length
            if (!product.length) {
                return res.redirect('/error');
            };
            // product dlm bentuk array of object, jadi disesuaikan dulu
            const prodObj = product[0];
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: prodObj,
                errorMessage: null
            })
        })
        .catch(err => {
            const errorLog = new Error(err);
            // tempelkan httpStatusCode untuk info tambahan saja. objek ini bukan objek builtin.
            errorLog.httpStatusCode = 500;

            // return next dgn errorLog
            return next(errorLog);
        });

}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.prodId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const userId = req.user._id;

    const errors = validationResult(req);

    //  cara dengan mongoose
    Product
        .findById(prodId)
        //  product sebagai document akan direturn sbg mongoose object dgn function save()
        .then(product => {
            // jika user yg mengedit bukan creator dr product itu
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/admin/products');
            }

            if (!errors.isEmpty()) {
                // console.log(product);
                return res.status(422).render('admin/edit-product', {
                    pageTitle: "Edit Product (There's error in the field",
                    path: '/admin/edit-product',
                    editing: true,
                    activeAddProduct: true,
                    formsCSS: true,
                    productCSS: true,
                    product: {
                        title: updatedTitle,
                        price: updatedPrice,
                        description: updatedDesc,
                        _id: prodId
                    },
                    errorMessage: errors.array()[0].msg
                });
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                // jika image diupload dgn yg baru, maka hapus file image sebelumnya
                deleteFile(product.imageUrl);

                product.imageUrl = image.path;
            };
            product.description = updatedDesc;

            // console.log(product);
            return product
                .save()
                .then(product => {
                    res.redirect('/admin/products');
                    // console.log('updated product');
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
}

exports.getProducts = (req, res, next) => {

    const page = +req.query.page || 1;
    let totalItems;
    Product
        .countDocuments({
            userId: req.user._id
        })
        .then(numProducts => {
            totalItems = numProducts;
            return Product
                .find({
                    userId: req.user._id
                })
                .skip((page - 1) * ITEM_PER_PAGE)
                .limit(ITEM_PER_PAGE)
        })
        // .find()
        // menentukan field apa sj yg diretrieve: hanya title, price, serta menghilangkan _id
        // .select('title price -_id')
        // Population is the process of automatically replacing the specified paths in the document with document(s) from other collection(s)
        // .populate('userId.user')
        .then(products => {
            // const isLogin = req.get('Cookie').split('=')[1];
            // console.log(products);
            res.render('admin/products', {
                prods: products,
                path: 'admin/products',
                pageTitle: 'Admin Products',
                hasProducts: products.length > 0,
                activeShop: true,
                productCSS: true,
                currentPage: page,
                hasNextPage: ITEM_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
            })
        })
        .catch(err => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
        });
};

exports.filteredProduct = (req, res, next) => {

    const prodId = req.params.productId;
    const userId = req.user._id;

    // delete file image dulu
    Product
        .findById({
            _id: prodId
        })
        .then(product => {

            console.log('product.imageUrl -> ', product.imageUrl);
            deleteFile(product.imageUrl);

            // return Product.deleteOne({_id: prodId, userId: userId})

            return Product
                //findOneAndDelete({kriteria}) akan return document yg dihapus, sementara deleteOne() tdk return apa2
                .findOneAndDelete({
                    _id: prodId,
                    userId: userId
                });
        })
        .then(deletedDoc => {
            // console.log(deletedDoc);

            // delete product yg ada di user cart
            // req.
            // user
            //     .removeFromCart(prodId)
            //     .catch(err => console.log(err));

            if (!deletedDoc) {
                return res.redirect('/error')
            }

            console.log('DATA DELETED');

            // beri respon ke browser, jd tdk perlu kirim tampilan web lagi dgn redirect
            return res.status(200).json({
                message: 'succesfully deleting product'
            });
        })
        .catch(err => {
            // const errorLog = new Error(err);
            // errorLog.httpStatusCode = 500;
            // return next(errorLog);

            // beri respon ke browser klo deleting data failed
            res.status(500).json({
                message: 'deleting product failed'
            });
        });
}