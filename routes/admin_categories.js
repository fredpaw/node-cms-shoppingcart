var express = require('express');
var router = express.Router();
var { check, validationResult } = require('express-validator/check');

// Get Category Model
var Category = require('./../models/category');

/**
 * Get categories index
 */
router.get('/', function(req, res) {
  Category.find(function(err, categories) {
    if(err) console.log(err);

    res.render('admin/categories', {
      categories: categories
    });
  });
});

/**
 * Get add category
 */
router.get('/add-category', function(req, res) {
  var title = "";

  res.render('admin/add_category', {
    title: title
  });
});

/**
 * Post add category
 */
router.post('/add-category', [
  check('title', 'Title must have a value.').isLength({min: 1})
], function(req, res) {
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();

  var errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('admin/add_category', {
      title: title,
      errors: errors.array(),
    });
  } else {
    Category.findOne({slug: slug}, function(err, category) {
      if(category) {
        req.flash('danger', 'Category title exists, choose another');
        res.render('admin/add_category', {
          title: title
        });
      } else {
        var category = new Category({
          title: title,
          slug: slug
        });

        category.save(function(err) {
          if(err) return console.log(err);

          req.flash('success', 'Category added!');
          res.redirect('/admin/categories');
        });
      }
    });
  }
});

/**
 * Get edit category
 */
router.get('/edit-category/:id', function(req, res) {
  Category.findById(req.params.id, function(err, category) {
    if(err) return console.log(err);
    
    res.render('admin/edit_category', {
      title: category.title,
      id: category._id
    });
  });

});

/**
 * Post edit category
 */
router.post('/edit-category/:id', [
  check('title', 'Title must have a value.').isLength({min: 1})
], function(req, res) {
  var title = req.body.title
  var id = req.params.id;
  var slug = title.replace(/\s+/g, '-').toLowerCase();

  var errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('admin/edit_category', {
      title: title,
      id: id,
      errors: errors.array()
    });
  } else {
    Category.findOne({slug: slug, _id: {'$ne': id}}, function(err, category) {
      if(category) {
        req.flash('danger', 'Category title exists, choose another');
        res.render('admin/edit_category', {
          title: title,
          id: id
        });
      } else {
        Category.findById(id, function(err, category) {
          if(err) return console.log(err);

          category.title = title;
          category.slug = title;

          category.save(function(err) {
            if(err) return console.log(err);
  
            req.flash('success', 'category updated!');
            res.redirect('/admin/categories/edit-category/' + id);
          });
        });
      }
    });
  }
});

/**
 * Get delete category
 */
router.get('/delete-category/:id', function(req, res) {
  Category.findByIdAndRemove(req.params.id, function(err) {
    if(err) return console.log(err);

    req.flash('success', 'Category deleted!');
    res.redirect('/admin/categories');
  });
});

// Exports
module.exports = router;