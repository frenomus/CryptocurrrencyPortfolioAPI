'use strict';

/**
 * This is a modified version of a module I created for managing instances of sequelize
 * where database information needs to be shared between modules and standardises
 * methods of intercommunication between controllers and binding models.
 *
 * One instance is created per database using createInstance method
 * Each module calls getInstance with the instance name to fetch relevant controllers
 */

const Sequelize = require('sequelize');
const _ = require('lodash');

const DEFAULT_OPTIONS = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: null,
    database: null,
    seqOptions: {
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    }
};

class DatabaseWrapper {
    constructor(_options) {
        this.options = _.defaultsDeep({}, _options, DEFAULT_OPTIONS);
        this.options.seqOptions.host = _options.host;

        this._sequelize = new Sequelize(this.options.database, this.options.user,
            this.options.password, this.options.seqOptions);

        this._sequelize.tinyInt = (_displayWidth = 3) => {
            const _int = new this._sequelize.Sequelize.INTEGER(_displayWidth);

            _int.key = 'TINYINT';

            return _int;
        };

        this._models = {};
        this._controllers = {};
        this.dataGroups = { preload: [] };
    }

    static _expandPath(_startNode, _pathElements) {
        let _node = _startNode;

        _pathElements.forEach(_pathId => {
            if (_.isNil(_node[_pathId])) {
                _node[_pathId] = {};
            }

            _node = _node[_pathId];
        });

        return _node;
    }

    syncModels(_onlySyncNewTables = true) {
        if (_onlySyncNewTables) {
            return this._sequelize.sync();
        }

        return this._sequelize.sync({ force: true });
    }

    validate() {
        return this._sequelize.authenticate();
    }

    registerModel(_path, _definition, _tableName) {
        const _pathElements = _.toPath(_path);
        const _lastNodeName = _pathElements.pop();
        const _node = this.constructor._expandPath(this._models, _pathElements);

        _node[_lastNodeName] = _definition(this._sequelize, _tableName);
    }

    registerModelRelationship(_pathA, _pathB, _type, _options) {
        const _nodeA = this._getModelFromPath(_pathA);
        const _nodeB = this._getModelFromPath(_pathB);

        _nodeA[_type](_nodeB, _options);
    }

    _getModelFromPath(_path) {
        let _node = this._models;
        const _pathElements = _.toPath(_path);

        _pathElements.forEach(_pathId => {
            if (_.isNil(_node[_pathId])) {
                throw new Error(`Model at path ${_path} does not exist`);
            }

            _node = _node[_pathId];
        });

        return _node;
    }

    _getControllerFromPath(_path) {
        let _node = this._controllers;
        const _pathElements = _.toPath(_path);

        _pathElements.forEach(_pathId => {
            if (_.isNil(_node[_pathId])) {
                throw new Error(`Controller at path ${_path} does not exist`);
            }

            _node = _node[_pathId];
        });

        return _node;
    }

    getController(_controllerName) {
        if (_.isNil(_controllerName)) {
            return this._controllers;
        }

        return this._controllers[_controllerName];
    }

    getNestedController(_path) {
        return this._getControllerFromPath(_path);
    }

    hasController(_controllerName) {
        return !_.isNil(this._controllers[_controllerName]);
    }

    registerController(_path, _definition, _models) {
        const _pathElements = _.toPath(_path);
        const _lastNodeName = _pathElements.pop();
        const _node = this.constructor._expandPath(this._controllers, _pathElements);
        const _evaluatedModels = this._evaluateModels(_models);

        _node[_lastNodeName] = new _definition().setModels(_evaluatedModels);

        if (_.isFunction(_node[_lastNodeName].linkWithControllerNamespace)) {
            //Gives access to other controllers on teh same node as this controller
            _node[_lastNodeName].linkWithControllerNamespace(_node);
        }

        if (_.isFunction(_node[_lastNodeName].linkWithOperators)) {
            //Gives access to other controllers on teh same node as this controller
            _node[_lastNodeName].linkWithOperators(Sequelize.Op);
        }

        return _node[_lastNodeName];
    }

    createController(_definition, _models) {
        const _evaluatedModels = this._evaluateModels(_models);

        return new _definition().setModels(_evaluatedModels);
    }

    _evaluateModels(_models) {
        let _evaluatedModels = null;

        if (_.isString(_models)) {
            _evaluatedModels = this._getModelFromPath(_models);
        }

        if (_.isObject(_models)) {
            _evaluatedModels = {};

            _.forEach(_models, (_path, _key) => {
                _evaluatedModels[_key] = this._getModelFromPath(_path);
            });
        }

        return _evaluatedModels;
    }

    registerDataGroup(_groupName, _controllerPaths, _bReplace = false) {
        if (_.isNil(this.dataGroups[_groupName]) || _bReplace) {
            this.dataGroups[_groupName] = [];
        }

        this.dataGroups[_groupName] = _.union(this.dataGroups[_groupName], _controllerPaths);
    }

    loadDataGroup(_groupName) {
        if (_.isNil(this.dataGroups[_groupName])) {
            return Promise.reject(
                new Error(`Tried to load a data group [${_groupName}] that does not exist`));
        }

        return Promise.all(this.dataGroups[_groupName].map(_cName => {
            return this.getNestedController(_cName).loadData();
        }));
    }
}

const _instances = {};

function createInstance(_instanceId, _options) {
    if (!_.isNil(_instances[_instanceId])) {
        throw new Error(`Tried to redeclare a sequelize instance: ${_instanceId}`);
    }

    _instances[_instanceId] = new DatabaseWrapper(_options);

    return _instances[_instanceId].validate().then(() => {
        return _instances[_instanceId];
    });
}

function getInstance(_instanceId) {
    if (_.isNil(_instances[_instanceId])) {
        throw new Error(`Tried to get a sequelize instance (${_instanceId}) before creating it`);
    }

    return _instances[_instanceId];
}

module.exports = {
    createInstance,
    getInstance
};
