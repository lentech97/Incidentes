const request = require('supertest');
const Database = require('better-sqlite3');
const { migrateDatabase } = require('../src/db/migrate');
const { createApp } = require('../src/app');

const jwtSecret = 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens';

describe('ruta de salud', () => {
    let database;
    let app;

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        database = new Database(':memory:');
        migrateDatabase(database);
        app = createApp({ database, jwtSecret });
    });

    afterAll(() => {
        database.close();
        console.log.mockRestore();
    });

    test('responde 200 sin autenticación y devuelve el identificador de solicitud', async () => {
        const response = await request(app).get('/health').expect(200);

        expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
        expect(response.body.uptime).toEqual(expect.any(Number));
        expect(response.headers['x-request-id']).toEqual(expect.any(String));
    });

    test('no exige HTTPS en producción', async () => {
        const productionApp = createApp({
            database,
            jwtSecret,
            clientOrigin: 'https://incidentes.example',
            nodeEnv: 'production',
        });

        await request(productionApp)
            .get('/health')
            .expect(200)
            .expect(({ body }) => expect(body.status).toBe('ok'));
    });

    test('responde 503 si la base de datos no está disponible', async () => {
        const unavailableDatabase = {
            prepare(query) {
                if (query === 'SELECT 1') {
                    throw new Error('db caída');
                }
                return { all() {}, get() {}, run() {} };
            },
        };
        const failingApp = createApp({ database: unavailableDatabase, jwtSecret });

        const response = await request(failingApp).get('/health').expect(503);

        expect(response.body).toEqual({ status: 'error', database: 'unavailable' });
    });
});
