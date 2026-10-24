const { log } = require('./requestLogger');

function notFoundHandler(req, res) {
    return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' },
    });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    log('ERROR', 'unhandled_exception', {
        requestId: req.id,
        name: error.name,
        message: error.message,
    });
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: { code: 'INVALID_JSON', message: 'El cuerpo JSON de la solicitud no es válido.' },
        });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la solicitud supera el límite permitido.' },
        });
    }

    return res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Ocurrió un error interno. Inténtelo más tarde.',
            requestId: req.id,
        },
    });
}

module.exports = { errorHandler, notFoundHandler };
