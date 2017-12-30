'use strict';

/**
 * Imported and adapted from a LogManager module I previously created with the remote logging parts
 * stripped out as they are not appropriate at this time.
 */

const winston = require('winston');
const path = require('path');
const _ = require('lodash');
const mJson = require('morgan-json');

const BYTES_IN_10MB = 1024 * 1024 * 10;
const DEFAULT_MAX_FILES = 10;

const _instances = {};
const commonTransportConfigs = {
    dailyFileRotation: (_path, _bHandleErrors = false, _productionLogLevel = 'info',
        _devLogLevel = 'debug', _datePattern = 'yyyy-MM-dd.') => {
        const _filename = _.isArray(_path) ? path.join(..._path) : _path;
        const _config = {
            filename: _filename,
            datePattern: _datePattern,
            prepend: true,
            level: process.env.ENV === 'development' ? _devLogLevel : _productionLogLevel,
            timestamp: true,
            json: true,
            maxsize: BYTES_IN_10MB,
            maxFiles: DEFAULT_MAX_FILES,
            colorize: true,
            handleExceptions: _bHandleErrors,
            name: _path[_path.length - 1]
        };

        if (_bHandleErrors) {
            _config.humanReadableUnhandledException = true;
        }

        return ['DailyRotateFile', _config];
    },
    file: (_path, _productionLogLevel = 'info', _devLogLevel = 'debug') => {
        const _filename = _.isArray(_path) ? path.join(..._path) : _path;

        return ['File', {
            filename: _filename,
            level: process.env.ENV === 'development' ? _devLogLevel : _productionLogLevel,
            timestamp: true,
            colorize: true,
            json: true,
            name: _path[_path.length - 1]
        }];
    },
    console: (_productionLogLevel = 'info', _devLogLevel = 'debug') => {
        return ['Console', {
            level: process.env.ENV === 'development' ? _devLogLevel : _productionLogLevel,
            timestamp: true,
            handleExceptions: true,
            json: false,
            colorize: true,
            humanReadableUnhandledException: true
        }];
    }
};

const commonLogConfigs = {
    splitLogInfoWarnError: _rootPath => {
        return [
            commonTransportConfigs.console(),
            commonTransportConfigs.dailyFileRotation(_.concat(_rootPath, 'info.log'),
                false, 'info', 'debug'),
            commonTransportConfigs.dailyFileRotation(_.concat(_rootPath, 'warn.log'),
                false, 'warn', 'debug'),
            commonTransportConfigs.dailyFileRotation(_.concat(_rootPath, 'error.log'),
                true, 'error', 'debug')
        ];
    }
};

require('winston-daily-rotate-file');

function getInstance(_instanceName) {
    if (_.isNil(_instances[_instanceName])) {
        throw new Error(`Tried to use a non existent log instance ${_instanceName}`);
    }

    return _instances[_instanceName];
}

function createInstance(_instanceName, _transports = [['Console', {}]], _level = 'debug') {
    const _initedTransports = _transports.map(([_transportName, _arguments]) => {
        return new winston.transports[_transportName](_arguments);
    });

    _instances[_instanceName] = new winston.Logger({
        level: _level,
        transports: _initedTransports
    });
}

function getMorganStream(_instanceName) {
    const _instance = getInstance(_instanceName);

    return {
        write: _msg => {
            _instance.info(_msg.replace(/\n$/, ''));
        }
    };
}

const defaultJSONConfig = {
    time: '[:date[clf]]',
    remoteIP: ':remote-addr',
    request: ':url',
    method: ':method',
    status: ':status',
    userAgent: ':user-agent',
    referrer: ':referrer',
    responseTime: ':response-time',
    sent: ':res[content-length]',
    sessionId: ':sessionId'
};

function getMorganJSONStream(morgan, _instanceName, _jsonConfig, _morganOptions = {}) {
    const _instance = getInstance(_instanceName);
    const _options = _.defaultsDeep({}, _morganOptions);

    let _config = defaultJSONConfig;

    if (!_.isNil(_jsonConfig) && _.isObject(_jsonConfig)) {
        _config = _.defaultsDeep({}, defaultJSONConfig, _jsonConfig || {});
    }

    const _logFormat = mJson(_config);

    morgan.token('hostname', req => {
        return req.hostname;
    });
    morgan.token('sessionId', req => {
        return req.sessionID || '-';
    });

    _options.stream = {
        write: _msg => {
            _instance.info(_msg);
        }
    };

    return morgan(_logFormat, _options);
}

module.exports = {
    createInstance,
    commonLogConfigs,
    commonTransportConfigs,
    getInstance,
    getMorganStream,
    getMorganJSONStream
};
