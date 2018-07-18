var express = require('express');
var router = express.Router();
var { check, validationResult, body } = require('express-validator/check');

// Get Page Model
var Page = require('./../models/page');

/**
 * Get pages index
 */
router.get('/', function(req, res) {
  Page.find({}).sort({sorting: 1}).exec(function(err, pages) {
    res.render('admin/pages', {
      pages: pages
    })
  });
});

/**
 * Get add page
 */
router.get('/add-page', function(req, res) {
  var title = "";
  var slug = "";
  var content = "";

  res.render('admin/add_page', {
    title: title,
    slug: slug,
    content: content
  });
});

/**
 * Post add page
 */
router.post('/add-page', [
  check('title', 'Title must have a value.').isLength({min: 1}),
  check('content', 'Content must have a value').isLength({min : 1})
], function(req, res) {
  var title = req.body.title;
  var content = req.body.content;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if(slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();

  var errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('admin/add_page', {
      title: title,
      slug: slug,
      content: content,
      errors: errors.array(),
    });
  } else {
    Page.findOne({slug: slug}, function(err, page) {
      if(page) {
        req.flash('danger', 'Page slug exists, choose another');
        res.render('admin/add_page', {
          title: title,
          slug: slug,
          content: content,
        });
      } else {
        var page = new Page({
          title: title,
          slug: slug,
          content: content,
          sorting: 100
        });

        page.save(function(err) {
          if(err) return console.log(err);

          req.flash('success', 'Page added!');
          res.redirect('/admin/pages');
        });
      }
    });
  }
});

/**
 * Post reorder pages
 */
router.post('/reorder-pages', function(req, res) {
  var ids = req.body['id[]'];

  var count = 0;

  for(var i = 0; i < ids.length; i++) {
    var id = ids[i];
    count++;
    
    (function(count) {
      Page.findById(id, function(err, page) {
        page.sorting = count;
        page.save(function(err) {
          if(err) return console.log(err);
        });
      });
    })(count);
  }
});

/**
 * Get edit page
 */
router.get('/edit-page/:slug', function(req, res) {
  Page.findOne({slug: req.params.slug}, function(err, page) {
    if(err) return console.log(err);
    
    res.render('admin/edit_page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
      id: page._id
    });
  });

});

/**
 * Post edit page
 */
router.post('/edit-page/:slug', [
  check('title', 'Title must have a value.').isLength({min: 1}),
  check('content', 'Content must have a value').isLength({min : 1})
], function(req, res) {
  var title = req.body.title;
  var content = req.body.content;
  var id = req.body.id;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if(slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();

  var errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('admin/edit_page', {
      title: title,
      slug: slug,
      content: content,
      id: id,
      errors: errors.array(),
    });
  } else {
    Page.findOne({slug: slug, _id: {'$ne': id}}, function(err, page) {
      if(page) {
        req.flash('danger', 'Page slug exists, choose another');
        res.render('admin/edit_page', {
          title: title,
          slug: slug,
          content: content,
          id: id
        });
      } else {
        Page.findById(id, function(err, page) {
          if(err) return console.log(err);

          page.title = title;
          page.slug = title;
          page.content = content;

          page.save(function(err) {
            if(err) return console.log(err);
  
            req.flash('success', 'Page updated!');
            res.redirect('/admin/pages/edit-page/' + page.slug);
          });
        });
      }
    });
  }
});

/**
 * Get delete page
 */
router.get('/delete-page/:id', function(req, res) {
  Page.findByIdAndRemove(req.params.id, function(err) {
    if(err) return console.log(err);

    req.flash('success', 'Page deleted!');
    res.redirect('/admin/pages');
  });
});

// Exports
module.exports = router;