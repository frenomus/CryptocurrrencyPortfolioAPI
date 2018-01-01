'use strict';

const express = require('express');
const router = express.Router();
const db = require('../libs/linkWithDB');
const sendJsonResult = require('../libs/standardJSONResultHelper').sendJsonResult;
const jwtWrapper = require('../libs/jwtWrapper');


// use a thin wrapper for JWT so the secret can be configured in a single common location.
//const jwt = require('../libs/jwtWrapper');

router.post('/register', (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    if (_req.body.password !== _req.body.password2) {
        return jsonResultWrapper.reject(new Error('Passwords do not match'));
    }

    if (typeof _req.body.email !== 'string' || _req.body.email.length === 0) {
        return jsonResultWrapper.reject(new Error('Email is required'));
    }

    return db.getController('users').add(_req.body.email, _req.body.password)
        .then(_user => {
            return { token: jwtWrapper.issueJWT({ id: _user.id }) };
        })
        .then(jsonResultWrapper.accept)
        .catch(jsonResultWrapper.reject);
});

router.post('/login', (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    if (typeof _req.body.password !== 'string' || _req.body.password.length === 0) {
        return jsonResultWrapper.reject(new Error('Password is required'));
    }

    if (typeof _req.body.email !== 'string' || _req.body.email.length === 0) {
        return jsonResultWrapper.reject(new Error('Email is required'));
    }

    return db.getController('users').authenticate(_req.body.email, _req.body.password)
        .then(_user => {
            return { token: jwtWrapper.issueJWT({ id: _user.id }) };
        })
        .then(jsonResultWrapper.accept)
        .catch(jsonResultWrapper.reject);
});

module.exports = router;
