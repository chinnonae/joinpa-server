var express = require('express');
var bodyParser = require('body-parser');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();
var port = process.env.port || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

passport.use(new LocalStrategy(function(username, password, done) {
  done(null, 'this is a test');
}));

app.listen(port, function(err){
  if(err){
    console.log("Server is unable to run.");
    console.log(err);
  } else {
    console.log("Server is running on " + port);
  }
});
