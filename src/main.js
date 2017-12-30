'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const LogManager = require('./libs/LogManager');
const morgan = require('morgan');
const HOSTNAME = require('os').hostname();
const app = express();
const db = require('./libs/linkWithDB');

//Needs to be populated when in production mode to restrict which sites can access this API
const corsWhitelist = [];

// Configure log location
LogManager.createInstance('default',
    LogManager.commonLogConfigs.splitLogInfoWarnError([__dirname, '../', 'local', 'logs']));

app.use(LogManager.getMorganJSONStream(morgan, 'default', { server: HOSTNAME }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
if (app.get('env') === 'development') {
    app.use(cors());
} else {
    app.use(cors({
        origin: (origin, callback) => {
            const originIsWhitelisted = corsWhitelist.indexOf(origin) !== -1;

            if (originIsWhitelisted) {
                return callback(null, true);
            }

            callback(new Error('Not allowed by CORS in production mode'));
        }
    }));
}

app.prepareForListen = () => {
    // Placeholder for now to enable init of DB later
    return db.initDb();
};

app.use('/', require('./routes/main'));
app.use('/auth', require('./routes/auth'));

// catch 404 and forward to error handler
app.use(function e404(req, res, next) {
    const err = new Error('Not Found');

    err.status = 404;
    next(err);
});

// Output stack traces for errors in development
// eslint disable no-unused-vars rules are required as express requires 4 params for error handlers
if (app.get('env') === 'development') {
    //eslint-disable-next-line no-unused-vars
    app.use(function eDev(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
} else {
    //eslint-disable-next-line no-unused-vars
    app.use(function eProd(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: {}
        });
    });
}

module.exports = app;
