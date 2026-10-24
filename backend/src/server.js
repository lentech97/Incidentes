require('dotenv').config();

const bcrypt = require('bcryptjs');
const { createDatabase } = require('./config/database');
const { migrateDatabase } = require('./db/migrate');
const { createUserModel } = require('./models/Usuario');
const { createApp } = require('./app');

function validateConfiguration(environment) {
    if (!environment.JWT_SECRET || environment.JWT_SECRET.length < 32 || environment.JWT_SECRET.startsWith('replace_with_')) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres aleatorios.');
    }
    for (const name of ['ADMIN_PASSWORD', 'ANALYST_PASSWORD']) {
        if (!environment[name] || environment[name].length < 12 || environment[name].startsWith('replace_with_')) {
            throw new Error(`${name} debe configurarse con al menos 12 caracteres.`);
        }
    }
    if (environment.ADMIN_PASSWORD === environment.ANALYST_PASSWORD) {
        throw new Error('ADMIN_PASSWORD y ANALYST_PASSWORD deben ser diferentes.');
    }
    if (!environment.CLIENT_ORIGIN) {
        throw new Error('CLIENT_ORIGIN debe definir el origen de navegador permitido.');
    }
    let clientOrigin;
    try {
        clientOrigin = new URL(environment.CLIENT_ORIGIN);
    } catch {
        throw new Error('CLIENT_ORIGIN debe ser un origen HTTP o HTTPS válido.');
    }
    if (!['http:', 'https:'].includes(clientOrigin.protocol) || clientOrigin.origin !== environment.CLIENT_ORIGIN) {
        throw new Error('CLIENT_ORIGIN debe contener solo el origen, sin ruta ni parámetros.');
    }
    const port = Number(environment.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT debe ser un número de puerto válido.');
    }
    return port;
}

async function start() {
    const port = validateConfiguration(process.env);
    const database = createDatabase();
    await migrateDatabase(database);

    const users = createUserModel(database);
    const initialUsers = [
        ['admin', process.env.ADMIN_PASSWORD, 'admin'],
        ['analista', process.env.ANALYST_PASSWORD, 'analista'],
    ];
    for (const [username, password, role] of initialUsers) {
        await users.createIfMissing(username, await bcrypt.hash(password, 12), role);
    }

    const app = createApp({
        database,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
        clientOrigin: process.env.CLIENT_ORIGIN,
        nodeEnv: process.env.NODE_ENV || 'development',
    });
    const server = app.listen(port, () => {
        console.log(`Servidor ejecutándose en http://localhost:${port}`);
        if ((process.env.NODE_ENV || 'development') !== 'production') {
            console.log('Usuarios iniciales: admin y analista (contraseñas configuradas en .env).');
        }
    });

    const shutdown = () => {
        server.close(async () => {
            await database.end();
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

if (require.main === module) {
    start().catch((error) => {
        console.error(`No se pudo iniciar la aplicación: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { start, validateConfiguration };
