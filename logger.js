var winston = require('winston');
winston.emitErrs = true;


var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      name: 'debug-console',
      handleException: true,
      json: false,
      colorize: true
    }),
    new winston.transports.File({
      level: 'info',
      name: 'all-logs-file',
      filename: './logs/all-logs.log',
      handleExceptions: true,
      json: true,
      maxSize: 2542800,
      maxFiles: 10,
      colorize: false
    })

  ],
  exitOnError: false
});

logger.stream = {
  write: function(message, encoding){
      logger.info(message);
  }
};


module.exports = logger;
