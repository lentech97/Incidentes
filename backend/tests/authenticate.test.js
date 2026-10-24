
const { requireRole } = require('../src/middleware/authenticate');

function ejecutarMiddleware(rol, rolesPermitidos) {
    const req = { user: { role: rol } };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();
    requireRole(...rolesPermitidos)(req, res, next);

    return { req, res, next };
}

describe('Autorización por roles', () => {
    test('permite la operación al administrador', () => {
        const { res, next } = ejecutarMiddleware('admin', ['admin']);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('rechaza la operación al analista', () => {
        const { res, next } = ejecutarMiddleware('analyst', ['admin']);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'FORBIDDEN',
                message: 'No tiene permisos para realizar esta operación.',
            },
        });
        expect(next).not.toHaveBeenCalled();
    });
});
