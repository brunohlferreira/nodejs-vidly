const mongoose = require('mongoose');
const Joi = require('joi');
const express = require('express');
const router = express.Router();

const Customer = mongoose.model('Customer', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    phone: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    isGold: {
        type: Boolean,
        default: false
    }
}));

router.get('/', async (req, res) => {
    const customers = await Customer.find().sort('name');

    return res.send(customers);
});

router.post('/', async (req, res) => {
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });
    customer = await customer.save();

    return res.send(customer);
});

router.put('/:id', async (req, res) => {
    const { error } = validateCustomer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    if (!validateId(req.params.id)) return res.status(404).send('The customer with the given ID was not found.');

    const customer = await Customer.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

router.delete('/:id', async (req, res) => {
    if (!validateId(req.params.id)) return res.status(404).send('The customer with the given ID was not found.');

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

router.get('/:id', async (req, res) => {
    if (!validateId(req.params.id)) return res.status(404).send('The customer with the given ID was not found.');

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

function validateCustomer(customer) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        phone: Joi.string().min(5).max(50).required(),
        isGold: Joi.boolean()
    });
    return schema.validate(customer);
}

function validateId(id) {
    if (mongoose.Types.ObjectId.isValid(id)) {
        if ((String)(new mongoose.Types.ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
}

module.exports = router;