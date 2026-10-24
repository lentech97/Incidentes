const {
    isValidId,
    validateFilters,
    validateIncident,
} = require('../src/validators/incidente.validator');
const { createIncidentService } = require('../src/services/incidente.service');

const validIncident = () => ({
    titulo: 'Intento de phishing',
    descripcion: 'Correo sospechoso reportado por un usuario.',
    tipo: 'Phishing',
    prioridad: 'Alta',
    estado: 'Pendiente',
});

test('acepta un incidente válido', () => {
    expect(validateIncident(validIncident()))
        .toEqual({ valid: true, errors: {} });
});

    test('rechaza un título vacío', () => {
        expect(validateIncident({ ...validIncident(), titulo: '  ' }).valid).toBe(false);
    });

    test('rechaza una descripción vacía', () => {
        expect(validateIncident({ ...validIncident(), descripcion: '  ' }).valid).toBe(false);
    });

    test('rechaza una prioridad no permitida', () => {
        expect(validateIncident({ ...validIncident(), prioridad: 'Urgente' }).errors.prioridad).toBeTruthy();
    });

    test('rechaza un estado no permitido', () => {
        expect(validateIncident({ ...validIncident(), estado: 'Cerrado' }).errors.estado).toBeTruthy();
    });

    test('valida identificadores enteros positivos', () => {
        expect(isValidId('1')).toBe(true);
        expect(isValidId('0')).toBe(false);
        expect(isValidId('1.5')).toBe(false);
        expect(isValidId('abc')).toBe(false);
    });

    test('rechaza filtros fuera de las opciones admitidas', () => {
        expect(validateFilters({ estado: 'Pendiente', prioridad: 'Alta' }).valid).toBe(true);
        expect(validateFilters({ estado: 'Cerrado' }).valid).toBe(false);
    });


describe('filtros del servicio', () => {
    test('reenvía estado y prioridad para filtrar conjuntamente', async () => {
        const model = { list: jest.fn().mockResolvedValue([]) };
        const service = createIncidentService(model);

        expect(await service.list({ estado: 'Pendiente', prioridad: 'Alta' })).toEqual({ data: [] });
        expect(model.list).toHaveBeenCalledWith({ estado: 'Pendiente', prioridad: 'Alta' });
    });

    test('rechaza filtros inválidos sin consultar el modelo', async () => {
        const model = { list: jest.fn() };
        const result = await createIncidentService(model).list({ prioridad: 'Urgente' });

        expect(result.error.status).toBe(422);
        expect(model.list).not.toHaveBeenCalled();
    });
});
