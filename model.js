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

module.exports.Event = mongoose.model(
  'Event', //model name
  new Schema({
    name: String,
    host: {type: ObjectId, ref: 'User'},
    private: Boolean,
    icon: Integer,
    place: {
      name: String,
      long: Double,
      lat: Double
    },
    joinedList: [{ type: ObjectId, ref: 'User'}],
    pendingList: [{ type: ObjectId, ref: 'User'}],
    declinedList: [{ type: ObjectId, ref: 'User'}],
    date: Date
  })
);
