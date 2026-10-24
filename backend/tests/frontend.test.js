const request = require('supertest');
const { createTestDatabase } = require('./helpers/testDatabase');
const { createApp } = require('../src/app');

describe('frontend servido desde su carpeta', () => {
    let database;
    let app;

    beforeAll(async () => {
        database = await createTestDatabase();
        app = createApp({
            database,
            jwtSecret: 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens',
        });
    });

    afterAll(async () => {
        await database.end();
    });

    test('sirve la página principal y sus recursos estáticos', async () => {
        const page = await request(app).get('/').expect(200);
        expect(page.text).toContain('<title>CyberShield Monitor</title>');

        await request(app).get('/css/styles.css').expect(200);
        await request(app).get('/js/app.js').expect(200);
    });
});
