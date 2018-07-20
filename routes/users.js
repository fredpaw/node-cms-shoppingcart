var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator/check');

var User = require('./../models/user');

/**
 * Get register
 */
router.get('/register', function(req, res) {
  res.render('register', {
    title: 'Register'
  });
});

/**
 * post register
 */
router.post('/register', [
  check('name', 'Name is required.').isLength({min: 1}),
  check('email', 'Email not valid.').isEmail(),
  check('username', 'Username is required.').isLength({min: 1}),
  check('password', 'Password is required.').isLength({min: 1}),
  check('password2', 'Password is not match.').custom((value, {req}) => value === req.body.password)
], function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;

  var errors = validationResult(req);

  if(!errors.isEmpty()) {
    res.render('register', {
      title: 'Register',
      user: null,
      errors: errors.array()
    });
  } else {
    User.findOne({username: username}, function(err, user) {
      if(err) return console.log(err);

      if(user) {
        req.flash('danger', 'Username existed, choose another.');
        res.redirect('/users/register');
      } else {
        var user = new User({
          name: name,
          email: email,
          username: username,
          password: password,
          admin: 0
        });

        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return console.log(err);

            user.password = hash;

            user.save(function(err) {
              if(err) {
                console.log(err);
              } else {
                req.flash('success', 'Your are now registered');
                res.redirect('/users/login');
              }
            });
          });
        });
      }
    });
  }
});


/**
 * Get login
 */
router.get('/login', function(req, res) {
  if(res.locals.user) {
    res.redirect('/');
  } else {
    res.render('login', {
      title: 'Login'
    });
  }
});

/**
 * Post login
 */
router.post('/login', function(req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

/**
 * Get logout
 */
router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success', 'Your are successful logout.');
  res.redirect('/users/login');
});

// Exports
module.exports = router;