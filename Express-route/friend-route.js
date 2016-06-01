var User = require('../Models/User');
var Friendship = require('../Models/Friendship');
var logger = require('../logger');
var UserUtil = require('../Utils/UserUtil');
var ReqUtil = require('../Utils/RequestUtil');
var ANS = require('../Utils/AndroidNotificationSender');

module.exports.assignRoute = function(app) {

  app.post('/friend/search/', function(req, res, next) {
    searchAttr = req.body.search; //username to be searched

    UserUtil.find(
      { //find user
        username: new RegExp('\\b' + searchAttr, 'i'), // regex = /\b{searchAttr}/i.
        _id: { $ne: req.user.uid }
      },
      15,
      function(err, results) {

        if(err){
          ReqUtil.databaseError(res, err);
        }

        var beautified = [];
        results.forEach(function(results) {
          beautified.push(UserUtil.beautify(results));
        });

        res.status(200).json({
          result: beautified
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

        Friendship.find(
          { //find whether relationship is exists or not
            $and: [
              { relation: { $in: [thisUserId] } },
              { relation: { $in: [otherUserId] } }
            ]
          },
          function(err, results) {
            if (results.length > 0) { //if exists then response an error to client
              return res.status(400).json({
                message: 'request is already exists'
              });
            }
            //if not exists
            Friendship.create(
              { //create new friendship
                relation: [req.user.uid, req.body.otherUserId],
                status: false
              },
              function(err, friendship) { //callback
                if(err){ //database error occur
                  return sendDbError(res, err);
                }
                //if not then update friendship to both user
                User.update(
                  //where
                  {
                    $or: [{ _id: thisUserId }, { _id: otherUserId }]
                  },
                  //fields and values to update
                  {
                    $push: {
                      friendship: friendship._id
                    }
                  },
                  //option
                  {
                    multi: true
                  },
                  //callback
                  function(err, raw) {
                    if(err) { //database error occur
                      return sendDbError(res, err);
                    }
                    User.findOne(
                      {
                        _id: otherUserId
                      },
                      function(err, user) {
                        UserUtil.findOne({ _id: thisUserId },
                          function(err, thisuser){
                            var beautified = UserUtil.beautify(thisuser);
                            ANS.notify(user.deviceKey, 'Friend request',
                              JSON.stringify(
                                {
                                  status: 2,
                                  message: 'You have a friend-request from ' + beautified.username,
                                  friend: beautified
                                }
                              )
                            );
                          });
                      }
                    );
                    //if not then response the client
                    res.status(200).json({
                      message: 'request is sent'
                    });
                  }
                );
              }
            );
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

        Friendship.update(
          //where
          {
            $and: [
              { relation: { $in: [thisUserId] } },
              { relation: { $in: [otherUserId] } }
            ]
          },
          //update fields and values
          {
            $set: { status: true}
          },
          //options
          {
            multi: false
          },
          //callback
          function(err, raw) {
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

        Friendship.find(
            { // query relationship of this user
              relation: user
            }
          )
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

      Friendship.find(
          { // query relationship of this user
            relation: user
          }
        )
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

      Friendship.remove(
        {
          $and: [
            { relation: { $in: [thisUserId] } },
            { relation: { $in: [otherUserId] } }
          ]
        },

        function(err){
          if(!err){ //if not error
            return res.status(200).json({
              message: 'unfriend success'
            });
        } else {
          sendDbError(res, err);
        }
      });
    }); //end of POST /friend/unfriend


};

function sendDbError(res, err){
  logger.error(err);
  res.status(500).json({
    message: 'database error'
  });
}
