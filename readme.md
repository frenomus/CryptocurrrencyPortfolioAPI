# Cryptocurrency portfolio manager API

## Pre usage setup
Please run ```npm install``` to get started.

This system uses MySQL via the Sequelize ORM. 
It defaults to connecting with the following settings.
```
{
        connectionLimit: process.env.DB_CONN_LIMIT || 10,
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'dev',
        password: process.env.DB_PASSWD || 'c4i2N1pjzpFR?q9x!Nhy',
        database: process.env.DB_NAME || 'crypto-api',
        seqOptions: {
            retry: {
                match: 'ER_LOCK_DEADLOCK: Deadlock found when trying to get lock; ' +
                'try restarting transaction', max: 5
            }
        }
    }
```

### Optional: create the default mysql user / schema
```
CREATE USER 'dev'@'localhost' IDENTIFIED BY 'c4i2N1pjzpFR?q9x!Nhy';
CREATE SCHEMA `crypto-api` CHARACTER SET latin1 COLLATE latin1_swedish_ci;
GRANT ALL ON `crypto-api`.* TO 'dev'@'localhost';
FLUSH PRIVILEGES;
```

You can override each by changing the file src/libs/linkWithDB.js 
or providing the relevant ENV overrides.

## Run (dev)
```
node src/bin/www
```

## Run (production test)
```
export TZ=utc
ENCRYPTION_KEY=#INSERT_64CHAR_ENCRYPTION_KEY_HERE# NODE_ENV=production node src/bin/www
```
