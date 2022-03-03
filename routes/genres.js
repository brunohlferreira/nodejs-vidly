const mongoose = require('mongoose');
const Joi = require('joi');
const express = require('express');
const router = express.Router();

const Genre = mongoose.model('Genre', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    }
}));

router.get('/', async (req, res) => {
    const genres = await Genre.find().sort('name');

    return res.send(genres);
});

router.post('/', async (req, res) => {
    const { error } = validateGenre(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let genre = new Genre({ name: req.body.name });
    genre = await genre.save();

    return res.send(genre);
});

router.put('/:id', async (req, res) => {
    const { error } = validateGenre(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    if(!validateId(req.params.id)) return res.status(404).send('The genre with the given ID was not found.');

    const genre = await Genre.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

router.delete('/:id', async (req, res) => {
    if(!validateId(req.params.id)) return res.status(404).send('The genre with the given ID was not found.');

    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

router.get('/:id', async (req, res) => {
    if(!validateId(req.params.id)) return res.status(404).send('The genre with the given ID was not found.');

    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('The genre with the given ID was not found.');

    return res.send(genre);
});

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required()
    });
    return schema.validate(genre);
}

function validateId(id) {
    if(mongoose.Types.ObjectId.isValid(id)) {
        if((String)(new mongoose.Types.ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}

module.exports = router;