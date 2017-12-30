'use strict';

const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const SECRET = process.env.SECRET || '2e75cd6d0482104eb60dc76d73931f85';
const _ = require('lodash');
const commonConfig = {
    secret: SECRET,
    credentialsRequired: true
};

function getJWTWithCommonSecret(_customConfig = {}) {
    return expressJwt(_.defaultsDeep({}, _customConfig, commonConfig));
}

function issueJWT(_data) {
    return jwt.sign(_data, SECRET, { expiresIn: '1h' });
}

module.exports = {
    getJWTWithCommonSecret,
    issueJWT
};
