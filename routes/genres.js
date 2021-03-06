const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequestBody = require('../middleware/validateRequestBody');
const { Genre, validate } = require('../models/genre');

router.get('/', async (req, res) => {
    const genres = await Genre.find({}).sort('name');

    return res.send(genres);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

router.post('/', [auth, validateRequestBody(validate)], async (req, res) => {
    let genre = new Genre({ name: req.body.name });
    await genre.save();

    return res.send(genre);
});

router.put('/:id', [validateObjectId, auth, validateRequestBody(validate)], async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

router.delete('/:id', [validateObjectId, auth, admin], async (req, res) => {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

module.exports = router;