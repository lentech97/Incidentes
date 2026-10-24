const fs = require('fs');
const os = require('os');
const path = require('path');
const { createDatabase, databasePathFromUrl } = require('../src/config/database');

describe('configuración de SQLite', () => {
    let temporaryDirectory;

    afterEach(() => {
        if (temporaryDirectory) {
            fs.rmSync(temporaryDirectory, { recursive: true, force: true });
            temporaryDirectory = undefined;
        }
    });

    test('resuelve rutas relativas y rechaza URLs faltantes o mal formadas', () => {
        expect(databasePathFromUrl('sqlite:./data/incidentes.sqlite'))
            .toBe(path.resolve(process.cwd(), './data/incidentes.sqlite'));
        expect(() => databasePathFromUrl()).toThrow('DATABASE_URL');
        expect(() => databasePathFromUrl('postgres://localhost/db')).toThrow('DATABASE_URL');
        expect(() => databasePathFromUrl('sqlite:')).toThrow('incluir la ruta');
    });

    test('crea una base SQLite y habilita claves foráneas', () => {
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'incidentes-seguros-'));
        const databaseFile = path.join(temporaryDirectory, 'db.sqlite');
        const database = createDatabase(`sqlite:${databaseFile}`);
        try {
            expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
            expect(database.prepare('SELECT 1 AS resultado').get().resultado).toBe(1);
        } finally {
            database.close();
        }
    });
});
