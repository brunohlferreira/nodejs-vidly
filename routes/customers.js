const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const { Customer, validate } = require('../models/customer');

router.get('/', async (req, res) => {
    const customers = await Customer.find().sort('name');

    return res.send(customers);
});

router.post('/', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });
    await customer.save();

    return res.send(customer);
});

router.put('/:id', [validateObjectId, auth], async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const customer = await Customer.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

router.delete('/:id', [validateObjectId, auth, admin], async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    return res.send(customer);
});

module.exports = router;