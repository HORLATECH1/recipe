const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/users');
const { sendVerificationCode } = require('../config/email');

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error', user.isVerified ? 'User already exists' : 'This email is awaiting verification');
      return res.redirect('/auth/register');
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    user = new User({ username, email, password, isVerified: false });
    user.otpHash = hashOtp(verificationCode);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationCode(email, verificationCode);
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });
      throw emailError;
    }

    req.session.pendingVerificationEmail = email;
    req.flash('success_msg', 'We sent a verification code to your email.');
    res.redirect('/auth/verify');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', err.message || 'Error during registration');
    res.redirect('/auth/register');
  }
});

router.get('/verify', (req, res) => {
  const email = req.session.pendingVerificationEmail || req.query.email || '';
  res.render('verify', { email });
});

router.post('/verify', async (req, res) => {
  const email = (req.body.email || req.session.pendingVerificationEmail || '').trim().toLowerCase();
  const code = (req.body.otp || '').trim();

  try {
    const user = await User.findOne({ email });
    const isValid = user && user.otpHash && user.otpExpiresAt > new Date() && user.otpHash === hashOtp(code);
    if (!isValid) {
      req.flash('error', 'That verification code is invalid or has expired.');
      return res.render('verify', { email });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    delete req.session.pendingVerificationEmail;
    req.flash('success_msg', 'Email verified successfully. Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Verification error:', err);
    req.flash('error', 'Verification could not be completed. Please try again.');
    res.render('verify', { email });
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