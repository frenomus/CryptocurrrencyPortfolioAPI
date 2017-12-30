'use strict';

const EncryptedField = require('sequelize-encrypted');

function Users(_sequelize, _modelName) {
    const EncryptionKey = _sequelize.ENCRYPTION_KEY ||
        '53a323b99459d670cb762c6a09ce03120f8ca2271cf097134812bb5376c9537b';

    //encrypt email address as considered PII under GDPR.
    const encryptedEmail = new EncryptedField(_sequelize.Sequelize, EncryptionKey);
    const emailVault = encryptedEmail.vault('eEmail');

    //Swap type from BLOB to VARCHAR as we know the maximum size of the vault and to help indexing.
    emailVault.type = 'VARBINARY(300)';

    //email hash ensures only one user per email exists

    const _model = {
        id: {
            type: new _sequelize.Sequelize.UUID(),
            defaultValue: _sequelize.Sequelize.UUIDV4,
            primaryKey: true
        },
        emailHash: {
            type: new _sequelize.Sequelize.STRING(64),
            allowNull: false,
            unique: true
        },
        eEmail: emailVault,
        email: encryptedEmail.field('email',
            {
                type: new _sequelize.Sequelize.CHAR(254),
                validate: {
                    len: {
                        args: [6, 254],
                        msg: 'Email address must be between 6 and 254 characters in length'
                    },
                    isEmail: { msg: 'Email address must be valid' }
                }
            }
        ),
        active: {
            type: new _sequelize.Sequelize.BOOLEAN(),
            defaultValue: false,
            allowNull: false
        },
        salt: {
            type: new _sequelize.Sequelize.UUID(),
            defaultValue: _sequelize.Sequelize.UUIDV4
        },
        password: {
            type: new _sequelize.Sequelize.STRING(64),
            allowNull: false
        },
        lockoutUntil: {
            type: new _sequelize.Sequelize.DATE(),
            allowNull: true
        },
        failedLogons: {
            type: _sequelize.tinyInt(),
            defaultValue: 0
        }

    };

    return _sequelize.define(_modelName, _model, { updatedAt: false });
}

module.exports = Users;
