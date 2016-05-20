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
            .select('_id username avatar friendship')
            .sort('username')
            .limit(15)
            .exec(function(err, results) {
                if (err) { //database error occur
                    return sendDbError(res, err);
                } else { //no error
                    res.status(200).json(results);
                }
            });

    }); //end of POST /friend/search


    app.post('/friend/request', function(req, res, next) {
        thisUserId = req.user.uid;
        otherUserId = req.body.otherUserId;

        Friendship.find({ //find whether relationship is exists or not
            relation: {
                $in: [thisUserId, otherUserId]
            }
        }, function(err, results) {
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

        Friendship.update({ //where
            relation: {
                $in: [thisUserId, otherUserId]
            }
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
                  if(relationship.relation[0]._id === user){ //if relation[0] == this user
                    requests.push(relationship.relation[1]); //then push another into the array
                  }
                }
            });

            res.status(200).json(requests);
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
          var requests = [];
          results.forEach(function(relationship) { //for each relation ship
              if(relationship.status === true){ //if status is false (pending request);
                if(relationship.relation[0]._id == user){ //if relation[0] == this user
                  requests.push(relationship.relation[1]); //then push another into the array
                } else { //otherwise
                  requests.push(relationship.relation[0]);//push relation[0] into the array
                }
              }
          });

          res.status(200).json(requests);
        });
    }); //end of GET /friend/friends
};

function sendDbError(res, err){
  logger.error(err);
  res.status(500).json({
    message: 'database error'
  });
}