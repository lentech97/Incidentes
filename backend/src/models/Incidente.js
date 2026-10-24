const INCIDENT_COLUMNS = `
    id,
    titulo,
    descripcion,
    tipo,
    prioridad,
    estado,
    fecha_creacion AS "fechaCreacion"
`;

function createIncidentModel(database) {
    return {
        async list(filters = {}) {
            const conditions = [];
            const values = [];
            for (const field of ['estado', 'prioridad']) {
                if (filters[field]) {
                    values.push(filters[field]);
                    conditions.push(`${field} = $${values.length}`);
                }
            }
            const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
            const { rows } = await database.query(
                `SELECT ${INCIDENT_COLUMNS} FROM incidentes ${where} ORDER BY id DESC`,
                values,
            );
            return rows;
        },

        async findById(id) {
            const { rows } = await database.query(
                `SELECT ${INCIDENT_COLUMNS} FROM incidentes WHERE id = $1`,
                [id],
            );
            return rows[0];
        },

        async create(incident) {
            const { rows } = await database.query(
                `INSERT INTO incidentes (titulo, descripcion, tipo, prioridad, estado)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING ${INCIDENT_COLUMNS}`,
                [incident.titulo, incident.descripcion, incident.tipo, incident.prioridad, incident.estado],
            );
            return rows[0];
        },

        async update(id, incident) {
            const { rows } = await database.query(
                `UPDATE incidentes
                 SET titulo = $1, descripcion = $2, tipo = $3, prioridad = $4, estado = $5
                 WHERE id = $6
                 RETURNING ${INCIDENT_COLUMNS}`,
                [incident.titulo, incident.descripcion, incident.tipo, incident.prioridad, incident.estado, id],
            );
            return rows[0];
        },

        async delete(id) {
            const result = await database.query('DELETE FROM incidentes WHERE id = $1', [id]);
            return result.rowCount > 0;
        },
    };
}

module.exports = { createIncidentModel };
