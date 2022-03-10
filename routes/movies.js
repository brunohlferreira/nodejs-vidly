const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequestBody = require('../middleware/validateRequestBody');
const { Movie, validate } = require('../models/movie');
const { Genre } = require('../models/genre');

router.get('/', async (req, res) => {
    const movies = await Movie.find({}).sort('title');

    return res.send(movies);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send('The movie with the given ID was not found.');

    return res.send(movie);
});

router.post('/', [auth, validateRequestBody(validate)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if (!genre) return res.status(400).send('Invalid genre.');

    const movie = new Movie({
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    });
    await movie.save();

    return res.send(movie);
});

router.put('/:id', [validateObjectId, auth, validateRequestBody(validate)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if (!genre) return res.status(400).send('Invalid genre.');

    const movie = await Movie.findByIdAndUpdate(
        req.params.id,
        {
            title: req.body.title,
            genre: {
                _id: genre._id,
                name: genre.name
            },
            numberInStock: req.body.numberInStock,
            dailyRentalRate: req.body.dailyRentalRate
        },
        { new: true });
    if (!movie) return res.status(404).send('The movie with the given ID was not found.');

    return res.send(movie);
});

router.delete('/:id', [validateObjectId, auth, admin], async (req, res) => {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).send('The movie with the given ID was not found.');

    return res.send(movie);
});

module.exports = router;