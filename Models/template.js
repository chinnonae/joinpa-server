var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'name', //model name
  new Schema({

  },
  {
    collection: 'coll'
  })
);
