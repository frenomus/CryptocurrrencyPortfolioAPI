'use strict';

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

module.exports = { sendJsonResult };
