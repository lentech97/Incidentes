const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const sessionPanel = document.getElementById('session-panel');
const incidentForm = document.getElementById('incident-form');
const incidentList = document.getElementById('incident-list');
const incidentMessage = document.getElementById('incident-message');
const incidentDetail = document.getElementById('incident-detail');
const loadButton = document.getElementById('load-incidents');
const stateFilter = document.getElementById('filter-state');
const priorityFilter = document.getElementById('filter-priority');

let accessToken = null;
let currentUser = null;
let editingIncidentId = null;

function setMessage(element, message, type = '') {
    element.textContent = message;
    element.className = `form-message${type ? ` ${type}` : ''}`;
}

async function request(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (options.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });
    let body = null;
    if (response.status !== 204 && response.headers.get('content-type')?.includes('application/json')) {
        body = await response.json();
    }
    if (!response.ok) {
        const message = body?.error?.message || `La solicitud falló (HTTP ${response.status}).`;
        if (response.status === 401 && accessToken) {
            signOut();
            setMessage(authMessage, 'La sesión venció. Inicie sesión nuevamente.', 'error');
        }
        throw new Error(message);
    }
    return body;
}

function signOut() {
    accessToken = null;
    currentUser = null;
    sessionPanel.hidden = true;
    loginForm.hidden = false;
    loadButton.disabled = true;
    incidentForm.reset();
    resetEdit();
    incidentList.replaceChildren();
    incidentDetail.textContent = 'Inicie sesión para consultar incidentes.';
    for (const id of ['metric-total', 'metric-pending', 'metric-analysis', 'metric-critical']) {
        document.getElementById(id).textContent = '0';
    }
    setMessage(incidentMessage, '');
}

function updateSession() {
    loginForm.hidden = true;
    sessionPanel.hidden = false;
    document.getElementById('session-user').textContent = `Sesión: ${currentUser.username} (${currentUser.role})`;
    document.getElementById('incident-form').hidden = false;
    loadButton.disabled = false;
}

function resetEdit() {
    editingIncidentId = null;
    document.getElementById('save-incident').textContent = 'Registrar incidente';
    document.getElementById('cancel-edit').hidden = true;
}

function addDetailRow(container, label, value) {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value));
    container.appendChild(paragraph);
}

function showIncident(incident) {
    incidentDetail.replaceChildren();
    addDetailRow(incidentDetail, 'ID', String(incident.id));
    addDetailRow(incidentDetail, 'Título', incident.titulo);
    addDetailRow(incidentDetail, 'Descripción', incident.descripcion);
    addDetailRow(incidentDetail, 'Tipo', incident.tipo);
    addDetailRow(incidentDetail, 'Prioridad', incident.prioridad);
    addDetailRow(incidentDetail, 'Estado', incident.estado);
    addDetailRow(incidentDetail, 'Creado', new Date(incident.fechaCreacion).toLocaleString());
}

function startEditing(incident) {
    editingIncidentId = incident.id;
    for (const field of ['titulo', 'descripcion', 'tipo', 'prioridad', 'estado']) {
        incidentForm.elements[field].value = incident[field];
    }
    document.getElementById('save-incident').textContent = 'Guardar cambios';
    document.getElementById('cancel-edit').hidden = false;
    document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo').focus();
}

function renderIncidents(incidents) {
    incidentList.replaceChildren();
    if (!incidents.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No hay incidentes que coincidan con los filtros.';
        incidentList.appendChild(empty);
    }

    for (const incident of incidents) {
        const item = document.createElement('article');
        item.className = 'incident-item';

        const title = document.createElement('h4');
        title.textContent = `#${incident.id} — ${incident.titulo}`;
        item.appendChild(title);

        const summary = document.createElement('p');
        summary.textContent = `${incident.tipo} · Prioridad: ${incident.prioridad} · Estado: ${incident.estado}`;
        item.appendChild(summary);

        const actions = document.createElement('div');
        actions.className = 'incident-actions';
        const viewButton = document.createElement('button');
        viewButton.type = 'button';
        viewButton.className = 'btn-secondary';
        viewButton.textContent = 'Ver detalle';
        viewButton.addEventListener('click', () => showIncident(incident));
        actions.appendChild(viewButton);

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn-secondary';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => startEditing(incident));
        actions.appendChild(editButton);

        if (currentUser.role === 'admin') {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'btn-danger';
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', () => deleteIncident(incident));
            actions.appendChild(deleteButton);
        }
        item.appendChild(actions);
        incidentList.appendChild(item);
    }

    document.getElementById('metric-total').textContent = incidents.length;
    document.getElementById('metric-pending').textContent = incidents.filter((item) => item.estado === 'Pendiente').length;
    document.getElementById('metric-analysis').textContent = incidents.filter((item) => item.estado === 'En análisis').length;
    document.getElementById('metric-critical').textContent = incidents.filter((item) => item.prioridad === 'Crítica').length;
}

async function loadIncidents() {
    if (!accessToken) {
        return;
    }
    loadButton.disabled = true;
    setMessage(incidentMessage, 'Cargando incidentes…');
    const params = new URLSearchParams();
    if (stateFilter.value) {
        params.set('estado', stateFilter.value);
    }
    if (priorityFilter.value) {
        params.set('prioridad', priorityFilter.value);
    }

    try {
        const suffix = params.size ? `?${params.toString()}` : '';
        const incidents = await request(`/api/incidentes${suffix}`);
        renderIncidents(incidents);
        setMessage(incidentMessage, `${incidents.length} incidente(s) cargado(s).`, 'success');
    } catch (error) {
        setMessage(incidentMessage, error.message, 'error');
    } finally {
        loadButton.disabled = false;
    }
}

async function deleteIncident(incident) {
    if (!window.confirm(`¿Eliminar el incidente #${incident.id}?`)) {
        return;
    }
    try {
        await request(`/api/incidentes/${incident.id}`, { method: 'DELETE' });
        setMessage(incidentMessage, 'Incidente eliminado.', 'success');
        await loadIncidents();
    } catch (error) {
        setMessage(incidentMessage, error.message, 'error');
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(authMessage, 'Validando credenciales…');
    const formData = new FormData(loginForm);
    try {
        const session = await request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password'),
            }),
        });
        accessToken = session.token;
        currentUser = session.user;
        loginForm.reset();
        setMessage(authMessage, 'Sesión iniciada correctamente.', 'success');
        updateSession();
        await loadIncidents();
    } catch (error) {
        setMessage(authMessage, error.message, 'error');
    }
});

incidentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(incidentMessage, 'Guardando incidente…');
    const formData = new FormData(incidentForm);
    const incident = Object.fromEntries(
        ['titulo', 'descripcion', 'tipo', 'prioridad', 'estado'].map((field) => [field, formData.get(field)]),
    );

    try {
        await request(
            editingIncidentId ? `/api/incidentes/${editingIncidentId}` : '/api/incidentes',
            {
                method: editingIncidentId ? 'PUT' : 'POST',
                body: JSON.stringify(incident),
            },
        );
        incidentForm.reset();
        resetEdit();
        setMessage(incidentMessage, 'Incidente guardado correctamente.', 'success');
        await loadIncidents();
    } catch (error) {
        setMessage(incidentMessage, error.message, 'error');
    }
});

loadButton.addEventListener('click', loadIncidents);
stateFilter.addEventListener('change', loadIncidents);
priorityFilter.addEventListener('change', loadIncidents);
document.getElementById('logout-button').addEventListener('click', signOut);
document.getElementById('cancel-edit').addEventListener('click', () => {
    incidentForm.reset();
    resetEdit();
});
incidentForm.hidden = true;
loadButton.disabled = true;
document.getElementById('metric-total').textContent = '0';
document.getElementById('metric-pending').textContent = '0';
document.getElementById('metric-analysis').textContent = '0';
document.getElementById('metric-critical').textContent = '0';
