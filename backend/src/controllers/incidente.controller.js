function createIncidentController(service) {
    return {
        async list(req, res) {
            const result = await service.list(req.query);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        async get(req, res) {
            const result = await service.get(req.params.id);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        async create(req, res) {
            const result = await service.create(req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(201).json(result.data);
        },
        async update(req, res) {
            const result = await service.update(req.params.id, req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        async patch(req, res) {
            const result = await service.patch(req.params.id, req.body);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(200).json(result.data);
        },
        async delete(req, res) {
            const result = await service.delete(req.params.id);
            return result.error
                ? res.status(result.error.status).json({ error: result.error })
                : res.status(204).end();
        },
    };
}

module.exports = { createIncidentController };
