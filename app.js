var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var dbconfig = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var passport = require('passport');

// Connect to DB
mongoose.connect(dbconfig.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Initial app
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set global erros variables
app.locals.errors = null;

// Get Page Model
var Page = require('./models/page');

// Get all pages and pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function(err, pages) {
  if(err) {
    console.log(err);
  } else {
    app.locals.pages = pages;
  }
});

// Get Category Model
var Category = require('./models/category');

// Get all Categories and pass to header.ejs
Category.find(function(err, categories) {
  if(err) {
    console.log(err);
  } else {
    app.locals.categories = categories;
  }
});

/**
 * Set Middleware
 */
// Express fileUpload middleware
app.use(fileUpload());

// Body Parser middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Express Session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  // cookie: { secure: true }
}))

// Express Message middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport config
require('./config/passport')(passport);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});

/** 
 * Set routes
 */ 
var pages= require('./routes/pages.js');
var products= require('./routes/products.js');
var cart= require('./routes/cart.js');
var users= require('./routes/users.js');
var adminPages= require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/', pages);

// Start the server
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started on port ' + port);
});