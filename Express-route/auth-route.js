var JWT = require('json-web-token');
var User = require('../Models/User');
var bcrypt = require('bcrypt-nodejs');
var logger = require('../logger');
var UserUtil = require('../Utils/UserUtil');
var ReqUtil = require('../Utils/RequestUtil.js');

module.exports.assignRoute = function(app) {

    app.post('/signin', function(req, res, next) {
      var cuser = req.body;

      if( !cuser.username || !cuser.password ) { //if any field is missing
        ReqUtil.badRequest(res, 'please fill the username and password field');
        return;
      }

      User.findOne({
        username: cuser.username
      },
        function(err, user) {
          if (err) { //on error
            ReqUtil.sendDbError(res, err);
          }

          if (!user) { //wrong username
            ReqUtil.badRequest(res, 'wrong username or password');
            return;
          }

          if (!bcrypt.compareSync(cuser.password, user.password)) { //wrong password
            ReqUtil.badRequest(res, 'wrong username or password');
            return;

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
        }
      );
    });


    app.post('/signup', function(req, res, next) {
      var cuser = req.body; //client user data

      if( !cuser.username || !cuser.password || !cuser.email ){ //if any field is null
        ReqUtil.badRequest(res, 'please fill required fields');
        return;
      }

      User.findOne({ //query
          $or: [{username: cuser.username}, {email: cuser.email} ]
        },
        function(err, user) {
          if (err) { //on error
            ReqUtil.sendDbError(res, err);
          }

          if (!user) { //if no username is match
            bcrypt.hash(cuser.password, null, null,

              function(err, hash) { //hash the password

                User.create({ //create new user
                    username: cuser.username,
                    password: hash,
                    email: cuser.email,
                    avatar: cuser.avatar
                  },

                  function(err, newUser) { //callback

                    if (err) { //error while adding a new user to database
                      ReqUtil.sendDbError(res, err);
                    }

                    else { //adding new user to database is success

                      genToken(newUser._id, function(err, result) {

                        if (err) { //error while generating token
                          logger.error('GenToken:\n' + err);
                            return res.status(500).json({
                              message: 'server cannot generate a token'
                            });
                        }

                        else { //on success return the token
                          var token = {
                            key: result
                          };
                          res.status(200).json(token);
                        }
                      });
                    }
                  }
                );
              }
            );

          } else { //the username/email from client match a username/email in database
            errorField = '';

            if(user.username === cuser.username){
              errorField += 'username';
            }

            if(user.email === cuser.email){
              if(errorField) { //error field is not ''
                errorField += ', ';
              }
                errorField += 'email';
            }

            ReqUtil.badRequest(res, errorField + ' already exists');
            return;
          }
        }
      );
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
              return res.status(500).json({
                message: 'invilid token or server cannot manipulate the token'
              });
          }

          UserUtil.findOne({ _id: decode.uid }, function(err, user) {
            var beautified = UserUtil.beautify(user);
            user.deviceKey = deviceKey;

            user.save(function(err) {
              if(err) {
                ReqUtil.sendDbError();
                return;
              }
              return res.status(200).json(beautified);
            });
          });
        });
      }
    });


    app.get('/logout',function(req, res, next) {
      var thisUserId = req.user.uid;

      UserUtil.findOne({ _id: thisUserId }, function(err, user) {
        user.deviceKey = "";

        user.save(function(err) {
          if(err) {
            ReqUtil.sendDbError();
            return;
          }
          res.status(200).json({
            message: 'You have been signed out.'
          });

        });
      });

    }); //end of /logout


};

function genToken(id, callback) {
  JWT.encode('this is joinpa', {
      uid: id
  },
    function(err, token) {
      callback(err, token);
    }
  );
}
