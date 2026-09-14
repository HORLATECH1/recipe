require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const passport = require('passport');
const flash = require('connect-flash');
const connectDB = require('./config/db');

connectDB();
require('./config/passport')(passport);

const app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global Template Variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.error = req.flash('error');
  res.locals.success_msg = req.flash('success_msg');
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/recipes', require('./routes/recipes'));
app.get('/', (req, res) => res.redirect('/recipes'));

module.exports = app;