const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { createAuthenticate } = require('./middleware/authenticate');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { createIncidentRouter } = require('./routes/incidente.routes');
const { createAuthRouter } = require('./routes/auth.routes');
const { createIncidentModel } = require('./models/Incidente');
const { createUserModel } = require('./models/Usuario');
const { createIncidentService } = require('./services/incidente.service');
const { createAuthService } = require('./services/auth.service');

function createApp({ database, jwtSecret, jwtExpiresIn = '1h', clientOrigin = 'http://localhost:3000', nodeEnv = 'development' }) {
    if (!database || !jwtSecret) {
        throw new Error('La base de datos y JWT_SECRET son obligatorios para configurar la aplicación.');
    }

    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', process.env.TRUST_PROXY === '1');
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'same-site' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'https://images.unsplash.com', 'data:'],
                styleSrc: ["'self'"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'"],
                baseUri: ["'self'"],
                objectSrc: ["'none'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
            },
        },
    }));
    app.use(cors({
        origin(origin, callback) {
            callback(null, !origin || origin === clientOrigin);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(requestLogger);
    app.get('/health', async (req, res) => {
        try {
            await database.query('SELECT 1');
            return res.status(200).json({
                status: 'ok',
                database: 'ok',
                uptime: Math.round(process.uptime()),
            });
        } catch {
            return res.status(503).json({ status: 'error', database: 'unavailable' });
        }
    });
    app.use(express.json({ limit: '20kb', strict: true }));

    if (nodeEnv === 'production') {
        app.use((req, res, next) => {
            if (req.secure) {
                return next();
            }
            return res.status(426).json({
                error: { code: 'HTTPS_REQUIRED', message: 'Esta aplicación requiere una conexión HTTPS.' },
            });
        });
    }

    app.use(express.static(path.join(__dirname, '..', '..', 'frontend'), {
        maxAge: nodeEnv === 'production' ? '1h' : 0,
    }));

    const authenticate = createAuthenticate(jwtSecret);
    const authService = createAuthService(createUserModel(database), {
        jwtSecret,
        expiresIn: jwtExpiresIn,
    });
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/auth/login', loginLimiter);
    app.use('/api/auth', createAuthRouter(authService));
    app.use('/api/incidentes', authenticate, createIncidentRouter(createIncidentService(createIncidentModel(database))));
    app.use('/api', notFoundHandler);
    app.use(errorHandler);
    return app;
}

module.exports = { createApp };
