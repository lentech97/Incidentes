const { createDatabase, sslOptionsFor, validateDatabaseUrl } = require('../src/config/database');
const { TEST_DATABASE_URL } = require('./helpers/testDatabase');

describe('configuración de PostgreSQL', () => {
    test('acepta URLs de PostgreSQL y rechaza las faltantes o mal formadas', () => {
        expect(validateDatabaseUrl('postgresql://u:p@localhost:5432/db').hostname).toBe('localhost');
        expect(validateDatabaseUrl('postgres://u:p@host/db').hostname).toBe('host');
        expect(() => validateDatabaseUrl()).toThrow('DATABASE_URL');
        expect(() => validateDatabaseUrl('sqlite:./data/db.sqlite')).toThrow('DATABASE_URL');
    });

    test('usa TLS solo cuando el host es externo o se fuerza', () => {
        const local = new URL('postgresql://u:p@localhost:5432/db');
        const interna = new URL('postgresql://u:p@dpg-abc123-a/db');
        const externa = new URL('postgresql://u:p@dpg-abc123-a.oregon-postgres.render.com/db');

        expect(sslOptionsFor(local, {})).toBe(false);
        expect(sslOptionsFor(interna, {})).toBe(false);
        expect(sslOptionsFor(externa, {})).toEqual({ rejectUnauthorized: false });
        expect(sslOptionsFor(local, { DATABASE_SSL: 'true' })).toEqual({ rejectUnauthorized: false });
        expect(sslOptionsFor(externa, { DATABASE_SSL: 'false' })).toBe(false);
    });

    test('se conecta a la base de pruebas', async () => {
        const database = createDatabase(TEST_DATABASE_URL);
        try {
            const { rows } = await database.query('SELECT 1 AS resultado');
            expect(rows[0].resultado).toBe(1);
        } finally {
            await database.end();
        }
    });
});
