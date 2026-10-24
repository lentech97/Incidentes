const express = require('express');
const { createIncidentController } = require('../controllers/incidente.controller');
const { requireRole } = require('../middleware/authenticate');

function createIncidentRouter(service) {
    const router = express.Router();
    const controller = createIncidentController(service);

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.patch('/:id', controller.patch);
    router.delete('/:id', requireRole('admin'), controller.delete);
    return router;
}

module.exports = { createIncidentRouter };
