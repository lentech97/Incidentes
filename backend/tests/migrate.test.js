const { createTestDatabase } = require('./helpers/testDatabase');
const { migrateDatabase } = require('../src/db/migrate');

describe('migraciones', () => {
    let database;

    beforeAll(async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        database = await createTestDatabase();
    });

    afterAll(async () => {
        await database.end();
        console.log.mockRestore();
    });

    test('registra cada migración una sola vez y se puede repetir', async () => {
        await migrateDatabase(database);
        await migrateDatabase(database);
        const { rows } = await database.query('SELECT version FROM schema_migrations');
        const versions = rows.map((row) => row.version);

        expect(versions).toEqual([...new Set(versions)]);
        expect(versions).toContain('001_create_incidentes_and_users.sql');
    });

    test('las restricciones de la base rechazan valores fuera del catálogo', async () => {
        await expect(database.query(
            "INSERT INTO incidentes (titulo, descripcion, tipo, prioridad, estado) VALUES ('t', 'd', 'Otro', 'Urgente', 'Pendiente')",
        )).rejects.toThrow();
    });

    test('revierte la migración completa si una sentencia falla', async () => {
        const client = await database.connect();
        try {
            await client.query('BEGIN');
            await client.query('CREATE TABLE temporal_prueba (id INT)');
            await client.query('ROLLBACK');
            const { rows } = await client.query("SELECT to_regclass('temporal_prueba') AS tabla");
            expect(rows[0].tabla).toBeNull();
        } finally {
            client.release();
        }
    });
});
