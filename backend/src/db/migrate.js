const fs = require('fs');
const path = require('path');
const { createDatabase } = require('../config/database');

const migrationsDirectory = path.join(__dirname, '..', '..', 'migrations');

function migrateDatabase(database) {
    database.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const applied = new Set(
        database.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version),
    );
    const migrationFiles = fs.readdirSync(migrationsDirectory)
        .filter((file) => file.endsWith('.sql'))
        .sort();

    for (const file of migrationFiles) {
        if (applied.has(file)) {
            continue;
        }

        const migration = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
        const applyMigration = database.transaction(() => {
            database.exec(migration);
            database.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
        });
        applyMigration();
        console.log(`Migración aplicada: ${file}`);
    }
}

if (require.main === module) {
    require('dotenv').config();
    const database = createDatabase();
    try {
        migrateDatabase(database);
    } finally {
        database.close();
    }
}

module.exports = { migrateDatabase };
