var logger = require('../logger');

module.exports = {

  badRequest: function(res, message){
    res.status(400).json({
      message: message
    });
  },

  databaseError: function(res, err){
    logger.err(err);
      res.status(500).json({
        message: 'database error'
      });
  }

};
