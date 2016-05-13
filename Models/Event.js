var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'Event', //model name
  new Schema({
    name: String,
    host: {type: Schema.ObjectId, ref: 'User'},
    private: Boolean,
    icon: Number,
    place: {
      name: String,
      long: Number,
      lat: Number
    },
    joinedList: [{ type: Schema.ObjectId, ref: 'User'}],
    pendingList: [{ type: Schema.ObjectId, ref: 'User'}],
    declinedList: [{ type: Schema.ObjectId, ref: 'User'}],
    date: Date
  },
  {
    collection: 'Event'
  })
);
