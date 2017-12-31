'use strict';

const express = require('express');
const router = express.Router();
const db = require('../libs/linkWithDB');
const sendJsonResult = require('../libs/standardJSONResultHelper').sendJsonResult;
const jwtWrapper = require('../libs/jwtWrapper');

//router.use(jwt());

router.get('/:portfolioId', jwtWrapper.getJWTWithCommonSecret(), (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    return db.getController('portfolios')
        .getAllInUserPortfolio(_req.user.id, _req.params.portfolioId).then(_portfolio => {
            const _keyedPortfolio = {};

            _portfolio.forEach(_i => {
                _keyedPortfolio[_i.currencyId] = {
                    id: _i.currencyId,
                    value: _i.value
                };
            });

            return _keyedPortfolio;
        })
        .then(jsonResultWrapper.accept)
        .catch(jsonResultWrapper.reject);
});

router.post('/:portfolioId', jwtWrapper.getJWTWithCommonSecret(), (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    return db.getController('portfolios')
        .add(_req.user.id, _req.params.portfolioId, _req.body.id, _req.body.value)
        .then(_portfolioItem => {
            return {
                id: _portfolioItem.currencyId,
                value: _portfolioItem.value
            };
        })
        .then(jsonResultWrapper.accept)
        .catch(jsonResultWrapper.reject);
});

router.put('/:portfolioId/:currencyId', jwtWrapper.getJWTWithCommonSecret(), (_req, _res) => {
    const jsonResultWrapper = sendJsonResult(_res);

    return db.getController('portfolios')
        .update(_req.user.id, _req.params.portfolioId, _req.params.currencyId, _req.body.value)
        .then(jsonResultWrapper.accept)
        .catch(jsonResultWrapper.reject);
});

module.exports = router;
