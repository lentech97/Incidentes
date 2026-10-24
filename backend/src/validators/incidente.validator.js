const TIPOS_INCIDENTE = ['Phishing', 'Malware', 'Acceso no autorizado', 'Otro'];
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];
const ESTADOS = ['Pendiente', 'En análisis', 'Resuelto'];
const CAMPOS_EDITABLES = ['titulo', 'descripcion', 'tipo', 'prioridad', 'estado'];

function validateIncident(input, { partial = false } = {}) {
    const errors = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return { valid: false, errors: { body: 'El cuerpo debe ser un objeto JSON.' } };
    }

    const allowedFields = new Set(CAMPOS_EDITABLES);
    const unexpectedFields = Object.keys(input).filter((field) => !allowedFields.has(field));
    if (unexpectedFields.length) {
        errors.body = 'El cuerpo contiene campos no permitidos.';
    }

    for (const field of CAMPOS_EDITABLES) {
        if (!Object.hasOwn(input, field)) {
            if (!partial) {
                errors[field] = 'Este campo es obligatorio.';
            }
            continue;
        }

        const value = input[field];
        if (typeof value !== 'string') {
            errors[field] = 'Debe ser texto.';
            continue;
        }

        const normalized = value.trim();
        if (field === 'titulo' && (!normalized || normalized.length > 120)) {
            errors[field] = 'El título es obligatorio y no puede superar 120 caracteres.';
        } else if (field === 'descripcion' && (!normalized || normalized.length > 2000)) {
            errors[field] = 'La descripción es obligatoria y no puede superar 2000 caracteres.';
        } else if (field === 'tipo' && !TIPOS_INCIDENTE.includes(normalized)) {
            errors[field] = 'El tipo de incidente no es válido.';
        } else if (field === 'prioridad' && !PRIORIDADES.includes(normalized)) {
            errors[field] = 'La prioridad indicada no es válida.';
        } else if (field === 'estado' && !ESTADOS.includes(normalized)) {
            errors[field] = 'El estado indicado no es válido.';
        } else {
            input[field] = normalized;
        }
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

function isValidId(id) {
    return /^[1-9]\d*$/.test(String(id)) && Number.isSafeInteger(Number(id));
}

function validateFilters(filters) {
    if (filters.estado && !ESTADOS.includes(filters.estado)) {
        return { valid: false, message: 'El filtro de estado no es válido.' };
    }
    if (filters.prioridad && !PRIORIDADES.includes(filters.prioridad)) {
        return { valid: false, message: 'El filtro de prioridad no es válido.' };
    }
    return { valid: true };
}

module.exports = {
    CAMPOS_EDITABLES,
    ESTADOS,
    PRIORIDADES,
    TIPOS_INCIDENTE,
    isValidId,
    validateFilters,
    validateIncident,
};
