const config = require('config');
const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const express = require('express');
const app = express();
require('./startup/routes')(app);
require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');

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
    level: 'error'
}));

if (!config.get('jwtPrivateKey')) {
    console.log('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

mongoose.connect('mongodb://localhost/vidly')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));