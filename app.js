var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var dbconfig = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');

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

// Set routes
var pages= require('./routes/pages.js');
var adminPages= require('./routes/admin_pages.js');

app.use('/admin/pages', adminPages);
app.use('/', pages);

// Start the server
var port = 3000;
app.listen(port, function() {
  console.log('Server started on port' + port);
});