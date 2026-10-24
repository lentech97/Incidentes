const { validateConfiguration } = require('../src/server');

const validEnvironment = () => ({
    JWT_SECRET: 'randomized-secret-with-at-least-32-characters',
    ADMIN_PASSWORD: 'distinct-admin-password',
    ANALYST_PASSWORD: 'distinct-analyst-password',
    CLIENT_ORIGIN: 'https://incidentes.example',
    PORT: '3000',
});

describe('validación de configuración', () => {
    test('acepta configuración completa y devuelve el puerto', () => {
        expect(validateConfiguration(validEnvironment())).toBe(3000);
    });

    test('rechaza secretos ilustrativos y contraseñas iguales', () => {
        expect(() => validateConfiguration({
            ...validEnvironment(),
            JWT_SECRET: 'replace_with_a_random_secret_of_at_least_32_characters',
        })).toThrow('JWT_SECRET');
        expect(() => validateConfiguration({
            ...validEnvironment(),
            ANALYST_PASSWORD: 'distinct-admin-password',
        })).toThrow('deben ser diferentes');
    });

    test('requiere un origen explícito sin rutas', () => {
        expect(() => validateConfiguration({
            ...validEnvironment(),
            CLIENT_ORIGIN: 'https://incidentes.example/app',
        })).toThrow('solo el origen');
    });
});
