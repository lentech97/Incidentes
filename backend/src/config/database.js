const { Pool } = require('pg');

function validateDatabaseUrl(databaseUrl) {
    if (!databaseUrl || !/^postgres(ql)?:\/\//.test(databaseUrl)) {
        throw new Error('DATABASE_URL debe usar el formato postgresql://usuario:clave@host:5432/base.');
    }
    return new URL(databaseUrl);
}

function sslOptionsFor(url, environment = process.env) {
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    const forced = environment.DATABASE_SSL === 'true';
    const disabled = environment.DATABASE_SSL === 'false';
    // La URL externa de Render exige TLS; la interna (sin punto en el host) no lo necesita.
    const needsTls = forced || (!disabled && !isLocal && url.hostname.includes('.'));
    return needsTls ? { rejectUnauthorized: false } : false;
}

function createDatabase(databaseUrl = process.env.DATABASE_URL) {
    const url = validateDatabaseUrl(databaseUrl);
    return new Pool({
        connectionString: databaseUrl,
        ssl: sslOptionsFor(url),
        max: 10,
    });
}

module.exports = { createDatabase, sslOptionsFor, validateDatabaseUrl };
