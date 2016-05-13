var mongoose = require('mongoose');

var username = 'joinpa_BE';
var password = 'softspec';
var host = 'chinnnoo.xyz';
var port = '27017';
var database = 'joinpa';

var options = {
    server: {
        poolSize: 10
    }
};

var uri = 'mongodb://' + username + ':' + password + '@' + host + ':' + port + '/' + database;

module.exports.connect = function() {
    console.log('connecting to ' + uri);
    mongoose.connection.on('connected', function() {
        console.log('DB connected');
    });

    mongoose.connect(uri, options);


};
