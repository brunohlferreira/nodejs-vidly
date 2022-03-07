const config = require('config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const express = require('express');
const app = express();
require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');

require('./startup/routes')(app);
require('./startup/db')();

winston.exceptions.handle(
    new winston.transports.File({ filename: './log/uncaughtExceptions.log' })
);
process.on('unhandledRejection', (ex) => {
    throw ex;
});
winston.add(new winston.transports.File({ filename: './log/errors.log' }));
winston.add(new winston.transports.MongoDB({ 
    db: 'mongodb://localhost/vidly',
    options: { useUnifiedTopology: true },
    level: 'info'
}));

if (!config.get('jwtPrivateKey')) {
    console.log('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));