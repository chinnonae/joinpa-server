var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'User', //model name
  new Schema({
    username: String,
    password: String,
    email: String,
    friends: [{ type: Schema.ObjectId, ref: 'User' }],
    friendsRequest: [{ type: Schema.ObjectId, ref: 'User' }],
    avatar: Number
  },
  {
    collection: 'User'
  })
);
