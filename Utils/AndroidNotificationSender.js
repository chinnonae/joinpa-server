var https = require('https');
var logger = require('../logger');


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

  if(deviceKey === "") {
    return;
  }

  var req = https.request(options, function(res) {
    res.on('err', function(err) {
      logger.error('Notification request error');
      logger.error(err);
    });
    res.on('data', function(data) {
      logger.info('Successfully notified');
      logger.debug(data);
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
