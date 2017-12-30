'use strict';

const express = require('express');
const router = express.Router();
const sendJsonResult = require('../libs/standardJSONResultHelper').sendJsonResult;

// use a thin wrapper for JWT so the secret can be configured in a single common location.
const getJWTWithCommonSecret = require('../libs/jwtWrapper').getJWTWithCommonSecret;

//router.use(jwt());

router.get('/', getJWTWithCommonSecret(), (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    jsonResultWrapper.accept('ok');
});

module.exports = router;
