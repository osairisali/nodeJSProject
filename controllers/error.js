exports.pageNotFound = (req, res, next) => {
    // const isLogin = req.get('Cookie').split('=')[1];
    res
        .status(404)
        .render('404', {
            pageTitle: 'Page Not Found',
            path: null
        });
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Page Not Found',
        path: null
    });
};