var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.User = mongoose.model(
  'User', //model name
  new Schema({
    username: String,
    password: String,
    email: String,
    friends: [{ type: ObjectId, ref: 'User' }],
    friendsRequest: [{ type: ObjectId, ref: 'User' }],
    avatar: Intger
  })
);
