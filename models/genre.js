const mongoose = require('mongoose');
const Joi = require('joi');

const Genre = mongoose.model('Genre', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    }
}));

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required()
    });
    return schema.validate(genre);
}

function validateId(id) {
    if (mongoose.Types.ObjectId.isValid(id)) {
        if ((String)(new mongoose.Types.ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
}

exports.Genre = Genre;
exports.validate = validateGenre;
exports.validateId = validateId;