const session = require('express-session');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

// Uvoz ruta
var projectsRouter = require('./routes/projects');
var authRouter = require('./routes/auth');

var app = express();

// ---------------------------
// 1. MongoDB Konekcija
// ---------------------------
mongoose.connect('mongodb://127.0.0.1:27017/projectsdb')
    .then(() => console.log("✔ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// ---------------------------
// 2. View Engine Postavke
// ---------------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Koristi views/layout.ejs kao bazu

// ---------------------------
// 3. Middleware
// ---------------------------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Omogućuje PUT i DELETE metode kroz HTML forme (koristeći ?_method=)
app.use(methodOverride('_method'));

// ---------------------------
// 4. Session Konfiguracija
// ---------------------------
app.use(session({
    secret: 'tajna-lozinka',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/projectsdb'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 sata traje sesija
}));

// ---------------------------
// 5. Globalne Varijable za View-ove
// ---------------------------
// Ovaj middleware prosljeđuje currentUser u SVAKI .ejs file automatski
app.use((req, res, next) => {
    // Važno: provjeri sprema li tvoj auth.js korisnika u req.session.user
    res.locals.currentUser = req.session.user || null;
    next();
});

// ---------------------------
// 6. Rute
// ---------------------------

// Redirect root na /projects
app.get('/', (req, res) => res.redirect('/projects'));

// Auth rute (login, register, logout)
app.use('/', authRouter);

// Projects rute (CRUD, timovi, arhiva)
app.use('/projects', projectsRouter);

// ---------------------------
// 7. Error Handling
// ---------------------------

// Catch 404
app.use(function(req, res, next) {
    next(createError(404));
});

// Globalni error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;