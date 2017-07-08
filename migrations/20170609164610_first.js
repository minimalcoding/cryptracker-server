const R = require('ramda');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactions', table => {
        table.string('id').primary();
        table.string('ref_id');
        table.string('type');
        table.timestamp('time');
        table.specificType('amount', 'numeric');
        table.specificType('fee', 'numeric');
        table.specificType('rate', 'numeric');
        table.string('asset');
        table.string('location');

        table.string('address');
        table.string('transaction_hash');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transactions');
};
