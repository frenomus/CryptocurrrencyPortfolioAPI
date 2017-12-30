'use strict';

const Sequelize = require('sequelize');

class BaseError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        /* istanbul ignore else */
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}

class ControllerNoMatchingRecordsError extends BaseError {
    constructor(_where) {
        super('No matching records found');
        this.whereClause = _where;
    }
}

class ControllerTooManyRecordsError extends BaseError {
    constructor(_where, _actual, _expected) {
        super(`Updated too many rows: Matched ${_actual} out of ${_expected}`);

        this.whereClause = _where;
    }
}

class AuthenticationError extends BaseError {
}

const ErrorClasses = {
    AuthenticationError: AuthenticationError,
    BaseError: BaseError,
    ControllerNoMatchingRecordsError: ControllerNoMatchingRecordsError,
    ControllerTooManyRecordsError: ControllerTooManyRecordsError,
    UniqueConstraintError: Sequelize.UniqueConstraintError,
    ValidationError: Sequelize.ValidationError,
    ForeignKeyConstraintError: Sequelize.ForeignKeyConstraintError
};

module.exports = ErrorClasses;
