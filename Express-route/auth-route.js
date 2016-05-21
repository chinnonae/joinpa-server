var JWT = require('json-web-token');
var User = require('../Models/User');
var bcrypt = require('bcrypt-nodejs');
var logger = require('../logger');

module.exports.assignRoute = function(app) {

    app.post('/signin', function(req, res, next) {
        var cuser = req.body;
        if( !cuser.username || !cuser.password ) { //if any field is missing
          return res.status(400).json({
            message: 'please fill the username and password field'
          });
        }
        User.findOne({
            username: cuser.username
        }, function(err, user) {
            if (err) { //on error
                sendDbError(res, err);
            }

            if (!user) { //wrong username
                return res.status(400).json({
                    message: 'wrong username or password'
                });
            }

            if (!bcrypt.compareSync(cuser.password, user.password)) { //wrong password
                return res.status(400).json({
                    message: 'wrong password or password'
                });
            } else {
                genToken(user._id, function(err, result) {
                    if (!err) { //on success
                        var token = {
                          key: result
                        };
                        return res.status(200).json(token);
                    } else { //on error
                        logger.error('GenToken:\n' + err);
                        return res.status(500).json({
                            message: 'server cannot generate a token'
                        });
                    }
                });
            }

        });
    });

    app.post('/signup', function(req, res, next) {
        var cuser = req.body; //client user data
        if( !cuser.username || !cuser.password || !cuser.email || (typeof cuser.avatar !== Number )){ //if any field is null
          return res.status(400).json({
            message: 'please fill required fields'
          });
        }
        User.findOne({ //query
            $or: [{username: cuser.username}, {email: cuser.email} ]
        }, function(err, user) {
            if (err) { //on error
                sendDbError(res, err);
            }

            if (!user) { //if no username is match
                bcrypt.hash(cuser.password, null, null, function(err, hash) { //hash the password
                    User.create({ //create new user
                            username: cuser.username,
                            password: hash,
                            email: cuser.email,
                            avatar: cuser.avatar
                        },
                        function(err, newUser) { //callback
                            if (err) { //error while adding a new user to database
                                sendDbError(res, err);
                            } else { //adding new user to database is success
                                genToken(newUser._id, function(err, result) {
                                    if (err) { //error while generating token
                                        logger.error('GenToken:\n' + err);
                                        return res.status(500).json({
                                            message: 'server cannot generate a token'
                                        });
                                    } else { //on success return the token
                                        var token = {
                                            key: result
                                        };
                                        res.status(200).json(token);
                                    }
                                });
                            }
                        }
                    );
                });

            } else { //the username/email from client match a username/email in database
                errorField = '';
                if(user.username === cuser.username){
                  errorField += 'username';
                }

                if(user.email === cuser.email){
                  if(!errorField) { //error field is not ''
                    errorField += ', ';
                  }
                  errorField += 'email';
                }

                return res.status(400).json({
                   message: errorField + ' already exists'
                });
            }


        });

    });

    app.post('/verify/:token', function(req, res, next) {
        var token = req.params.token;
        var deviceKey = req.body.deviceKey;
        if (!token || !deviceKey) { //no token
            return res.status(400).json({
                message: 'token or device key is missing'
            });
        } else {
            JWT.decode('this is joinpa', token, function(err, decode) {
                if (err) { //error on decoding the token
                    logger.error('Token decode\n: ' + err);
                    res.status(500).json({
                        message: 'invilid token or server cannot manipulate the token'
                    });
                }

                var query = User.findOne({ //find user id on database
                    _id: decode.uid
                }).select('username email avatar friendship')
                    .populate({
                      path: 'friendship',
                      select: 'relation status',

                      populate: {
                        path: 'relation',
                        select: 'username email avatar'
                      }
                    })
                    .exec(function(err, user) { //select fields and callback
                      if (err) { //on database error
                          return sendDbError(res, err);
                      }

                      user.deviceKey = deviceKey;
                      user.save(function(err){
                          if(err){
                            logger.error('Cannot save deviceKey of ' + user.username + ' :\n' + err);
                          }
                      });

                      if (user) { //found a match user id
                          var resUser = { //create new User object for response
                            _id: user._id,
                            username: user.username,
                            email: user.email,
                            avatar: user.avatar,
                            friends: [],
                            friendRequests: []
                          };

                          user.friendship.forEach(function(friendship){ //loop friendship array
                            var list;
                            if(friendship.status === true){ //if users are friend
                              list = resUser.friends;
                            } else {
                              list = resUser.friendRequests;
                            }
                            if(friendship.relation[0]._id == decode.uid){
                              list.push(friendship.relation[1]); //push this user's friend to the array
                            } else {
                              list.push(friendship.relation[0]);
                            }
                          });
                          return res.status(200).json(resUser);
                      } else { //cannot find a match user id
                          return res.status(400).json({
                              message: 'invalid token'
                          });
                      }

                });
            });
        }
    });

    app.get('/test', function(req, res, next) {
        res.json('success');
    });
};

function genToken(id, callback) {
    JWT.encode('this is joinpa', {
        uid: id
    }, function(err, token) {
        callback(err, token);
    });
}

function sendDbError(res, err){
    logger.err(err);
    res.status(500).json({
      message: 'database error'
    });
}
