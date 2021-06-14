const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

const bcrypt = require('bcryptjs');

const User = require('../models/user');

//  import check func untuk validasi email
const {
    check,
    body
} = require('express-validator/check');

router.get('/login', authController.getLogin);

router.post('/login', [
    body('email')
    .isEmail()
    .withMessage('Please enter valid email')
    // normalizeemail() menghilangkan dot sebelum nama domain email
    // .normalizeEmail()
    .custom((email, {req}) => {
        return User
            .findOne({email: email})
            .then(user => {
                if(!user) {
                    return Promise.reject('No email found!');
                };

                // return true;
            });
    }),
    body('password')
    .isLength({min: 5})
    .withMessage('password typed less than 5 character')
    .trim()
    .custom((password, { req }) => {
        // console.log(req.body.email);
        return User
            .findOne({
                email: req.body.email
            })
            .then(user => {
                // jika user tdk ditemukan
                // console.log(user);
                if (!user) {
                    return Promise.reject('Email address not found!')
                }

                // jika password tdk sesuai
                return bcrypt
                    .compare(password, user.password)
                    .then(doMatch => {
                        if (!doMatch) {
                            return Promise.reject('Invalid password');
                            // throw new Error('Invalid password (from validator');
                        }
                        return true;
                    })

            });
    })
], authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignUp);

// validasi email dgn check('name of field to check'); name dari input field
// router validasi bisa di-wrap dalam array
router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter valid email address')
        // .normalizeEmail()
        .custom((value, { req }) => {
            // custome validation ini expect return error message
            if (value === 'test@test.com') {
                throw new Error('This email address is forbidden');
            };

            // validasi apakah email sdh ada (secara async)
            return User
                .findOne({
                    email: value
                })
                .then(userDoc => {

                    // cocokkan email dgn db (apakah sdh ada)
                    // jangan dikasih catch block di sini, nanti errornya ketangkep di catch block,
                    // jadinya malah rejection nggak kebaca ke validator.
                    if (userDoc) {
                        // jk ketemu, langsung kirim error rejection dgn Promise
                        return Promise.reject('Email already exist. Please pick another email address!');
                    }
                });
        }),
        body('password', 'Please enter minimum 5 alphanumeric password')
        .isLength({
            min: 5
        })
        .isAlphanumeric()
        .trim(),
        body('passwordVerification')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords must be match!');
            }

            // di akhir validator paling tidak harus return true jk semua validasi lolos
            return true;
        })
    ],
    authController.postSignUp);

router.get('/reset', authController.getResetPassword);

router.post('/reset', authController.postResetPassword);

router.get('/new-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword)

module.exports = router;