const { log } = require('../middleware/requestLogger');

function createAuthController(authService) {
    return {
        async login(req, res) {
            const { username, password } = req.body || {};
            if (
                typeof username !== 'string'
                || typeof password !== 'string'
                || !username.trim()
                || !password
            ) {
                return res.status(422).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'El usuario y la contraseña son obligatorios.',
                    },
                });
            }

            const session = await authService.login(username.trim(), password);
            if (!session) {
                log('WARN', 'login_failed', {
                    requestId: req.id,
                    username: username.trim().slice(0, 50),
                });
                return res.status(401).json({
                    error: { code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos.' },
                });
            }
            return res.status(200).json(session);
        },
    };
}

module.exports = { createAuthController };
