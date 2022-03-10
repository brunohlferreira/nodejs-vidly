const express = require('express');
const router = express.Router();
const Joi = require('joi');
const auth = require('../middleware/auth');
const validateRequestBody = require('../middleware/validateRequestBody');
const { Movie } = require('../models/movie');
const { Rental } = require('../models/rental');

router.post('/', [auth, validateRequestBody(validate)], async (req, res) => {
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
    if (!rental) return res.status(404).send('The rental was not found.');

    if (rental.dateReturned) return res.status(400).send('Return was already processed.');

    rental.return();
    await rental.save();

    await Movie.updateOne({ _id: rental.movie._id }, {
        $inc: { numberInStock: 1 }
    });

    return res.send(rental);
});

function validate(req) {
    const schema = Joi.object({
        customerId: Joi.objectId().required(),
        movieId: Joi.objectId().required()
    });
    return schema.validate(req);
}

module.exports = router;