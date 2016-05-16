var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'Friendship', //model name
  new Schema({
    relation: [{ type: Schema.ObjectId, ref: 'User' }], // [0] is the one who sending request, [1] is one who get request
    status: Boolean // pending / friend
  },
  {
    collection: 'Friendship'
  })
);
