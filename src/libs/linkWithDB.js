'use strict';

const DatabaseWrapper = require('./DatabaseWrapper');
//const _ = require('lodash');
let dbInstance;

function initDb() {
    const _config = {
        connectionLimit: process.env.DB_CONN_LIMIT || 10,
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev',
        password: process.env.DB_PASSWD || 'c4i2N1pjzpFR?q9x!Nhy',
        database: process.env.DB_NAME || 'crypto-api',
        seqOptions: {
            retry: {
                match: 'ER_LOCK_DEADLOCK: Deadlock found when trying to get lock; ' +
                'try restarting transaction',
                max: 5
            },
            operatorsAliases: false
        }
    };

    return DatabaseWrapper.createInstance('default', _config).then(_instance => {
        linkModelsAndControllersWithDB('default');
        dbInstance = _instance;

        //Always sync new models with the DB, need to review for production
        return _instance.syncModels(true);
    });
}

function getDB() {
    return dbInstance;
}

function linkModelsAndControllersWithDB(_instanceName, _prefix = '') {
    const _instance = DatabaseWrapper.getInstance(_instanceName);

    _instance._sequelize.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

    //users
    _instance.registerModel(`${_prefix}api.users`, require('../models/Users'), `${_prefix}users`);
    _instance.registerController(`${_prefix}api.users`,
        require('../controllers/Users'), `${_prefix}api.users`);

    //portfolio
    _instance.registerModel(`${_prefix}api.portfolios`,
        require('../models/Portfolio'), `${_prefix}portfolios`);
    _instance.registerController(`${_prefix}api.portfolios`,
        require('../controllers/Portfolio'), `${_prefix}api.portfolios`);
}

function getController(_controllerName, _prefix = '') {
    return dbInstance.getNestedController(`${_prefix}api.${_controllerName}`);
}

module.exports = {
    initDb,
    getDB,
    getController
};
