var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');

var projectsRouter = require('./routes/projects');
var authRouter = require('./routes/auth');

var app = express();

// ---------------------------
// MongoDB
// ---------------------------
mongoose.connect('mongodb://127.0.0.1:27017/projectsdb')
    .then(() => console.log("✔ MongoDB connected"))
    .catch(err => console.error(err));

// ---------------------------
// view engine
// ---------------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // koristi views/layout.ejs

// ---------------------------
// middleware
// ---------------------------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// ---------------------------
// session
// ---------------------------
app.use(session({
    secret: 'tajna-lozinka',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/projectsdb'
    })
}));

// globalna varijabla za viewove (currentUser)
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    next();
});

// ---------------------------
// routes
// ---------------------------

// Redirect root na /projects
app.get('/', (req, res) => res.redirect('/projects'));

// auth rute
app.use('/', authRouter);

// projects rute
app.use('/projects', projectsRouter);

// ---------------------------
// catch 404
// ---------------------------
app.use(function(req, res, next) {
    next(createError(404));
});

// ---------------------------
// error handler
// ---------------------------
app.use(function(err, req, res, next) {
    // locals
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
