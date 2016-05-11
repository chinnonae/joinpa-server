var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
