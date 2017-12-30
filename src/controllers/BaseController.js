'use strict';

const _ = require('lodash');
const ErrorClasses = require('../libs/ErrorClasses');

/**
 * Root Class all controllers inherit from to leverage shared actions and common safety checks
 */
class BaseController {
    // called from DatabaseWrapper instance to append model.
    setModels(_model) {
        this.model = _model;

        return this;
    }

    linkWithOperators(Operators) {
        //Sequelize no longer supports operator aliases so need to use this object instead.
        this.Operators = Operators;
    }

    wrapFunctionWithTransaction(_function) {
        return this.model.sequelize.transaction(_function);
    }

    _create(_values, _query, _transaction) {
        if (!_.isNil(_transaction)) {
            _query.transaction = _transaction;
        }

        return this.model.create(_values, _query).then(_result => {
            if (_result instanceof this.model.sequelize.ValidationError) {
                return Promise.reject(_result);
            }

            if (_result instanceof this.model.sequelize.UniqueConstraintError) {
                return Promise.reject(_result);
            }

            return _result;
        });
    }

    _findOne(_query, _transaction) {
        if (!_.isNil(_transaction)) {
            _query.transaction = _transaction;
        }

        return this.model.findOne(_query);
    }

    _update(_values, _query, _transaction) {
        if (!_.isNil(_transaction)) {
            _query.transaction = _transaction;
        }

        return this.model.update(_values, _query).then(_result => {
            BaseController.shouldUpdateOnlyOne(_result, _query);
        });
    }

    _updateMany(_values, _query, _transaction) {
        if (!_.isNil(_transaction)) {
            _query.transaction = _transaction;
        }

        return this.model.update(_values, _query).then(_result => {
            if (_result[0] === 0) {
                throw new ErrorClasses.ControllerNoMatchingRecordsError(_query.where);
            }
        });
    }

    _upsert(_values, _query, _transaction) {
        if (!_.isNil(_transaction)) {
            _query.transaction = _transaction;
        }

        return this.model.upsert(_values, _query);
    }

    static parseJSONValue(_val) {
        try {
            return JSON.parse(_val);
        } catch (_err) {
            return null;
        }
    }

    static shouldUpdateOnlyOne(_result, _query) {
        if (_result[0] === 1) {
            return;
        }

        if (_result[0] === 0) {
            throw new ErrorClasses.ControllerNoMatchingRecordsError(_query.where);
        }

        throw new ErrorClasses.ControllerTooManyRecordsError(_query.where, _result[0], 1);
    }
}

module.exports = BaseController;
