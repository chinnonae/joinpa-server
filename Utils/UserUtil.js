var User = require('../Models/User');

module.exports = {

  /*
    Create new understandable User object.
  */
  beautify: function(user) {

    /*
      New editable User object
    */
    var newUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      friends: [],
      friendRequests: []
    };

    /*
      For each friendship belong to user, identify type of friendship (friend, or request).
      if it is friend, put friend's information to friends array
      otherwise put request's information to friendRequests array
    */
    user.friendship.forEach(function(friendship) {
      var toclone;
      var cloned;

      // if friendship == friend
      if(friendship.status === true) {
        if(friendship.relation[0]._id.toString() == user._id.toString()) {
          toclone = friendship.relation[1];
        } else {
          toclone = friendship.relation[0];
        }

        // clone attributes to editable object.
        cloned = cloneAttribute(['_id', 'username', 'email', 'avatar'], toclone);

        cloned.isFriend = true;
        newUser.friends.push(cloned);

      }

      // if friendship == request
      else {
        if(friendship.relation[1]._id.toString() == user._id.toString()) {
          toclone = friendship.relation[0];

          // clone attributes to editable object.
          cloned = cloneAttribute(['_id', 'username', 'email', 'avatar'], toclone);

          cloned.isFriend = false;
          newUser.friendRequests.push(cloned);

        }
      }
    });

    return newUser;

  }, // end of function beautify().


  /*
    Find an User from database.
  */
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

  /*
    Find Users from database.
  */
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

function cloneAttribute(attribs, original){
  var cloned = {};
  attribs.forEach(function(attrib) {
    if(original[attrib] !== undefined){
      cloned[attrib] = original[attrib];
    }
  });
  return cloned;
}
