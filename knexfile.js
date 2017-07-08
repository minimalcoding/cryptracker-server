module.exports = {
    development: {
        client: 'postgresql',
        connection: {
            database: 'cryptracker',
            user: 'cryptracker',
            password: 'cryptracker'
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};
