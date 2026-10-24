const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createTestDatabase } = require('./helpers/testDatabase');
const { createApp } = require('../src/app');
const { createUserModel } = require('../src/models/Usuario');

const jwtSecret = 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens';
const validIncident = {
    titulo: 'Intento de phishing',
    descripcion: 'Correo sospechoso reportado por un usuario.',
    tipo: 'Phishing',
    prioridad: 'Alta',
    estado: 'Pendiente',
};

describe('API de incidentes protegida', () => {
    let database;
    let app;
    let adminToken;
    let analystToken;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        database = await createTestDatabase();
        const users = createUserModel(database);
        await users.createIfMissing('admin', await bcrypt.hash('admin-password', 4), 'admin');
        await users.createIfMissing('analista', await bcrypt.hash('analyst-password', 4), 'analista');
        adminToken = jwt.sign({ sub: '1', role: 'admin', username: 'admin' }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });
        analystToken = jwt.sign({ sub: '2', role: 'analista', username: 'analista' }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });
        app = createApp({ database, jwtSecret, clientOrigin: 'http://localhost:3000' });
    });

    afterAll(async () => {
        await database.end();
        console.log.mockRestore();
    });

    test('rechaza consultas sin token o con token inválido', async () => {
        await request(app).get('/api/incidentes').expect(401);
        await request(app).get('/api/incidentes').set('Authorization', 'Bearer inválido').expect(401);
    });

    test('rechaza tokens expirados', async () => {
        const expiredToken = jwt.sign(
            { sub: '1', role: 'admin' },
            jwtSecret,
            { algorithm: 'HS256', expiresIn: -1 },
        );
        await request(app).get('/api/incidentes').set('Authorization', `Bearer ${expiredToken}`).expect(401);
    });

    test('permite iniciar sesión y no revela contraseñas', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin-password' })
            .expect(200);
        expect(response.body.token).toBeTruthy();
        expect(response.body.user).toEqual({ username: 'admin', role: 'admin' });
        expect(response.body).not.toHaveProperty('password');
        console.log.mockClear();
        await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'incorrect-password' })
            .expect(401);
        const failedLogin = console.log.mock.calls
            .map(([line]) => JSON.parse(line))
            .find((entry) => entry.event === 'login_failed');
        expect(failedLogin).toMatchObject({ level: 'WARN', username: 'admin' });
        expect(JSON.stringify(failedLogin)).not.toContain('incorrect-password');
    });

    test('limita los intentos de inicio de sesión', async () => {
        const limiterApp = createApp({ database, jwtSecret, clientOrigin: 'http://localhost:3000' });
        for (let attempt = 0; attempt < 10; attempt++) {
            await request(limiterApp)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'incorrect-password' })
                .expect(401);
        }

        const limited = await request(limiterApp)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'incorrect-password' })
            .expect(429);

        expect(limited.headers['ratelimit-limit']).toBe('10');
        expect(limited.headers['x-request-id']).toBeTruthy();
    });

    test('crea y consulta incidentes persistidos con campos generados por el servidor', async () => {
        const created = await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validIncident)
            .expect(201);
        expect(created.body.id).toBeGreaterThan(0);
        expect(created.body.fechaCreacion).toBeTruthy();

        const list = await request(app)
            .get('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(list.body).toHaveLength(1);
        expect(list.body[0].id).toBe(created.body.id);
    });

    test('valida el cuerpo antes de insertar registros', async () => {
        await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...validIncident, titulo: '' })
            .expect(422);
        const list = await request(app).get('/api/incidentes').set('Authorization', `Bearer ${adminToken}`);
        expect(list.body).toHaveLength(1);
    });

    test('aplica filtros combinados de estado y prioridad', async () => {
        await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...validIncident, titulo: 'Malware', tipo: 'Malware', prioridad: 'Media', estado: 'Resuelto' })
            .expect(201);
        const response = await request(app)
            .get('/api/incidentes?estado=Pendiente&prioridad=Alta')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].titulo).toBe(validIncident.titulo);
    });

    test('permite reemplazar y actualizar campos de un incidente', async () => {
        const created = await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validIncident);
        const updated = await request(app)
            .patch(`/api/incidentes/${created.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ estado: 'En análisis' })
            .expect(200);
        expect(updated.body.estado).toBe('En análisis');
    });

    test('reemplaza un incidente con PUT', async () => {
        const created = await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validIncident);
        const replacement = { ...validIncident, titulo: 'Incidente actualizado' };
        const updated = await request(app)
            .put(`/api/incidentes/${created.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(replacement)
            .expect(200);
        expect(updated.body.titulo).toBe(replacement.titulo);
    });

    test('distingue identificadores inválidos de recursos inexistentes', async () => {
        await request(app).get('/api/incidentes/abc').set('Authorization', `Bearer ${adminToken}`).expect(400);
        await request(app).get('/api/incidentes/999999').set('Authorization', `Bearer ${adminToken}`).expect(404);
    });

    test('impide que el analista elimine y permite que el administrador elimine', async () => {
        const created = await request(app)
            .post('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validIncident);
        await request(app)
            .delete(`/api/incidentes/${created.body.id}`)
            .set('Authorization', `Bearer ${analystToken}`)
            .expect(403);
        await request(app)
            .delete(`/api/incidentes/${created.body.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);
    });

    test('no concede lectura CORS a orígenes no autorizados', async () => {
        const response = await request(app)
            .get('/api/incidentes')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Origin', 'https://origen-no-autorizado.example')
            .expect(200);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('exige HTTPS en producción para las rutas funcionales', async () => {
        const productionApp = createApp({
            database,
            jwtSecret,
            clientOrigin: 'https://incidentes.example',
            nodeEnv: 'production',
        });

        await request(productionApp)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin-password' })
            .expect(426);
    });
});
