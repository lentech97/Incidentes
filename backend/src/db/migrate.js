const fs = require('fs');
const path = require('path');
const { createDatabase } = require('../config/database');

const migrationsDirectory = path.join(__dirname, '..', '..', 'migrations');

async function migrateDatabase(database) {
    await database.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const { rows } = await database.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.version));
    const migrationFiles = fs.readdirSync(migrationsDirectory)
        .filter((file) => file.endsWith('.sql'))
        .sort();

    for (const file of migrationFiles) {
        if (applied.has(file)) {
            continue;
        }

        const migration = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
        const client = await database.connect();
        try {
            await client.query('BEGIN');
            await client.query(migration);
            await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`Migración aplicada: ${file}`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

if (require.main === module) {
    require('dotenv').config();
    const database = createDatabase();
    migrateDatabase(database)
        .catch((error) => {
            console.error(`No se pudo migrar la base de datos: ${error.message}`);
            process.exitCode = 1;
        })
        .finally(() => database.end());
}

module.exports = { migrateDatabase };
