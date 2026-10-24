const crypto = require('crypto');

function log(level, event, fields = {}) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
    (level === 'ERROR' ? console.error : console.log)(line);
}

function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);

    res.on('finish', () => {
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        log(level, 'request', {
            requestId: req.id,
            method: req.method,
            route: req.originalUrl.split('?')[0],
            status: res.statusCode,
            durationMs: Number((Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(2)),
        });
    });
    next();
}

module.exports = { log, requestLogger };
