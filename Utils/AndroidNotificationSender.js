
var https = require('https');

var options = {
  hostname: 'fcm.googleapis.com',
  post: 443,
  method: 'POST',
  path: '/fcm/send',

  headers: {
    'Authorization': 'key=AIzaSyDOEe0P8ZBrgfqw5Du3H1yf9bgRyleKqP8',
    'Content-Type': 'application/json'
  }
};

module.exports.notify = function(deviceKey, title, body) {
  var req = https.request(options, function(res) {
    res.on('err', function(err) {
      process.stdout.write(err);
    });
    res.on('data', function(data) {
      process.stdout.write(data);
    });
  });

  var postBody = JSON.stringify({
    notification: {
      title: title,
      body: body
    },
    to: deviceKey
  });
  req.write(postBody);
  req.end();

};
