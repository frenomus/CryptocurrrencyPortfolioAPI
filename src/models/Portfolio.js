'use strict';

function Portfolio(_sequelize, _modelName) {
    const _model = {
        id: {
            type: new _sequelize.Sequelize.UUID(),
            defaultValue: _sequelize.Sequelize.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: new _sequelize.Sequelize.UUID(),
            allowNull: false,
            unique: 'holding'
        },
        portfolioId: {
            type: new _sequelize.Sequelize.TINYINT(3),
            allowNull: false,
            defaultValue: 1,
            unique: 'holding'
        },
        currencyId: {
            type: new _sequelize.Sequelize.CHAR(64),
            allowNull: false,
            unique: 'holding'
        },
        value: {
            type: new _sequelize.Sequelize.DECIMAL(),
            allowNull: false
        }
    };

    return _sequelize.define(_modelName, _model);
}

module.exports = Portfolio;
