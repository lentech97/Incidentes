const jwt = require('jsonwebtoken');

function createAuthenticate(jwtSecret) {
    return function authenticate(req, res, next) {
        const authorization = req.get('authorization') || '';
        const [scheme, token] = authorization.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                error: { code: 'UNAUTHORIZED', message: 'Se requiere un token de acceso válido.' },
            });
        }

        try {
            req.user = jwt.verify(token, jwtSecret, {
                algorithms: ['HS256'],
            });
        } catch (error) {
            if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError' && error.name !== 'NotBeforeError') {
                return next(error);
            }
            return res.status(401).json({
                error: { code: 'UNAUTHORIZED', message: 'El token de acceso no es válido o ha expirado.' },
            });
        }
        return next();
    };
}

function requireRole(...roles) {
    return function authorize(req, res, next) {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'No tiene permisos para realizar esta operación.' },
            });
        }
        return next();
    };
}

module.exports = { createAuthenticate, requireRole };
