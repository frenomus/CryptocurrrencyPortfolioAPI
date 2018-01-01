'use strict';

const BaseController = require('./BaseController');
const ErrorClasses = require('../libs/ErrorClasses');

//const _ = require('lodash');

class PortfolioController extends BaseController {
    add(_userId, _portfolioId, _currencyId, _value, _transaction = undefined) {
        const _entry = {
            userId: _userId,
            portfolioId: _portfolioId,
            currencyId: _currencyId,
            value: _value
        };

        return new Promise((_accept, _reject) => {
            return this._create(_entry, {}, _transaction)
                .then(_accept)
                .catch(_err => {
                    if (_err instanceof ErrorClasses.UniqueConstraintError) {
                        return _reject(
                            new ErrorClasses.AuthenticationError('Holding already exists'));
                    }

                    return _reject(_err);
                });
        });
    }

    update(_userId, _portfolioId, _currencyId, _value, _transaction = undefined) {
        const _where = {
            userId: _userId,
            portfolioId: _portfolioId,
            currencyId: _currencyId
        };
        const _entry = { value: _value };

        return this._update(_entry, { where: _where }, _transaction);
    }

    delete(_userId, _portfolioId, _currencyId, _transaction = undefined) {
        const _where = {
            userId: _userId,
            portfolioId: _portfolioId,
            currencyId: _currencyId
        };

        return this._destroyOne({ where: _where }, _transaction);
    }

    getById(_id, _transaction) {
        return this._getById(_id, _transaction);
    }

    getAllInUserPortfolio(_userId, _portfolioId, _transaction) {
        return this.model.findAll({
            where: {
                userId: _userId,
                portfolioId: _portfolioId
            },
            attributes: ['currencyId', 'value']
        }, _transaction);
    }

    _getById(_id, _transaction) {
        return this._findOne({ where: { id: _id } }, _transaction);
    }
}

module.exports = PortfolioController;
