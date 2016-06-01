var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model(
  'Event', //model name
  new Schema({
    name: String,
    host: {type: Schema.ObjectId, ref: 'User'},
    isPrivate: Boolean,
    icon: Number,
    place: {
      name: String,
      lon: Number,
      lat: Number,
      isUseMap: Boolean
    },
    joinedList: [{ type: Schema.ObjectId, ref: 'User'}],
    pendingList: [{ type: Schema.ObjectId, ref: 'User'}],
    declinedList: [{ type: Schema.ObjectId, ref: 'User'}],
    date: Date,
    timestamp: Date
  },
  {
    collection: 'Event'
  })
);
