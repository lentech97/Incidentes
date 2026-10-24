const { createDatabase } = require('../../src/config/database');
const { migrateDatabase } = require('../../src/db/migrate');

const TEST_DATABASE_URL = process.env.DATABASE_URL
    || 'postgresql://postgres:postgres@localhost:5432/incidentes_test';

async function createTestDatabase() {
    const database = createDatabase(TEST_DATABASE_URL);
    // Parte de una base limpia para que cada suite ejercite las migraciones completas.
    await database.query('DROP TABLE IF EXISTS incidentes, usuarios, schema_migrations CASCADE');
    await migrateDatabase(database);
    return database;
}

module.exports = { createTestDatabase, TEST_DATABASE_URL };
