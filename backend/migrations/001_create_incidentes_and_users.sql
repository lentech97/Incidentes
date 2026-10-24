CREATE TABLE incidentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 120),
    descripcion TEXT NOT NULL CHECK (length(trim(descripcion)) BETWEEN 1 AND 2000),
    tipo TEXT NOT NULL CHECK (tipo IN ('Phishing', 'Malware', 'Acceso no autorizado', 'Otro')),
    prioridad TEXT NOT NULL CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En análisis', 'Resuelto')),
    fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_incidentes_estado_prioridad ON incidentes (estado, prioridad);

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'analista'))
);
