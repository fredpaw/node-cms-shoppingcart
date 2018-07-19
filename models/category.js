var mongoose = require('mongoose');

// Page Schema
var CategorySchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
  }
});

var Category = mongoose.model('Category', CategorySchema);

module.exports = Category;