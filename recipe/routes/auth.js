const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/users');

router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error', 'User already exists');
      return res.redirect('/auth/register');
    }
    user = new User({ username, email, password });
    await user.save();
    req.flash('success_msg', 'Registered successfully! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', err.message || 'Error during registration');
    res.redirect('/auth/register');
  }
});

router.get('/login', (req, res) => res.render('login'));

router.post('/login', passport.authenticate('local', {
  successRedirect: '/recipes',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
});

module.exports = router;