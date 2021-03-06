var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'User', //model name
  new Schema({
    username: String,
    password: String,
    email: String,
    avatar: Number,
    deviceKey: String,
    friendship: [{ type: Schema.ObjectId, ref: 'Friendship' }]
  },
  {
    collection: 'User'
  })
);
