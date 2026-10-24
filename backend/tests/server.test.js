jest.mock('../src/config/database', () => ({ createDatabase: jest.fn() }));
jest.mock('../src/db/migrate', () => ({ migrateDatabase: jest.fn() }));
jest.mock('../src/models/Usuario', () => ({ createUserModel: jest.fn() }));
jest.mock('../src/app', () => ({ createApp: jest.fn() }));

const bcrypt = require('bcryptjs');
const { createDatabase } = require('../src/config/database');
const { migrateDatabase } = require('../src/db/migrate');
const { createUserModel } = require('../src/models/Usuario');
const { createApp } = require('../src/app');
const { start } = require('../src/server');

const environment = {
    PORT: '3101',
    NODE_ENV: 'production',
    DATABASE_URL: 'sqlite:./data/test.sqlite',
    JWT_SECRET: 'a-randomized-secret-with-at-least-32-characters',
    JWT_EXPIRES_IN: '1h',
    CLIENT_ORIGIN: 'https://incidentes.example',
    ADMIN_PASSWORD: 'a-distinct-admin-password',
    ANALYST_PASSWORD: 'a-distinct-analyst-password',
};

function setEnvironment(values) {
    const previous = {};
    for (const [key, value] of Object.entries(values)) {
        previous[key] = process.env[key];
        process.env[key] = value;
    }
    return () => {
        for (const key of Object.keys(values)) {
            if (previous[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = previous[key];
            }
        }
    };
}

describe('arranque del servidor', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    test('configura la base, usuarios, aplicación y cierre ordenado', async () => {
        const restoreEnvironment = setEnvironment(environment);
        const database = { close: jest.fn() };
        const users = { createIfMissing: jest.fn() };
        const server = { close: jest.fn((callback) => callback()) };
        const app = {
            listen: jest.fn((port, callback) => {
                callback();
                return server;
            }),
        };
        createDatabase.mockReturnValue(database);
        createUserModel.mockReturnValue(users);
        createApp.mockReturnValue(app);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('password-hash');
        jest.spyOn(console, 'log').mockImplementation(() => {});
        const existingSigint = process.listeners('SIGINT');
        const existingSigterm = process.listeners('SIGTERM');
        const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

        try {
            await start();

            expect(migrateDatabase).toHaveBeenCalledWith(database);
            expect(users.createIfMissing).toHaveBeenNthCalledWith(1, 'admin', 'password-hash', 'admin');
            expect(users.createIfMissing).toHaveBeenNthCalledWith(2, 'analista', 'password-hash', 'analista');
            expect(createApp).toHaveBeenCalledWith(expect.objectContaining({
                database,
                jwtSecret: environment.JWT_SECRET,
                clientOrigin: environment.CLIENT_ORIGIN,
                nodeEnv: 'production',
            }));
            expect(app.listen).toHaveBeenCalledWith(3101, expect.any(Function));

            const shutdown = process.listeners('SIGTERM').find((listener) => !existingSigterm.includes(listener));
            expect(shutdown).toEqual(expect.any(Function));
            shutdown();
            expect(server.close).toHaveBeenCalled();
            expect(database.close).toHaveBeenCalled();
            expect(exit).toHaveBeenCalledWith(0);
        } finally {
            for (const listener of process.listeners('SIGINT')) {
                if (!existingSigint.includes(listener)) {
                    process.removeListener('SIGINT', listener);
                }
            }
            for (const listener of process.listeners('SIGTERM')) {
                if (!existingSigterm.includes(listener)) {
                    process.removeListener('SIGTERM', listener);
                }
            }
            restoreEnvironment();
        }
    });

    test('detiene el arranque si la configuración no es válida', async () => {
        const restoreEnvironment = setEnvironment({ ...environment, JWT_SECRET: 'short' });
        try {
            await expect(start()).rejects.toThrow('JWT_SECRET');
            expect(createDatabase).not.toHaveBeenCalled();
        } finally {
            restoreEnvironment();
        }
    });
});
