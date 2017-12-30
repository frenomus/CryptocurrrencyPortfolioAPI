'use strict';

const express = require('express');
const router = express.Router();

function sendJsonResult(_res) {
    return {
        accept: _payload => {
            _res.send({
                success: true,
                msg: null,
                payload: _payload
            });
        },
        reject: _error => {
            _res.send({
                success: false,
                msg: _error.message
            });
        }
    };
}

router.get('/', (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    jsonResultWrapper.accept('ok');
});

module.exports = router;
