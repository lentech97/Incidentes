const { EventEmitter } = require('events');
const { errorHandler } = require('../src/middleware/errorHandler');
const { requestLogger } = require('../src/middleware/requestLogger');

describe('registro estructurado de solicitudes', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('asigna un ID de solicitud y registra la ruta sin query string', () => {
        const output = jest.spyOn(console, 'log').mockImplementation(() => {});
        const request = { method: 'GET', originalUrl: '/api/incidentes?estado=Pendiente' };
        const response = new EventEmitter();
        response.setHeader = jest.fn();
        response.statusCode = 200;
        const next = jest.fn();

        requestLogger(request, response, next);
        response.emit('finish');

        expect(request.id).toEqual(expect.any(String));
        expect(response.setHeader).toHaveBeenCalledWith('X-Request-Id', request.id);
        expect(next).toHaveBeenCalled();
        const entry = JSON.parse(output.mock.calls[0][0]);
        expect(entry).toMatchObject({
            level: 'INFO',
            event: 'request',
            requestId: request.id,
            method: 'GET',
            route: '/api/incidentes',
            status: 200,
        });
        expect(entry.ts).toEqual(expect.any(String));
        expect(entry.durationMs).toEqual(expect.any(Number));
    });

    test('incluye el ID de solicitud en respuestas 500 sin devolver detalles internos', () => {
        const output = jest.spyOn(console, 'error').mockImplementation(() => {});
        const request = { id: 'request-123' };
        const response = {
            headersSent: false,
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        errorHandler(new Error('detalle interno'), request, response, jest.fn());

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Ocurrió un error interno. Inténtelo más tarde.',
                requestId: 'request-123',
            },
        });
        const entry = JSON.parse(output.mock.calls[0][0]);
        expect(entry).toMatchObject({
            level: 'ERROR',
            event: 'unhandled_exception',
            requestId: 'request-123',
            message: 'detalle interno',
        });
        expect(entry).not.toHaveProperty('stack');
    });
});
