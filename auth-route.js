var JWT = require('json-web-token');
var User = require('./Models/User');
var bcrypt = require('bcrypt-nodejs');
var logger = require('./logger');

module.exports.assignRoute = function(app) {

    app.post('/signin', function(req, res, next) {
        var cuser = req.body;
        User.findOne({
            username: cuser.username
        }, function(err, user) {
            if (err) { //on error
                return res.status(500).json({
                    message: 'database error'
                });
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
                        res.status(200).json(token);
                    } else { //on error
                        res.status(500).json({
                            message: 'server cannot generate a token'
                        });
                    }
                });
            }

        });
    });

    app.post('/signup', function(req, res, next) {
        var c_user = req.body; //client user data
        User.findOne({ //query
            $or: [{username: c_user.username}, {email: c_user.email} ]
        }, function(err, user) {
            if (err) { //on error
                return res.status(500).json({
                    message: 'database error'
                });
            }

            if (!user) { //if no username is match
                bcrypt.hash(c_user.password, null, null, function(err, hash) { //hash the password
                    User.create({ //create new user
                            username: c_user.username,
                            password: hash,
                            email: c_user.email,
                            friends: [],
                            friendsRequest: [],
                            avatar: c_user.avatar
                        },
                        function(err, newUser) { //callback
                            if (err) { //error while adding a new user to database
                                return res.status(500).json({
                                    message: 'database error'
                                });
                            } else { //adding new user to database is success
                                genToken(newUser._id, function(err, result) {
                                    if (err) { //error while generating token
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
                if(user.username === c_user.username){
                  errorField += 'username';
                }

                if(user.email === c_user.email){
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

    app.get('/verify/:token', function(req, res, next) {
        var token = req.params.token;
        if (!token) { //no token
            return res.status(400).json({
                message: 'invalid token'
            });
        } else {
            JWT.decode('this is joinpa', token, function(err, decode) {
                if (err) { //error on decoding the token
                    res.status(500).json({
                        message: 'invilid token or server cannot manipulate the token'
                    });
                }

                var query = User.findOne({ //find user id on database
                    _id: decode.uid
                }).select('username email friends friendsRequest avatar').exec(function(err, user) { //select fields and callback
                    if (err) { //on database error
                        return res.status(500).json({
                            message: 'database error'
                        });
                    }

                    if (user) { //found a match user id
                        return res.status(200).json(user);
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
