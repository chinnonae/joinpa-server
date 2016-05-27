var User = require('../Models/User');
var Friendship = require('../Models/Friendship');
var logger = require('../logger');

module.exports.assignRoute = function(app) {

    app.post('/friend/search/', function(req, res, next) {
        searchAttr = req.body.search; //username to be searched
        User.find({ //find user
                username: new RegExp('\\b' + searchAttr, 'i'), // regex = /\b{searchAttr}/i.
                _id: { $ne: req.user.uid }
            })
            .select('_id username avatar friendship') // select field
            .populate({ //populate freindship
              path: 'friendship',
              match: { status: true },
              select: 'relation status'
            })
            .sort('username') //sort by username
            .limit(15)
            .exec(function(err, results) {
                if (err) { //database error occur
                    return sendDbError(res, err);
                }

                logger.debug('creating search results array');
                searchResults = []; //new search result array
                results.forEach(function(user) { //assign result
                  logger.debug('creating an user ' + user.username);
                  newUser = {
                    _id: user._id,
                    isFriend: false,
                    username: user.username,
                    email: user.email,
                    friends: []
                  };
                  user.friendship.forEach(function(friendship) { //assign friend to each user
                    logger.debug('adding friends\' id to the user (' + user.username + ')');
                    newUser.friends.push({
                      _id: friendship.relation[0].id == user._id.id ? friendship.relation[1] : friendship.relation[0] //if relation[0] = searched user then _id = relation[1], otherwise _id = relation[0]
                    }); //push relation[1] if [0] == thisUser, otherwise push relation[0]
                    newUser.isFriend = (friendship.relation[0].toString() == req.user.uid || friendship.relation[1].toString() == req.user.uid) || newUser.isFriend ? true : false;
                    //search user's isFriend is true when relation[0] or relation[1] = id of user who sent request or isFriend is already true, otherwise false
                  });
                  logger.debug('pushing an user into results array');
                  searchResults.push(newUser); // push new user object to search results
                });
                res.status(200).json({
                  result: searchResults
                });

            });

    }); //end of POST /friend/search


    app.post('/friend/request', function(req, res, next) {
        thisUserId = req.user.uid;
        otherUserId = req.body.otherUserId;
        if(!otherUserId){
          return res.status(400).json({
            message: 'otherUserId is missing'
          });
        }

        Friendship.find({ //find whether relationship is exists or not
            $and: [
              { relation: { $in: [thisUserId] } },
              { relation: { $in: [otherUserId] } }
            ]
        }, function(err, results) {
          console.log(err);
          console.log(results);
            if (results.length > 0) { //if exists then response an error to client
                return res.status(400).json({
                    message: 'request is already exists'
                });
            }
            //if not exists
            Friendship.create({ //create new friendship
                relation: [req.user.uid, req.body.otherUserId],
                status: false

            }, function(err, friendship) { //callback
                if(err){ //database error occur
                    return sendDbError(res, err);
                }
                //if not then update friendship to both user
                User.update({ //where
                        $or: [{ _id: thisUserId }, { _id: otherUserId }]
                    },
                    { //fields and values to update
                        $push: {
                            friendship: friendship._id
                        }
                    }, { //option
                        multi: true
                    }, //callback
                    function(err, raw) {
                        if(err) { //database error occur
                          return sendDbError(res, err);
                        }
                        //if not then response the client
                        res.status(200).json({
                          message: 'request is sent'
                        });
                    });
            });
        }
        );
    }); //end of POST /friend/request


    app.post('/friend/accept-request', function(req, res, next) {
        thisUserId = req.user.uid;
        otherUserId = req.body.otherUserId;
        if(!otherUserId) {
          return res.status(400).json({
            message: 'otherUserId is missing'
          });
        }

        Friendship.update({ //where
            $and: [
              { relation: { $in: [thisUserId] } },
              { relation: { $in: [otherUserId] } }
            ]
        }, { //update fields and values
            $set: { status: true}
        }, { //options
            multi: false
        }, function(err, raw) { //callback
            if(err) { //database error occur
                return sendDbError(res, err);
            }
            //if not then reponse the success
            res.status(200).json({
                message: 'friend request accepted'
            });
        }
        );
    }); // end of PUT /friend/accept-request


    app.get('/friend/request', function(req, res, next) {
        user = req.user.uid;
        Friendship.find({ // query relationship of this user
          relation: user
        })
          .select('relation status')
          .populate('relation', '_id username avatar email')
          .exec(function(err, results) {
            if(err) { //database error
              //handle
              return res.status(500).json({
                message: 'database error'
              });
            }
            var requests = [];
            results.forEach(function(relationship) { //for each relation ship
                if(relationship.status === false){ //if status is false (pending request);
                  if(relationship.relation[1]._id == user){ //if relation[1] == this user (meaning that this user has been requested for friendship by [0])
                    requests.push(relationship.relation[0]); //then push another into the array
                  }
                }
            });

            res.status(200).json({
              friendRequests: requests
            });
          });
    }); //end of GET /friend/request


    app.get('/friend/friends', function(req, res, next) {
      user = req.user.uid;
      Friendship.find({ // query relationship of this user
        relation: user
      })
        .select('relation status')
        .populate('relation', '_id username avatar email')
        .exec(function(err, results) {
          if(err) { //database error
            //handle
            return;
          }
          var friends = [];
          results.forEach(function(relationship) { //for each relation ship
              if(relationship.status === true){ //if status is true (they are friends);
                if(relationship.relation[0]._id == user){ //if relation[0] == this user
                  friends.push(relationship.relation[1]); //then push another into the array
                } else { //otherwise
                  friends.push(relationship.relation[0]);//push relation[0] into the array
                }
              }
          });

          res.status(200).json({
            friends: friends
          });
        });
    }); //end of GET /friend/friends


    app.post('/friend/unfriend', function(req, res, next) {
      thisUserId = req.user.uid;
      otherUserId = req.body.otherUserId;
      if(!otherUserId) {
        res.status(400).json({
          message: 'otherUserId is missing'
        });
      }

      Friendship.remove({
        $and: [
          { relation: { $in: [thisUserId] } },
          { relation: { $in: [otherUserId] } }
        ]
      }, function(err){
        if(!err){ //if not error
          return res.status(200).json({
            message: 'unfriend success'
          });
        } else {
          sendDbError(res, err);
        }
      });
    });
};

function sendDbError(res, err){
  logger.error(err);
  res.status(500).json({
    message: 'database error'
  });
}
