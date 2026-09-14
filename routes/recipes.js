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
  const query = (req.query.q || '').trim();
  const filter = query
    ? { $or: [{ title: { $regex: query, $options: 'i' } }, { ingredients: { $regex: query, $options: 'i' } }] }
    : {};
  try {
    const recipes = await Recipe.find(filter).populate('author', 'username').sort({ createdAt: -1 });
    res.render('recipes/index', { recipes, query });
  } catch (err) {
    req.flash('error', 'Recipes could not be loaded right now.');
    res.render('recipes/index', { recipes: [], query });
  }
});

// New Recipe Form
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('recipes/new');
});

// Create Recipe
router.post('/', ensureAuthenticated, async (req, res) => {
  const title = (req.body.title || '').trim();
  const instructions = (req.body.instructions || '').trim();
  const ingredientArray = (req.body.ingredients || '').split(',').map(item => item.trim()).filter(Boolean);
  if (!title || !instructions || !ingredientArray.length) {
    req.flash('error', 'Add a title, at least one ingredient, and the cooking method.');
    return res.redirect('/recipes/new');
  }
  try {
    await Recipe.create({ title, ingredients: ingredientArray, instructions, author: req.user._id });
    req.flash('success_msg', 'Your recipe has been added to the table.');
    res.redirect('/recipes');
  } catch (err) {
    req.flash('error', 'Your recipe could not be saved. Please try again.');
    res.redirect('/recipes/new');
  }
});

module.exports = router;
