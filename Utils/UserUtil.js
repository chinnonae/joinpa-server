var User = require('../Models/User');

module.exports = {

  beautify: function(user) {
    var newUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      friends: [],
      friendRequests: []
    };
    user.friendship.forEach(function(friendship) {
      if(friendship.status === true) {
        if(friendship.relation[0]._id.toString() == user._id.toString()) {
          newUser.friends.push(friendship.relation[1]);
        } else {
          newUser.friends.push(friendship.relation[0]);
        }
      } else {
        if(friendship.relation[1]._id.toString() == user._id.toString()) {
          newUser.friendRequests.push(friendship.relation[0]);
        }
      }
    });

    return newUser;

  },

  findOne: function(query, callback) {
    User.findOne(query)
      .select('_id username email avatar friendship')
      .populate({ //populate freindship
        path: 'friendship',
        select: 'relation status',

        populate: {
          path: 'relation',
          select: 'username email avatar'
        }
      })
      .exec(function(err, user){
        callback(err, user);
      });
  },

  find: function(query, limit, callback) {
    User.find(query)
      .select('_id username email avatar friendship')
      .populate({ //populate freindship
        path: 'friendship',
        select: 'relation status',

        populate: {
          path: 'relation',
          select: 'username email avatar'
        }
      })
      .limit(limit)
      .sort('username')
      .exec(function(err, users) {
        callback(err, users);
      });
  }
};
