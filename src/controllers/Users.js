'use strict';

const BaseController = require('./BaseController');
const crypto = require('crypto');
const ErrorClasses = require('../libs/ErrorClasses');
const _ = require('lodash');

class UserController extends BaseController {
    constructor() {
        super();

        this._emailHashSalt = 'd68a093405013952ad976e27c116523c';
    }

    add(_email, _password, _bNeedsActivation, _transaction = undefined) {
        try {
            this.constructor._checkPasswordMeetsComplexityRequirements(_password);
        } catch (_err) {
            return Promise.reject(_err);
        }

        //Active would be false in production, and only be set to true after account validation.

        const _user = {
            email: _email,
            active: !_bNeedsActivation,
            salt: crypto.randomBytes(16).toString('hex'),
            emailHash: this.constructor._createEmailHash(_email, this._emailHashSalt)
        };

        _user.password = this.constructor._encryptPasswordValue(_user.salt, _password);

        return new Promise((_accept, _reject) => {
            return this._create(_user, {}, _transaction).then(_user => {
                if (_bNeedsActivation) {
                    //Do activation email sending etc stuff here

                    return Promise.resolve(_user);
                }

                return _user;
            }).then(_accept).catch(_err => {
                if (_err instanceof ErrorClasses.UniqueConstraintError) {
                    return _reject(new ErrorClasses.AuthenticationError('User already exists'));
                }

                return _reject(_err);
            });
        });
    }

    authenticate(_email, _password) {
        return this._getUserFromEmail(_email).then(_user => {
            if (_.isNil(_user) ||
                !this._checkPasswordValid(_user.salt, _password, _user.password)) {
                throw new ErrorClasses
                    .AuthenticationError('Invalid username / password combination');
            }

            if (!_user.active) {
                throw new ErrorClasses.AuthenticationError('Account not active');
            }

            return _user;
        });
    }

    changeEmail(_id, _email, _transaction) {
        return this._update({
            email: _email,
            emailHash: this.constructor._createEmailHash(_email, this._emailHashSalt)
        }, { id: _id }, _transaction);
    }

    changePassword(_id, _oldPassword, _newPassword, _transaction) {
        return this.getById(_id, _transaction).then(_user => {
            this.constructor._checkPasswordMeetsComplexityRequirements(_newPassword);

            if (_.isNil(_user)) {
                throw new ErrorClasses
                    .AuthenticationError('User not found');
            }

            if (!this._checkPasswordValid(_user.salt, _oldPassword, _user.password)) {
                throw new ErrorClasses.AuthenticationError('Old password is invalid');
            }

            /**
             * reset salt to new value on password change -
             * we can use this as a token to invalidate JWT's later
             */
            const _newSalt = crypto.randomBytes(16).toString('hex');

            return this._update({
                password: this.constructor._encryptPasswordValue(_newSalt, _newPassword),
                salt: _newSalt
            }, { id: _id }, _transaction);
        });
    }

    getById(_id, _transaction) {
        return this._getById(_id, _transaction);
    }

    setFlag(_id, _flagName, _bTrue, _transaction) {
        const _data = {};

        _data[_flagName] = _bTrue;

        return this._update(_data, { id: _id }, _transaction);
    }

    _checkPasswordValid(_salt, _password, _passwordHash) {
        return _passwordHash === this.constructor._encryptPasswordValue(_salt, _password);
    }

    _getById(_id, _transaction) {
        return this._findOne({ where: { id: _id } }, _transaction);
    }

    _getUserFromEmail(_email) {
        return this._findOne({
            where: {
                emailHash: this.constructor
                    ._createEmailHash(_email, this._emailHashSalt)
            }
        });
    }

    static _checkPasswordMeetsComplexityRequirements(_password) {
        if (typeof _password !== 'string' || _password.length < 7) {
            throw new ErrorClasses
                .AuthenticationError('Password must be a minimum of 7 characters long');
        }
    }

    static _encryptPasswordValue(_salt, _password) {
        return crypto.createHmac('sha256', _salt).update(_password).digest('hex');
    }

    static _createEmailHash(_salt, _email) {
        return crypto.createHmac('sha256', _salt).update(_email).digest('hex');
    }
}

module.exports = UserController;
