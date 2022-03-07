const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function () {
    winston.exceptions.handle(
        new winston.transports.File({ filename: '../log/uncaughtExceptions.log' })
    );
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });
    winston.add(new winston.transports.File({ filename: '../log/errors.log' }));
    winston.add(new winston.transports.MongoDB({ 
        db: 'mongodb://localhost/vidly',
        options: { useUnifiedTopology: true },
        level: 'info'
    }));
}