var express = require('express');
var bodyParser = require('body-parser');
var expressJWT = require('express-jwt');
var bcrypt = require('bcrypt-nodejs');
var morgan = require('morgan');

var app = express();
var port = process.env.port || 8080;

var mongooseConnection = require('./MongooseConnection').connect();
var route = require('./auth-route');
var User = require('./Models/User');
var logger = require('./logger');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(expressJWT({
    secret: 'this is joinpa'
}).unless({
    path: [
        '/signin',
        /\/verify/i,
        '/signup'
    ]
}));

app.use(morgan(':date :method :url', {stream: logger.stream}));

route.assignRoute(app);

app.listen(port, function(err) {
    if (err) {
        console.log("Server is unable to run.");
        console.log(err);
    } else {
        console.log("Server is running on " + port);
    }
});
