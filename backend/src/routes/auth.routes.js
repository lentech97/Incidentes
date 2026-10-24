const express = require('express');
const { createAuthController } = require('../controllers/auth.controller');

function createAuthRouter(authService) {
    const router = express.Router();
    router.post('/login', createAuthController(authService).login);
    return router;
}

module.exports = { createAuthRouter };
