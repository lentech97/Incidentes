function createIncidentController(service) {
    return {
        list(req, res) {
            const result = service.list(req.query);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        get(req, res) {
            const result = service.get(req.params.id);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        create(req, res) {
            const result = service.create(req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(201).json(result.data);
        },
        update(req, res) {
            const result = service.update(req.params.id, req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        patch(req, res) {
            const result = service.patch(req.params.id, req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        delete(req, res) {
            const result = service.delete(req.params.id);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(204).end();
        },
    };
}

module.exports = { createIncidentController };
