const express = require('express');
const router = express.Router();
const Joi = require('joi');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { Movie } = require('../models/movie');
const { Rental } = require('../models/rental');

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
    const rental = await Rental.findOne({ 
        'customer._id': req.body.customerId,
        'movie._id': req.body.movieId
    });
    if (!rental) return res.status(404).send('The rental was not found.');
    
    if (rental.dateReturned) return res.status(400).send('Return was already processed.');

    rental.dateReturned = new Date();
    const diff = rental.dateReturned - rental.dateOut;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    rental.rentalFee = days * rental.movie.dailyRentalRate;
    await rental.save();
    
    await Movie.updateOne({ _id: rental.movie._id }, {
        $inc: { numberInStock: 1 }
    });

    return res.status(200).send(rental);
});

function validateReturn(req) {
    const schema = Joi.object({
        customerId: Joi.objectId().required(),
        movieId: Joi.objectId().required()
    });
    return schema.validate(req);
}

module.exports = router;