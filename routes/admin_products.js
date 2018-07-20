var express = require('express');
var router = express.Router();
var path = require('path');
var { check, validationResult } = require('express-validator/check');
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('./../config/auth');
var isAdmin = auth.isAdmin;

// Get Product Model
var Product = require('./../models/product');
// Get Category Model
var Category = require('./../models/category');

/**
 * Get products index
 */
router.get('/', isAdmin, function(req, res) {
  var count;

  Product.count(function(err, c) {
    count = c;
  });

  Product.find(function(err, products) {
    res.render('admin/products', {
      products: products,
      count: count
    });
  });
});

/**
 * Get add product
 */
router.get('/add-product', isAdmin, function(req, res) {
  var title = "";
  var desc = "";
  var price = "";

  Category.find(function(err, categories) {
    res.render('admin/add_product', {
      title: title,
      desc: desc,
      categories: categories,
      price: price
    });
  });
});

/**
 * Post add product
 */
router.post('/add-product', [
  check('title', 'Title must have a value.').isLength({min: 1}),
  check('desc', 'Description must have a value').isLength({min : 1}),
  check('price', 'Price must have a correct value').isDecimal(),
  check('image', 'You must upload a image').custom((value, { req }) => {
    var filename = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    var extension = (path.extname(filename)).toLowerCase();
    switch(extension) {
      case '.jpg':
        return '.jpg';
      case '.jpeg':
        return '.jpeg';
      case '.png':
        return '.png';
      case '':
        return '.jpg';
      default:
        return false;
    }
  })
], function(req, res) {
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;

  var errors = validationResult(req);

  if (!errors.isEmpty()) {
    Category.find(function(err, categories) {
      res.render('admin/add_product', {
        title: title,
        desc: desc,
        categories: categories,
        price: price,
        errors: errors.array()
      });
    });
  } else {
    Product.findOne({slug: slug}, function(err, product) {
      if(product) {
        req.flash('danger', 'Product title exists, choose another');
        Category.find(function(err, categories) {
          res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price,
          });
        });
      } else {
        imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
        var product = new Product({
          title: title,
          slug: slug,
          desc: desc,
          price: parseFloat(price).toFixed(2),
          category: category,
          image: imageFile
        });

        product.save(function(err) {
          if(err) return console.log(err);

          mkdirp('public/product_images/' + product._id, function(err) {
            return console.log(err);
          });

          mkdirp('public/product_images/' + product._id + '/gallery', function(err) {
            return console.log(err);
          });

          mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function(err) {
            return console.log(err);
          });

          if(imageFile != "") {
            var productImage = req.files.image;
            var uploadPath = 'public/product_images/' + product._id + '/' + imageFile;

            productImage.mv(uploadPath, function(err) {
              return console.log(err);
            });
          }

          req.flash('success', 'Product added!');
          res.redirect('/admin/products');
        });
      }
    });
  }
});

/**
 * Get edit product
 */
router.get('/edit-product/:id', isAdmin, function(req, res) {
  var errors;
  
  if(req.session.errors) errors = req.session.errors;
  req.session.errors = null;
    
  Category.find(function(err, categories) {
    if(err) return console.log(err);

    Product.findById(req.params.id, function(err, p) {
      if(err) {
        console.log(err);
        res.redirect('/admin/products');
      } else {
        var galleryDir = 'public/product_images/' + p._id + '/gallery';
        var galleryImages = null;

        fs.readdir(galleryDir, function(err, files) {
          if(err) {
            console.log(err);
          } else {
            galleryImages = files;

            res.render('admin/edit_product', {
              errors: errors,
              title: p.title,
              desc: p.desc,
              price: parseFloat(p.price).toFixed(2),
              categories: categories,
              category: p.category.replace(/\s+/g, '-').toLowerCase(),
              image: p.image,
              galleryImages: galleryImages,
              id: p._id
            });
          }
        });
      }
    })
  });

});

/**
 * Post edit product
 */
router.post('/edit-product/:id', [
  check('title', 'Title must have a value.').isLength({min: 1}),
  check('desc', 'Description must have a value').isLength({min : 1}),
  check('price', 'Price must have a correct value').isDecimal(),
  check('image', 'You must upload a image').custom((value, { req }) => {
    var filename = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    var extension = (path.extname(filename)).toLowerCase();
    switch(extension) {
      case '.jpg':
        return '.jpg';
      case '.jpeg':
        return '.jpeg';
      case '.png':
        return '.png';
      case '':
        return '.jpg';
      default:
        return false;
    }
  })
], function(req, res) {
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;
  var pimage = req.body.pimage;
  var id = req.params.id;
  var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";


  var errors = validationResult(req);

  if(!errors.isEmpty()) {
    req.session.errors = errors.array();
    res.redirect('/admin/product/edit-product/' + id);
  } else {
    Product.findOne({slug: slug, _id: {'$ne':id}}, function(err, p) {
      if(err) {
        console.log(err);
      }

      if(p) {
        req.flash('danger', 'Product title exists, choose another.');
        res.redirect('/admin/product/edit-product/' + id);
      } else {
        Product.findById(id, function(err, p) {
          if(err) return console.log(err);

          p.title = title;
          p.slug = slug;
          p.desc = desc;
          p.price = parseFloat(price).toFixed(2);
          p.category = category;
          if(imageFile != "") {
            p.image = imageFile;
          }

          p.save(function(err) {
            if(err) return console.log(err);
          });

          if(imageFile != "") {
            if(pimage != "") {
              fs.remove('public/product_images/' + id + '/' + pimage, function(err) {
                if(err) return console.log(err);
              })
            }

            var productImage = req.files.image;
            var uploadPath = 'public/product_images/' + id + '/' + imageFile;

            productImage.mv(uploadPath, function(err) {
              return console.log(err);
            });
          }

          req.flash('success', 'Product updated!');
          res.redirect('/admin/products/edit-product/' + id);
        });
      }
    });
  }
});

/**
 * Post product gallery
 */
router.post('/product-gallery/:id', function(req, res) {
  var productImage = req.files.file;
  var id = req.params.id;
  var galleryPath = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
  var thumbPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

  productImage.mv(galleryPath, function(err) {
    if(err) return console.log(err);

    resizeImg(fs.readFileSync(galleryPath), {width: 100, height: 100})
      .then(function(buf) {
        fs.writeFileSync(thumbPath, buf);
      });
  });

  res.sendStatus(200);

});

/**
 * Get delete gallery image
 */
router.get('/delete-image/:image', isAdmin, function(req, res) {
  var galleryPath = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
  var thumbPath = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

  fs.remove(galleryPath, function(err) {
    if(err) {
      console.log(err);
    } else {
      fs.remove(thumbPath, function(err) {
        if(err) {
          console.log(err);
        } else {
          req.flash('success', 'Gallery Image deleted!');
          res.redirect('/admin/products/edit-product/' + req.query.id);
        }
      })
    }
  });
});

/**
 * Get delete product
 */
router.get('/delete-product/:id', isAdmin, function(req, res) {
  var id = req.params.id;
  var productPath = 'public/product_images/' + id;

  fs.remove(productPath, function(err) {
    if(err) {
      console.log(err);
    } else {
      Product.findByIdAndRemove(id, function(err) {
        if(err) return console.log(err);
      });

      req.flash('success', 'Product deleted!');
      res.redirect('/admin/products');
    }
  });
});
// Exports
module.exports = router;