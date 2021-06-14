let filteredProducts = [];

const cart = [{
    _id: '5f14209845622a3fa4d1dfb0',
    productId: {
        _id: '5f133b202e16a10f8165e587',
        title: 'book of alchemist',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg',
        description: 'lalalala kakean cangkem',
        price: 500,
        userId: '5f06a2f75cafe81e174b1622',
        __v: 0
    },
    quantity: 1
}];

const db = [{
        _id: '5f133b202e16a10f8165e587',
        title: 'book of alchemist',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg',
        description: 'lalalala kakean cangkem',
        price: 500,
        userId: '5f06a2f75cafe81e174b1622',
        __v: 0
    },
    {
        _id: '5f13f8669a4c782e707ab11e',
        title: 'book of nisa test',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Gutenberg_Bible%2C_Lenox_Copy%2C_New_York_Public_Library%2C_2009._Pic_01.jpg',
        description: 'a325rqewaf',
        price: 99,
        userId: '5f0809607581fd213c72301e',
        __v: 0
    }
];

// fungsi filter produk
const filterProdFun = (id) => {
    return db.filter(item => {
        console.log(item);
        return item._id.toString() === id.toString();
    });
};

console.log(cart.filter(item => {
    return filterProdFun(item.productId._id);
}))

console.log(cart.filter(item => {
    return db.filter(e => {
        return e._id === item.productId._id;
    })
}));

