const config = require('config');
const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateRequestBody = require('../middleware/validateRequestBody');
const { User, validate } = require('../models/user');

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -__v');

    return res.send(user);
});

router.post('/', validateRequestBody(validate), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = user.generateAuthToken();

    return res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

module.exports = router;