// clean semua image yang tidak ada di db pada fs

const mongoose = require('mongoose');
const Product = require('../models/product');
const fs = require('fs');


// SETTING CONSTANTS DB
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${PROCESS.ENV.MONGO_PASSWORD}@cluster0-ddce4.mongodb.net/shop`;

mongoose
    .connect(MONGODB_URI)
    .then(connected => {
        console.log(`clean-image connected to db -> ${connected}`);
        Product
            .find()
            .then(products => {
                console.log(`products di db -> ${products}`);

                // filter gambar yang tidak ada di db pada fs
                let imagesDB = [];
                fs.readdir('./images', (err, images) => {
                    if (err) {
                        throw err;
                    }

                    // gambar yg ada di fs
                    const imagesFS = images;
                    console.log(`images in fs -> ${imagesFS}`);

                    // gambar yg ada di db
                    products.forEach(prod => {
                        imagesDB.push(prod.imageUrl);
                    });

                    // pembersihan gambar yg ada di db dari 'images/'
                    const trimImgDB = imagesDB.map(el => {
                        return el.slice(7);
                    });

                    console.log(`imagesDB -> ${imagesDB}`);
                    // console.log(`trimImgDB -> ${trimImgDB}`);

                    // filtering
                    const filteredImage = imagesFS.filter(image => {
                        return trimImgDB.indexOf(image) === -1;
                    })

                    console.log(`gambar yang dihapus -> n\ ${filteredImage}`);

                    // penghapusan
                    filteredImage.forEach(el => {
                        fs.unlink(`./images/${el}`, err => {
                            if (err) {
                                console.log(err);
                                throw err;
                            }
                            console.log('gambar berhasil difilter!');
                        });
                    })

                    // buatkan promise yg jika semua loop penghapusan selesai, maka destroy connection
                });
            })
            .catch(err => console.log(err));
    })
    .catch(err => console.log(err));

// mongoose.connection.close();


const dtFS = [
    '2020-08-31T00:56:36.200Z-1036636.png', '2020-08-31T00:57:11.038Z-darling-int-the-franxx.png',
    '2020-08-31T00:57:23.218Z-darling-int-the-franxx.png', '2020-08-31T00:58:11.254Z-wp4366633-sewayaki-kitsune-no-senko-san-wallpapers.png',
    '2020-08-31T01:02:58.903Z-nasa-V4ZksNimxLk-unsplash (copy).jpg',
    '2020-08-31T01:04:25.335Z-nasa-V4ZksNimxLk-unsplash.jpg', '2020-08-31T01:06:52.882Z-nasa-V4ZksNimxLk-unsplash.jpg',
    '2020-08-31T01:07:39.556Z-nasa-V4ZksNimxLk-unsplash (copy).jpg', '2020-08-31T01:08:25.444Z-nasa-V4ZksNimxLk-unsplash.jpg',
    '2020-08-31T01:08:55.717Z-darling-int-the-franxx (copy).png', '2020-08-31T01:11:21.980Z-darling-int-the-franxx (copy).png',
    '2020-08-31T01:14:46.952Z-nasa-V4ZksNimxLk-unsplash.jpg'
];

const dtDB = [
    'images/2020-08-31T00:56:36.200Z-1036636.png',
    'images/2020-08-31T00:57:23.218Z-darling-int-the-franxx.png',
    'images/2020-08-31T00:58:11.254Z-wp4366633-sewayaki-kitsune-no-senko-san-wallpapers.png',
    'images/2020-08-31T01:14:46.952Z-nasa-V4ZksNimxLk-unsplash.jpg'
];

// dtDB harus di-trim terlebih dahulu dari images/
// const trimDtDB = [];

// dtDB.forEach(el => {
//     trimDtDB.push(el.slice(7));
// });

// console.log(trimDtDB);

// // filter gambar yang tidak ada di db pada fs
// const filteredImage = dtFS.filter(image => {
//     return trimDtDB.indexOf(image) === -1;
// })

// console.log(filteredImage);

// // hapus gambar yg difilter
// dtDB.forEach(el => {
//     fs.unlink(el, err => {
//         console.log(err);
//     });
// });