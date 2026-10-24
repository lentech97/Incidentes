
const INCIDENT_COLUMNS = `
    id,
    titulo,
    descripcion,
    tipo,
    prioridad,
    estado,
    fecha_creacion AS fechaCreacion
`;

function createIncidentModel(database) {
    const selectAll = database.prepare(`
        SELECT ${INCIDENT_COLUMNS}
        FROM incidentes
        WHERE (@estado IS NULL OR estado = @estado)
          AND (@prioridad IS NULL OR prioridad = @prioridad)
        ORDER BY id DESC
    `);

    const selectById = database.prepare(`
        SELECT ${INCIDENT_COLUMNS}
        FROM incidentes
        WHERE id = ?
    `);

    const insert = database.prepare(`
        INSERT INTO incidentes (
            titulo,
            descripcion,
            tipo,
            prioridad,
            estado
        )
        VALUES (
            @titulo,
            @descripcion,
            @tipo,
            @prioridad,
            @estado
        )
    `);

    const update = database.prepare(`
        UPDATE incidentes
        SET
            titulo = @titulo,
            descripcion = @descripcion,
            tipo = @tipo,
            prioridad = @prioridad,
            estado = @estado
        WHERE id = @id
    `);

    const remove = database.prepare(`
        DELETE FROM incidentes
        WHERE id = ?
    `);

    function prepareFilters(filters = {}) {
        return {
            estado: filters.estado || null,
            prioridad: filters.prioridad || null,
        };
    }

    function prepareIncident(id, incident) {
        return {
            id,
            titulo: incident.titulo,
            descripcion: incident.descripcion,
            tipo: incident.tipo,
            prioridad: incident.prioridad,
            estado: incident.estado,
        };
    }

    return {
        list(filters = {}) {
            return selectAll.all(prepareFilters(filters));
        },

        findById(id) {
            return selectById.get(id);
        },

        create(incident) {
            const result = insert.run(incident);
            return selectById.get(result.lastInsertRowid);
        },

        update(id, incident) {
            const result = update.run(
                prepareIncident(id, incident)
            );

            return result.changes
                ? selectById.get(id)
                : undefined;
        },

        delete(id) {
            return remove.run(id).changes > 0;
        },
    };
}

module.exports = { createIncidentModel };
