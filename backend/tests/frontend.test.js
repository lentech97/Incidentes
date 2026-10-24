const request = require('supertest');
const Database = require('better-sqlite3');
const { migrateDatabase } = require('../src/db/migrate');
const { createApp } = require('../src/app');

describe('frontend servido desde su carpeta', () => {
    let database;
    let app;

    beforeAll(() => {
        database = new Database(':memory:');
        migrateDatabase(database);
        app = createApp({
            database,
            jwtSecret: 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens',
        });
    });

    afterAll(() => {
        database.close();
    });

    test('sirve la página principal y sus recursos estáticos', async () => {
        const page = await request(app).get('/').expect(200);
        expect(page.text).toContain('<title>CyberShield Monitor</title>');

        await request(app).get('/css/styles.css').expect(200);
        await request(app).get('/js/app.js').expect(200);
    });
});
