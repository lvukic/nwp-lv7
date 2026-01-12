// middleware/isAuth.js
module.exports = function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login'); // redirect ako nije prijavljen
    }
    next();
};
