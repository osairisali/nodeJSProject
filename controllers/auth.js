const User = require("../models/user");

const bcrypt = require("bcryptjs");

const crypto = require("crypto");

// import validation function
const { validationResult } = require("express-validator/check");

//  mailing service
const nodemailer = require("nodemailer");
// const sendgridTransport = require('nodemailer-sendgrid-transport');

// sendgridTransport({auth:...}) akan return konfigurasi yg digunakan u/ krm email melalui transporter
// spesifikasi auth tdk hanya pd api_key, tp bs juga menggunakan email & password yg terdaftar di sendgrid
const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: `${process.env.NODEMAILE_USER}`,
    pass: `${process.env.NODEMAILE_PASS}`,
  },
});

exports.getSignUp = (req, res, next) => {
  // console.log(req.session.isLoggedIn);

  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/signup", {
    pageTitle: "Signup Page",
    path: "/signup",
    error: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // console.log(email, password);

  const confirmPassword = req.body.password2;

  // ambil semua error yg dimasukkan ke req dari validator di router
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // console.log(errors.array());
    // bales dgn respon
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup Page",
      path: "/signup",
      error: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.passwordVerification,
      },
    });
  }

  // jk tdk ada email yg cocok di db, maka encrypt password untuk email baru
  // salt 12 anggapan umum cycle encryption yg aman
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      // regiter email baru ke db dgn pass terenkripsi
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: [],
        },
      });

      return user.save();
    })
    .then((result) => {
      const mailOptions = {
        from: `${process.env.NODEMAILER_ADDRESS}`,
        to: email,
        subject: "Nice Nodemailer test",
        text: "Hey there, it’s our first message sent with Nodemailer ",
        html:
          '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br /><img src="cid:uniq-mailtrap.png" alt="mailtrap" />',
      };
      res.redirect("/login");
      return transporter
        .sendMail(mailOptions)
        .then((success) => {
          console.log("Success sending email ", success.messageId);
        })
        .catch((error) => console.log(error));
    })
    .catch((err) => console.log(err));
};

exports.getLogin = (req, res, next) => {
  // ambil data cookie login
  // const isLogin = req.get('Cookie').split('=')[1] === true;
  // console.log(req.session.isLoggedIn);

  // untuk memastikan bahwa empty array dr req.flash tdk muncul (krn hasilnya adalah truthful)
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    pageTitle: "Login Page",
    path: "/login",
    // tampilkan error ke page view jika terdeteksi
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

// postLogin tanpa autentikasi bcrypt
// exports.postLogin = (req, res, next) => {
//     // pasang cookie loggedIn dan HttpOnly ke browser user
//     // HttpOnly membuat cookie tdk dpt muncul di browser client, shg tdk dapat dimanipulasi.
//     // pada browser developer masih bisa diakses cookie ini melalui browser.
//     // res.setHeader('Set-Cookie', 'loggedIn=true; HttpOnly');
//     // cookie digunakan untuk menyimpan info bahwa user sdh login & akan hilang ketika browser ditutup.
//     // menggunakan req.login = true tdk akan berjalan, jk ada perintah res.redirect setelahnya.
//     // lihat perbedaannya dgn req.user di app.js, yg tdk ada perintah respond setelahnya, shg bs gunakan
//     // object user yg ditempelkan ke req di semua router di app.js.

//     // session dgn pack express-session
//     // object session sdh tersimpan di req otomatis dr package-nya
//     User.findById('5e8f133f992a1b3b9262bfc8')
//         .then(user => {
//             // beda dgn penjelasan cookie di atas, penggunaan session yg ditempel ke req akan berjalan terus
//             // pada seluruh req, shg pemanggilan res.redirect tdk akan menghilangkan object req.session.
//             req.session.isLoggedIn = true;
//             // di sini, session hanya menyimpan user sbg data di db mongoo, bukan sbg mongoose model, jd fungsi2 seperti populate
//             // tdk bisa dijalankan. Lihat di app js untuk berikutnya.
//             req.session.user = user;
//             // console.log(req.session.user);
//             // next();
//             // untuk memastikan res.redirect hanya dijalankan ketika session telah benar2 terbentuk
//             req.session.save(err => {
//                 console.log(err);
//                 res.redirect('/');
//             });
//         })
//         .catch(err => console.log(err));
// };

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  // console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login Page",
      path: "/login",
      // tampilkan error ke page view jika terdeteksi
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({
    email: email,
  })
    // findOne menghasilkan doc, bukan query
    .then((user) => {
      // jika user tdk ditemukan
      if (!user) {
        //  buat session flash berupa key=error, dan error message-nya untuk ditampilkan ke page view
        req.flash("error", "Invalid email or password!");
        return res.redirect("/login");
      }

      // jika user ditemukan, bandingkan password dgn pass user di db
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          // jika perbandingan pass lolos, masukkan session
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              // langsung redirect ke landing page dgn user session yg valid
              res.redirect("/");
            });
          }
          // jika password tdk lolos perbandingan
          // perhatikan bahwa ini tdk perlu return, agar langsung dieksekusi errornya
          // req.flash juga didahulukan sebelum redirect agar error dicatatkan dulu ke session
          req.flash("error", "Invalid email or password!");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((error) => {
    // console.log(error);
    res.redirect("/login");
    // req.user masih ada. apakah aman???
    // sepertinya msh aman, sepanjang di routes ada auth menurut keberadaan session
    console.log(req.user);
  });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    pageTitle: "Reset Password Page",
    path: "/reset",
    // tampilkan error ke page view jika terdeteksi
    errorMessage: message,
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;

  // crypto tdk return promise, jadi pake callback
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");

    // Perhatikan klo pake fungsi bawaan mongoose harus pake Model, seperti User untuk pakai fungsi
    // findOne() atau findById(), dll.
    // Untuk pake user defined method dalam instance Model (atau juga disebut document), seperti
    // addToCart() dll gunakan instance model yg tertempel di req.user contohnya.
    // Instance model atau document nama lainnya gak bisa akses fungsi bawaan mongoose seperti find(),
    // findOne(), dll.
    User.findOne({
      email: email,
    })
      .then((user) => {
        if (!user) {
          req.flash("error", "No email found!");
          return res.redirect("/reset");
        }
        // console.log(user);
        // set resetToken ke db
        user.resetToken = token;
        // set expiration token selama 1 jam kemudian (satuan dalam milisecond)
        user.resetTokenExpiration = Date.now() + 3600000;

        // ojok lali disave rek, mesisan redirect ke login
        // cara gini menghindari error ketika email tidak ditemukan shg redirect ke '/reset'
        return user
          .save()
          .then((result) => {
            // kirim email token reset sekaligus langsung redirect
            res.redirect("/login");
            transporter
              .sendMail({
                from: `${process.env.NODEMAILER_ADDRESS}`,
                to: email,
                subject: "Reset Token Email Test",
                html: `
                            <p> follow this <a href="localhost:3000/new-password/${token}">link</a> to reset your password </p>
                        `,
              })
              .then((success) => {
                console.log("success sending reset email! ", success.messageId);
                return;
              })
              .catch((error) => {
                console.log("unable to send email: ", error);
              });
          })
          .catch((err) => {
            const errorLog = new Error(err);
            errorLog.httpStatusCode = 500;
            return next(errorLog);
          });
      })
      .catch((err) => {
        const errorLog = new Error(err);
        errorLog.httpStatusCode = 500;
        return next(errorLog);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: {
      $gt: Date.now(),
    },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      return res.render("auth/new-password", {
        pageTitle: "New Password Page",
        path: "/new-password",
        // tampilkan error ke page view jika terdeteksi
        errorMessage: message,
        userId: user._id.toString(),
        token: token,
      });

      // return res.redirect("/reset");
    })
    .catch((err) => {
      const errorLog = new Error(err);
      errorLog.httpStatusCode = 500;
      return next(errorLog);
    });
};

exports.postNewPassword = (req, res, next) => {
  const token = req.body.token;
  const userId = req.body.userId;
  const newPassword = req.body.password;
  console.log("new pass: ", newPassword);

  // let newUser;

  User.findOne({
    _id: userId,
    resetToken: token,
    resetTokenExpiration: {
      $gt: Date.now(),
    },
  })
    .then((user) => {
      // pake callback aja juga bisa
      return bcrypt.hash(newPassword, 12, (err, hash) => {
        if (err) {
          console.log(err);
          return err;
        }
        user.password = hash;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;

        return user.save();
      });
      // newUser = user;
      // return bcrypt.hash(newPassword, 12);
    })
    // .then(hash => {
    //     newUser.resetTokenExpiration = undefined;
    //     newUser.resetToken = undefined;
    //     newUser.password = hash;

    //     res.redirect('/login');
    // })
    .then((success) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const errorLog = new Error(err);
      errorLog.httpStatusCode = 500;
      return next(errorLog);
    });
};
