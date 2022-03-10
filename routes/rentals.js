const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateRequestBody = require('../middleware/validateRequestBody');
const { Rental, validate } = require('../models/rental');
const { Customer } = require('../models/customer');
const { Movie } = require('../models/movie');

router.get('/', async (req, res) => {
    const rentals = await Rental.find({}).sort('-dateOut');

    return res.send(rentals);
});

router.post('/', [auth, validateRequestBody(validate)], async (req, res) => {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer.');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie.');

    if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock.');

    let rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    });
    await rental.save();

    movie.numberInStock--;
    movie.save();

    return res.send(rental);
});

module.exports = router;