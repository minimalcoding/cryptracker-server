import * as knexFactory from 'knex';

export default knexFactory({
    client: 'postgresql',
    connection: {
        database: 'cryptracker',
        user: 'cryptracker',
        password: 'cryptracker'
    },
    migrations: {
        tableName: 'knex_migrations'
    }
});
