const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function databasePathFromUrl(databaseUrl) {
    if (!databaseUrl || !databaseUrl.startsWith('sqlite:')) {
        throw new Error('DATABASE_URL debe usar el formato sqlite:./ruta/archivo.sqlite.');
    }

    const configuredPath = databaseUrl.slice('sqlite:'.length);
    if (!configuredPath) {
        throw new Error('DATABASE_URL debe incluir la ruta del archivo SQLite.');
    }

    return path.resolve(process.cwd(), configuredPath);
}

function createDatabase(databaseUrl = process.env.DATABASE_URL) {
    const databasePath = databasePathFromUrl(databaseUrl);
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });

    const database = new Database(databasePath);
    database.pragma('foreign_keys = ON');
    database.pragma('journal_mode = WAL');
    return database;
}

module.exports = { createDatabase, databasePathFromUrl };
