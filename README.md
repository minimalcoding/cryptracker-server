# Cryptracker

## Features

* Import Kraken ledgers
* Import Coinbase transactions files
* Import ETH and BTC addresses (up to 200 transactions per addresses for the moment)
* Create transactions manually
* Returns all the normalized transactions

## Developing

You have to install Docker, NodeJS v8, NPM v5 and Yarn.
On a mac you can install all of them with brew.
On windows... well good luck.

You need to install the dependencies with `yarn install`

You need a Redis (for caching the vendors API) and a PostgreSQL (for regular storage) containers.

You must create a database in PostgreSQL named 'cryptracker' with a role 'cryptracker' and a password 'cryptracker'.

Then you have to install knex globally with the command `npm i -g knex`
Then you must run the migrations with `knex migrate:latest`

This will create the tables. For the moment there is only one table: transactions.

Then you have to start the building process and the server.
You can use pm2 for that: just install pm2 globally with `npm i -g pm2`
Then you can run `yarn start` and the package.json file is configured to launch both processes.

The first time it will fail, this is normal, its because the compilation and and the server starts at the same time and the server fails because the compilation is not finished.
Just run `pm2 delete all` in order to stop the processes and `yarn start` again to relaunch them, it should work now.
