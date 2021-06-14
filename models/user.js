const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    // username: {
    //     type: String,
    //     required: true
    // },
    email: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

// menambahkan method penghitung quantity ke userSchema
// penulisan function harus menggunakan regular func (jgn arrow function, krn nanti mereferensi this ke global)
// https://levelup.gitconnected.com/arrow-function-vs-regular-function-in-javascript-b6337fb87032
// regular function dlm object mereferensi ke object itu sendiri, sementara arrow func mereferensi 1 tk diluar scopenya
// this adalah object, shg regular func dlm object akan mengarah pada object yg mendefinisikannya, sementara
//  arrow func mengarah pd context object diluar lokasi pendefinisiannya.
userSchema.methods.addToCart = function (product) {
    //  check if product already exist in cart
    // this.cart.items msh dpt mengakses cart.items pd schema
    const cartIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    // console.log('cartIndex adalah ', cartIndex)

    let newQuantity = 1;
    let cartItems = [...this.cart.items];

    //  logic jika product di cart sdh ada atau tidak
    if (cartIndex >= 0) {
        //  product di cart sdh ada, update quantity
        newQuantity = cartItems[cartIndex].quantity + 1;
        cartItems[cartIndex].quantity = newQuantity;
    } else {
        cartItems.push({
            productId: product._id,
            quantity: newQuantity
        });
    }

    const updatedCart = {
        items: cartItems
    };
    // cara update ke db, cukup replace seperti ini
    this.cart = updatedCart;
    // pakai return krn ini msh akan diteruskan dgn then() di shopController.postCart
    // Model.prototype.save() returns undefined if used with callback or a Promise otherwise.
    return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
    // jika product di cart yg mau dihapus masih ada di db (belum dihapus oleh admin) non null
    // console.log('dari removeFromCart productId', typeof(productId));
    // console.log('dari removeFromCart this.cart.items', this.cart.items);

    const cartItems = [...this.cart.items];
    
    const updatedCartItems = cartItems.filter(item => {
        return item._id.toString() !== productId.toString();
    });


    // console.log('dari removeFromCart updatedCartItems', updatedCartItems);
    this.cart.items = updatedCartItems;
    // console.log('DELETED CART ITEMS HERE --> ', this.cart.items);
    return this.save();
    // quantity juga ikut kehapus krn sepaket sbg object di item


};

userSchema.methods.clearCart = function () {
    this.cart.items = [];
    return this.save();
}

//  ingat, mongoose otomatis membuat User menjadi users (lowercase & plural) pd db
module.exports = mongoose.model('User', userSchema);


// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class User {
//     constructor(username, email, cart, userId) {
//         this.username = username;
//         this.email = email;
//         this.cart = cart; // {items: [{productId: khkbfkhbs, quantity:1}, {...}]}
//         this._id = userId ? new mongodb.ObjectId(userId) : null;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;

//         if (this._id) {
//             dbOp = db
//                 .collection('users')
//                 .updateOne({
//                     _id: this._id
//                 }, {
//                     $set: this
//                 });
//         } else {
//             dbOp = db
//                 .collection('users')
//                 .insertOne(this);
//         }

//         return dbOp
//             .then(res => console.log('successful adding a user!'))
//             .catch(err => console.log(err));
//     }

//     addToCart(product) {
//         //  check if product already exist in cart
//         const cartIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });

//         console.log('cartIndex adalah ', cartIndex)

//         let newQuantity = 1;
//         let cartItems = [...this.cart.items];

//         //  logic jika product di cart sdh ada atau tidak
//         if (cartIndex >= 0) {
//             //  product di cart sdh ada, update quantity
//             newQuantity = cartItems[cartIndex].quantity + 1;
//             cartItems[cartIndex].quantity = newQuantity;
//         } else {
//             cartItems.push({
//                 productId: mongodb.ObjectId(product._id),
//                 quantity: newQuantity
//             });
//         }

//         const updatedCart = {
//             items: cartItems
//         };

//         const db = getDb();
//         return db
//             .collection('users')
//             .updateOne({
//                 _id: this._id
//             }, {
//                 $set: {
//                     cart: updatedCart
//                 }
//             });
//     }

//     // return products berupa [{...p, quantity: 1}, {...p, quantity: 1}]
//     getCart() {
//         const db = getDb();
//         // return berupa array of id [productId, productId, ...]
//         const productId = this.cart.items.map(cartItem => {
//             return cartItem.productId;
//         });

//         return db
//             // cari pada db products apakah ada kesesuaian cart dgn db product yg terbaru.
//             // biasanya product hilang krn dihapus, shg cart yg sdh terlanjur ada product yg terhapus 
//             // harus tidak ditampilkan.
//             .collection('products')
//             .find({
//                 _id: {
//                     //  return semua products dr collection yg sesuai dgn id product di cart
//                     $in: productId
//                 }
//             })
//             .toArray()
//             .then(products => {
//                 // return [{...p, quantity: 1}, {...p, quantity: 2}]
//                 return products.map(p => {
//                     return {
//                         ...p,
//                         quantity: this.cart.items.find(i => {
//                             return p._id.toString() === i.productId.toString()
//                         }).quantity
//                     }
//                 });
//             })
//             .catch(err => console.log(err));
//     }

//     deleteCartItem(prodId) {
//         const proId = new mongodb.ObjectId(prodId);
//         const updatedCartItem = this.cart.items.filter(item => {
//             return item.productId.toString() !== proId.toString();
//         });

//         const db = getDb();

//         return db
//             .collection('users')
//             .updateOne({
//                 _id: this._id
//             }, {
//                 $set: {
//                     cart: {
//                         items: updatedCartItem
//                     }
//                 }
//             });
//     }


//     addOrder() {
//         const db = getDb();
//         return this
//             .getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: this._id,
//                         name: this.username
//                     }
//                 };

//                 // post order ke db
//                 return db
//                     .collection('orders')
//                     .insertOne(order)
//                     .then(_ => {
//                         this.cart = {
//                             items: []
//                         };
//                     })
//                     .catch(err => console.log(err));
//             })
//             .then(_ => {
//                 // bersihkan cartItems di db
//                 return db
//                     .collection('users')
//                     .updateOne({
//                         _id: this._id
//                     }, {
//                         $set: {
//                             cart: {
//                                 items: this.cart.items
//                             }
//                         }
//                     })
//             })
//             .catch(err => console.log(err));
//     }

//     getOrders() {
//         const db = getDb();

//         return db
//             .collection('orders')
//             .find({
//                 // cara menemukan kriteria pencarian pada path user._Id
//                 'user._id': this._id
//             })
//             .toArray()
//             .then(ordersArray => {
//                 console.log('array of orders => ' + ordersArray);
//                 return ordersArray;
//             })
//             .catch(err => console.log(err));
//     }

//     static findById(userId) {
//         const db = getDb();

//         return db
//             .collection('users')
//             .findOne({
//                 _id: new mongodb.ObjectId(userId)
//             });
//     }
// }

// module.exports = User;