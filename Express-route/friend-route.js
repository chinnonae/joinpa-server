var User = require('../Models/User');
var Friendship = require('../Models/Friendship');

module.exports.assignRoute = function(app) {

    app.post('/friend/search/', function(req, res, next) {
        searchAttr = req.body.search; //username to be searched

        User.find({ //find user
                username: new RegExp('\\b' + searchAttr, 'i') // regex = /\b{searchAttr}/i.
            })
            .select('_id username avatar friendship')
            .sort('username')
            .limit(15)
            .exec(function(err, results) {
                if (err) { //database error occur
                    //handle
                } else { //no error
                    res.status(400).json(results);
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
            if (results) { //if exists then response an error to client
                return res.status(400).json({
                    message: 'request is already exists'
                });
            }
            //if not exists
            Friendship.create({ //create nnew friendship
                relation: [req.user.uid, req.body.otherUserId],
                status: false

            }, function(err, friendship) { //callback
                if(err){ //database error occur
                  //handle
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
                          //handle
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


    app.put('/friend/accept-request', function(req, res, next) {
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

            }
            //if not then reponse the success
            console.log(raw);
            res.status(200).json({
                message: 'friend request accepted'
            });
        }
        );
    }); // end of PUT /friend/accept-request



};
