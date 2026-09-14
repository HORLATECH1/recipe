const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe');

// Auth Guard Middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in to view this page');
  res.redirect('/auth/login');
}

// Get All Recipes
router.get('/', async (req, res) => {
  const recipes = await Recipe.find().populate('author', 'username');
  res.render('recipes/index', { recipes });
});

// New Recipe Form
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('recipes/new');
});

// Create Recipe
router.post('/', ensureAuthenticated, async (req, res) => {
  const { title, ingredients, instructions } = req.body;
  const ingredientArray = ingredients.split(',').map(item => item.trim());

  await Recipe.create({
    title,
    ingredients: ingredientArray,
    instructions,
    author: req.user._id
  });

  res.redirect('/recipes');
});

module.exports = router;