const { isValidId, validateFilters, validateIncident } = require('../validators/incidente.validator');

function createIncidentService(model) {
    return {
        list(filters) {
            const filterValidation = validateFilters(filters);
            if (!filterValidation.valid) {
                return { error: { status: 422, code: 'VALIDATION_ERROR', message: filterValidation.message } };
            }
            return { data: model.list(filters) };
        },
        get(id) {
            if (!isValidId(id)) {
                return { error: { status: 400, code: 'INVALID_ID', message: 'El identificador debe ser un entero positivo.' } };
            }
            const incident = model.findById(Number(id));
            return incident
                ? { data: incident }
                : { error: { status: 404, code: 'NOT_FOUND', message: 'No se encontró el incidente solicitado.' } };
        },
        create(input) {
            const validation = validateIncident(input);
            if (!validation.valid) {
                return { error: { status: 422, code: 'VALIDATION_ERROR', message: 'Los datos del incidente no son válidos.', details: validation.errors } };
            }
            return { data: model.create(input) };
        },
        update(id, input) {
            if (!isValidId(id)) {
                return { error: { status: 400, code: 'INVALID_ID', message: 'El identificador debe ser un entero positivo.' } };
            }
            const validation = validateIncident(input);
            if (!validation.valid) {
                return { error: { status: 422, code: 'VALIDATION_ERROR', message: 'Los datos del incidente no son válidos.', details: validation.errors } };
            }
            const incident = model.update(Number(id), input);
            return incident
                ? { data: incident }
                : { error: { status: 404, code: 'NOT_FOUND', message: 'No se encontró el incidente solicitado.' } };
        },
        patch(id, input) {
            if (!isValidId(id)) {
                return { error: { status: 400, code: 'INVALID_ID', message: 'El identificador debe ser un entero positivo.' } };
            }
            if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length === 0) {
                return { error: { status: 422, code: 'VALIDATION_ERROR', message: 'Indique al menos un campo para actualizar.' } };
            }
            const existing = model.findById(Number(id));
            if (!existing) {
                return { error: { status: 404, code: 'NOT_FOUND', message: 'No se encontró el incidente solicitado.' } };
            }
            const validation = validateIncident(input, { partial: true });
            if (!validation.valid) {
                return { error: { status: 422, code: 'VALIDATION_ERROR', message: 'Los datos del incidente no son válidos.', details: validation.errors } };
            }
            const updated = model.update(Number(id), { ...existing, ...input });
            return { data: updated };
        },
        delete(id) {
            if (!isValidId(id)) {
                return { error: { status: 400, code: 'INVALID_ID', message: 'El identificador debe ser un entero positivo.' } };
            }
            return model.delete(Number(id))
                ? { deleted: true }
                : { error: { status: 404, code: 'NOT_FOUND', message: 'No se encontró el incidente solicitado.' } };
        },
    };
}

module.exports = { createIncidentService };
