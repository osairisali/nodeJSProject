const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');

// SETTING CONSTANTS DB
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ddce4.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

// setting untuk multer
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        // simpan file dengan cara begini
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// routes
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/auth');

// error controller
const errorController = require('./controllers/error');

//  model
const User = require('./models/user');
// console.log(`class User yang diimport adalah berikut ------> ${User}`);

//  app dari express
const app = express();

//  csrf protection; ada beberapa opsi untuk ini, pelajari di doc-nya
const csrfProtection = csrf();

//  setup db untuk sessions
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

//  settings
app.set('view engine', 'ejs');

app.set('views', 'views');

app.use(bodyParser.urlencoded({
    extended: false
}));

// single('image') menyesuaikan dgn views field input <input type="file" name="image" id="image">
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'));
// app.use(multer({dest: 'images'}).single('image'));

//  setting untuk page styling
app.use(express.static(path.join(__dirname, 'public')));

// setting untuk serve images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

//  gunakan csrfProtection untuk app views stlh mount session ke app
app.use(csrfProtection);

//  session flash untuk tampilan error yg disimpan dlm session secara sementara (flash)
app.use(flash());

//  csrf protection dan otentikasi untuk seluruh views, penempatan hrs sebelum penempelan session & routes
app.use((req, res, next) => {
    //  locals adh properti res untuk semua views. ini diaksesnya langsung oleh page ejs
    res.locals.isAuthenticated = req.session.isLoggedIn;
    // mounting app.use(csrfProtection) akan membuat object function req.csrfToken()
    res.locals.csrfToken = req.csrfToken();
    //  jgn lupa panggil next() untuk lanjut ke middleware berikutnya
    next();
});

//  masukkan object user yg berupa mongoose model, menurut session user yg telah terotorisasi
//  dgn demikian, user-defined method pada document user seperti addToCart(), dll akan dpt dijalankan & persistent
//  pada semua request yg terotorisasi menurut session user loggedIn.
app.use((req, res, next) => {
    // console.log(req.session);
    if (!req.session.user) {
        return next();
    }

    User.findById(req.session.user._id)
        .then(user => {
            // tempel user model jk sdh logged in (req.session.user ada isinya yg sesuai)
            req.user = user;
            return next();
        })
        .catch(err => console.log(err));
});

//  middlewares
app.use(loginRoutes);
app.use('/admin', adminRoutes);
app.use(shopRoutes);
// app.use(loginRoutes);

// perlindungan pada header
app.use(helmet());
// compression untuk meringkas ukuran js maupun css pada server
app.use(compression());
// write log pada console ke file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
    flags: 'a'
});
app.use(morgan('combined', {
    stream: accessLogStream
}))

app.get('/500', errorController.get500);

app.use(errorController.pageNotFound);

// app.use((req, res, next) => {
//     res.status(404).render('404', {
//         pageTitle: 'error page',
//         path: '/error'
//     });
// });

// special error middleware, jk terjadi error pada blok catch() yg artinya terjadi technical error
// middleware ini menangkan next(error) yg disertai dengan error
// untuk middleware lainnya jgn gunakan arg error ini, krn ini sbg identifier untuk 
// middleware yg khusus menangani error
// app.use((error, req, res, next) => {
//     // ambil status code yg ditempelkan di objek error pada next(error)
//     // res.status(error.httpStatusCode).render('500', {
//     //     pageTitle: 'Page Not Found',
//     //     path: null
//     // });

//     res.redirect('/500');
// });

console.log(`node server is running on ${process.env.NODE_ENV}`);

//  ignition!
mongoose.connect(MONGODB_URI)
    .then(result => {
        return app.listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));