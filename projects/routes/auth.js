const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// REGISTER FORM
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// REGISTER POST
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.status(400).send("Greška pri registraciji");
    }
});

// LOGIN FORM
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// LOGIN POST
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.send("Neispravno korisničko ime");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Neispravna lozinka");

    req.session.user = {
        id: user._id,
        username: user.username
    };

    res.redirect('/projects');
});

// LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
