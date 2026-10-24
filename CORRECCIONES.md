# Correcciones necesarias — Reto 4 (Integración, despliegue y defensa)

Revisión del proyecto `Lenin_Lema_T7S7.zip` contra la guía de la Semana 8 (puntos 15 a 16.5) y la consigna de entrega.

> **Limitación de la revisión:** revisé el código de forma estática. No pude ejecutar `jest` ni `eslint` completos porque `node_modules` del zip viene de Windows y no tengo red para reinstalar. El único resultado ejecutado fue `eslint`, que reportó 7 errores, todos en `rendimiento.js`. Después de aplicar los cambios, corra `npm ci && npm run lint && npm test` en su equipo y confirme que todo pasa.

---

## 1. Resumen: qué está bien y qué falta

| Requisito de la consigna | Estado | Comentario |
|---|---|---|
| CRUD persistente (SQLite + migraciones) | ✅ Cumple | Migraciones con transacción y tabla `schema_migrations`. |
| Autenticación (JWT, bcrypt) | ✅ Cumple | HS256 fijado, hash de contraseñas, protección contra enumeración de usuarios. |
| Autorización por rol | ✅ Cumple | `DELETE` solo para `admin`, validado en servidor. |
| Validación | ✅ Cumple | Campos permitidos, longitudes, listas cerradas y restricciones `CHECK` en la base. |
| Configuración por entorno | ✅ Cumple | `validateConfiguration` detiene el arranque si falta algo. |
| HTTPS | ⚠️ Parcial | Código listo, pero falta `TRUST_PROXY=1` en producción y verificar el certificado en la URL real. |
| **Health check** | ❌ **Falta** | No existe ninguna ruta `/health`. Es requisito explícito. |
| **Logs** | ⚠️ Parcial | Hay `console.log` de texto plano, sin nivel, fecha ni identificador de solicitud (15.4 lo pide). |
| **Despliegue (URL pública)** | ❌ **Falta** | No hay archivo de despliegue ni documentación. Con SQLite hay un problema de persistencia (sección 3). |
| Pruebas finales | ⚠️ Parcial | 25 pruebas y 76 % de cobertura. Faltan pruebas de login, salud y logger. |
| Repositorio versionado | ❌ Falta | Sin `.git`, sin tag de versión, sin `README.md`. |
| Documentación técnica y manual de usuario | ❌ Falta | Solo existe `README.txt`. |
| PDF de evidencias, presentación y video | ❌ Falta | Se arman al final (sección 7). |

---

## 2. Limpieza del repositorio (hacer primero)

### 2.1 Archivos que **no** deben subirse a GitHub

| Archivo o carpeta | Acción | Motivo |
|---|---|---|
| `.env` | No subir. Ya está en `.gitignore`, pero confirme con `git status` antes del primer commit. | Contiene `JWT_SECRET` y contraseñas. |
| `node_modules/` | No subir y **no incluir en el .zip**. | Es pesada y cada sistema la reconstruye con `npm ci`. |
| `coverage/` | No subir. Ya está en `.gitignore`. | Se regenera con `npm run test:coverage`. |
| `data/*.sqlite*` | No subir. Ya está en `.gitignore`. | Es la base de datos local. |
| `data/incidente.json` | **Borrar.** | Resto de una versión anterior: usa el campo `severidad`, que ya no existe en el modelo. |
| `server.js` (raíz) | **Borrar.** | Duplica `src/server.js`; el script `start` ya apunta a `src/server.js`. |
| `eslint.config.mjs` | **Borrar** y conservar `eslint.config.js`. | Dos configuraciones de ESLint generan ambigüedad sobre cuál se aplica. |
| `rendimiento.js` | Mover a `scripts/rendimiento.js` y corregir comillas (7 errores de lint), o borrar. | Es la única causa de fallo de `npm run lint`. |

### 2.2 Archivos a renombrar, reparar o crear

1. **`README.txt` → `README.md`.** GitHub lo muestra en la portada. Le dejé un `README.md` listo (archivo aparte).
2. **`HTTPS.md`: reparar la codificación.** El archivo tiene BOM y los acentos están corruptos (aparece `ProducciÃ³n` en lugar de `Producción`). Ábralo en VS Code, reemplace el texto por el correcto y guárdelo como *UTF-8* (sin BOM).
3. **`package.json`:**
   - `"name": "lenin_lema_t3s3"` → `"incidentes-seguros"` (el nombre es de otra semana).
   - Agregar `"author"`, `"repository"` y el script `"test:coverage": "jest --runInBand --coverage"`.
4. **Crear `.gitattributes`** (los archivos tienen finales de línea mezclados CRLF/LF):
   ```gitattributes
   * text=auto eol=lf
   ```
5. **Crear `data/.gitkeep`** (vacío) y dejar en `.gitignore` solo las reglas `data/*.sqlite*`, para que la carpeta exista en el repo sin la base de datos.
6. **`.gitignore`:** agregar estas líneas.
   ```gitignore
   .env.*
   !.env.example
   *.log
   .DS_Store
   ```
7. **Rotar secretos si hace falta.** Si alguna vez subió `.env` a un repositorio (aunque lo haya borrado), genere un `JWT_SECRET` nuevo, porque queda en el historial:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

---

## 3. Corrección crítica: persistencia en el despliegue

La guía exige que **al reiniciar el servicio la información persista** (16.2). SQLite guarda todo en un archivo, y en el plan gratuito de Render **el disco es efímero**: cada reinicio o despliegue borra `data/incidentes.sqlite`. Eso le haría fallar justo esa prueba durante la defensa.

Tiene tres caminos. Elija uno y **declárelo en la documentación y en la defensa** (16 pide declarar las limitaciones):

| Opción | Costo | Cambios de código | Cuándo elegirla |
|---|---|---|---|
| **A. Render con Persistent Disk** montado en `/var/data` y `DATABASE_URL=sqlite:/var/data/incidentes.sqlite` | Plan de pago | Ninguno | Es la más rápida; el código ya soporta rutas absolutas. |
| **B. Otro hosting con volumen persistente** (por ejemplo Fly.io o Railway con volumen) | Varía según el proveedor; **verifique los precios vigentes** | Ninguno | Si quiere evitar el plan de pago de Render. |
| **C. Migrar a PostgreSQL administrado** | Gratuito o de bajo costo según el proveedor | Reescribir `config/database.js`, los modelos y las migraciones | Es lo más cercano a producción, pero toma más tiempo. |

Si el tiempo es corto, la **opción A** o **B** es la más segura: no toca el código que ya está probado.

> Las condiciones de los planes gratuitos cambian con frecuencia. Revise la página de precios del proveedor el día del despliegue.

---

## 4. Cambios de código obligatorios

### 4.1 Ruta de salud (`/health`) — **requisito explícito**

La ruta debe responder **antes** del middleware que exige HTTPS. Los health checks de Render llegan por la red interna y, si pasan por la regla de HTTPS, recibirían `426` y el servicio se marcaría como caído.

En `src/app.js`, justo **después** de `app.use(requestLogger);` y **antes** de `express.json(...)` y del bloque `if (nodeEnv === 'production')`:

```js
    app.get('/health', (req, res) => {
        try {
            database.prepare('SELECT 1').get();
            return res.status(200).json({ status: 'ok', database: 'ok', uptime: Math.round(process.uptime()) });
        } catch {
            return res.status(503).json({ status: 'error', database: 'unavailable' });
        }
    });
```

Notas:
- No devuelve la ruta de la base ni versiones ni datos internos.
- La guía (15.5) aclara que la ruta de salud **no reemplaza** las pruebas funcionales: en la defensa debe mostrar también el login y el CRUD en la URL publicada.

### 4.2 Logs estructurados y con identificador de solicitud (15.4)

Reemplace `src/middleware/requestLogger.js` completo:

```js
const crypto = require('crypto');

function log(level, event, fields = {}) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
    (level === 'ERROR' ? console.error : console.log)(line);
}

function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);

    res.on('finish', () => {
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        log(level, 'request', {
            requestId: req.id,
            method: req.method,
            route: req.originalUrl.split('?')[0],
            status: res.statusCode,
            durationMs: Number((Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(2)),
        });
    });
    next();
}

module.exports = { requestLogger, log };
```

Qué cumple con la guía: fecha, nivel, ruta, código, duración e identificador de seguimiento. No registra encabezados `Authorization` ni cuerpos de solicitud, tal como pide la guía. La ruta se registra **sin** parámetros de consulta.

En `src/middleware/errorHandler.js`, cambie el `console.error` para que el error 500 quede asociado al mismo identificador que ve el usuario:

```js
const { log } = require('./requestLogger');
// ...
    log('ERROR', 'unhandled_exception', {
        requestId: req.id,
        name: error.name,
        message: error.message,
    });
```

(Al no registrar `error.stack` completo evita filtrar rutas internas; si lo necesita para depurar, hágalo solo cuando `NODE_ENV !== 'production'`.)

Por último, incluya `requestId` en la respuesta 500 para que el usuario pueda reportarlo:

```js
    return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno. Inténtelo más tarde.', requestId: req.id },
    });
```

### 4.3 Registrar los intentos de login fallidos (WARN)

En `src/controllers/auth.controller.js`, en la rama de credenciales incorrectas:

```js
const { log } = require('../middleware/requestLogger');
// ...
            if (!session) {
                log('WARN', 'login_failed', { requestId: req.id, username: username.trim().slice(0, 50) });
                return res.status(401).json({ /* igual que antes */ });
            }
```

No registre la contraseña. Registrar el nombre de usuario es aceptable en este contexto académico; si lo considera sensible, omita ese campo.

### 4.4 Límite de intentos en el login (recomendado)

Hoy nada impide probar contraseñas sin límite. Es una mejora pequeña y muy defendible:

```bash
npm install express-rate-limit
```

```js
// src/app.js
const rateLimit = require('express-rate-limit');
// ...
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', loginLimiter);
```

Como la app corre detrás de un proxy en producción, esto **solo funciona bien con `TRUST_PROXY=1`** (si no, todos los usuarios aparecen con la misma IP). Si no alcanza a implementarlo, decláralo como limitación en la defensa.

### 4.5 `TRUST_PROXY` en producción

El código usa `req.secure` para exigir HTTPS. Detrás del proxy de Render, sin `TRUST_PROXY=1`, `req.secure` será siempre `false` y **todas las solicitudes recibirán `426 HTTPS_REQUIRED`** en producción. Debe estar configurada en el panel del proveedor (ver sección 5).

Agregue `TRUST_PROXY` a `.env.example`:

```env
TRUST_PROXY=0
```

---

## 5. Despliegue (Render)

### 5.1 Archivo `render.yaml` (en la raíz del repositorio)

```yaml
services:
  - type: web
    name: incidentes-seguros
    runtime: node
    buildCommand: npm ci
    startCommand: npm start
    healthCheckPath: /health
    autoDeploy: true
    # Descomente si elige la opción A de la sección 3 (requiere plan de pago):
    # disk:
    #   name: datos
    #   mountPath: /var/data
    #   sizeGB: 1
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: NODE_ENV
        value: production
      - key: TRUST_PROXY
        value: "1"
      - key: JWT_EXPIRES_IN
        value: 1h
      - key: DATABASE_URL
        value: sqlite:/var/data/incidentes.sqlite
      # Los valores secretos se cargan en el panel, NO en este archivo:
      - key: JWT_SECRET
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: ANALYST_PASSWORD
        sync: false
      - key: CLIENT_ORIGIN
        sync: false
```

> Verifique los nombres de campos y los límites del plan en la documentación actual de Render (`render.com/docs`), porque pueden cambiar.

### 5.2 Variables que debe cargar en el panel

| Variable | Valor en producción |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `CLIENT_ORIGIN` | La URL pública **exacta**, con `https://` y **sin barra final ni ruta** (por ejemplo `https://incidentes-xxxx.onrender.com`). La validación rechaza cualquier otra forma. |
| `JWT_SECRET` | Secreto nuevo de al menos 32 caracteres, distinto al de su `.env` local. |
| `ADMIN_PASSWORD` y `ANALYST_PASSWORD` | Contraseñas distintas entre sí, de al menos 12 caracteres, y distintas a las locales. |
| `DATABASE_URL` | Ruta al disco persistente (ver sección 3). |

La guía pide que la evidencia **no muestre valores reales**: en las capturas del panel muestre solo los nombres de las variables.

### 5.3 Orden recomendado

1. Subir el repositorio a GitHub (sección 6).
2. Crear el servicio en Render conectado al repositorio.
3. Cargar las variables, desplegar, y copiar la URL pública.
4. Actualizar `CLIENT_ORIGIN` con esa URL y volver a desplegar.
5. Comprobar `https://TU-URL/health` → debe responder `200`.
6. Hacer el recorrido manual (sección 7.2).

El frontend lo sirve el mismo servidor Express desde `public/`, así que **no necesita Vercel ni Netlify**: un solo servicio basta. Esto simplifica CORS (mismo origen) y es una decisión que puede justificar en la defensa.

### 5.4 Plan de reversión (la guía lo exige en 15)

Documente esto en la documentación técnica:

- **Versión estable:** el tag de Git (por ejemplo `v1.0.0`) y su despliegue correspondiente en Render.
- **Revertir código:** en Render, *Deploys → Rollback* al despliegue anterior, o `git revert <commit>` y push.
- **Datos:** la única migración actual (`001_...`) crea tablas desde cero. Antes de agregar migraciones nuevas, haga una copia del archivo `.sqlite`. Revertir código **no revierte datos**.
- **Ventana de observación:** después de cada despliegue, revisar durante unos minutos `/health`, los logs `ERROR` y los tiempos de respuesta antes de dar la versión por buena.

---

## 6. Subir a GitHub

```bash
# 1. En la carpeta del proyecto, SIN node_modules ni .env en el zip final
git init -b main
git add .
git status        # Verifique que NO aparezcan .env, node_modules, coverage ni *.sqlite

# 2. Primer commit
git commit -m "feat: plataforma de incidentes (CRUD, JWT, roles, validación)"

# 3. Conectar con el repositorio vacío creado en GitHub
git remote add origin https://github.com/TU_USUARIO/incidentes-seguros.git
git push -u origin main

# 4. Etiquetar la versión final entregada
git tag -a v1.0.0 -m "Versión final Reto 4"
git push origin v1.0.0
```

Recomendaciones para que se vea trazable (la guía lo pide en 15 y 16):

- Haga **commits pequeños con mensajes claros** (`fix:`, `feat:`, `docs:`, `test:`) en lugar de un solo commit gigante.
- Cree el repositorio como **público** o agregue a su docente como colaborador si es privado.
- La guía dice que la versión final **no cambia durante la evaluación sin registrar el motivo**: después de etiquetar `v1.0.0`, solo haga cambios con un commit que explique por qué.
- Cree un `CHANGELOG.md` corto con las versiones y las correcciones realizadas.

### Integración continua (opcional, suma puntos de trazabilidad)

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
```

Con esto, cada commit queda asociado a una ejecución de lint y pruebas, y la insignia de estado puede ir en el README. Si no la usa, quítela del README.

---

## 7. Pruebas y evidencias

### 7.1 Pruebas que faltan agregar

Archivo nuevo `tests/health.test.js`:

```js
const request = require('supertest');
const Database = require('better-sqlite3');
const { migrateDatabase } = require('../src/db/migrate');
const { createApp } = require('../src/app');

describe('ruta de salud', () => {
    let database;
    let app;

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        database = new Database(':memory:');
        migrateDatabase(database);
        app = createApp({
            database,
            jwtSecret: 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens',
            clientOrigin: 'http://localhost:3000',
        });
    });

    afterAll(() => {
        database.close();
        console.log.mockRestore();
    });

    test('responde 200 sin autenticación', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('no exige HTTPS en producción', async () => {
        const prod = createApp({
            database,
            jwtSecret: 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens',
            clientOrigin: 'https://incidentes.example',
            nodeEnv: 'production',
        });
        const res = await request(prod).get('/health');
        expect(res.status).toBe(200);
    });

    test('responde 503 si la base no está disponible', async () => {
        const broken = { prepare() { throw new Error('db caída'); } };
        const failing = createApp({
            database: broken,
            jwtSecret: 'a-test-secret-that-is-long-enough-to-sign-jwt-tokens',
            clientOrigin: 'http://localhost:3000',
        });
        const res = await request(failing).get('/health');
        expect(res.status).toBe(503);
    });
});
```

Otras pruebas que cubren los casos que la guía pide en 16.2 (revise cuáles ya tiene en `incidente.api.test.js`):

- Login correcto devuelve token; credenciales inválidas → `401`; cuerpo vacío → `422`.
- Sin token → `401`; token inválido o vencido → `401`.
- Rol `analista` intentando `DELETE` → `403`; rol `admin` → `204`.
- Datos incorrectos → `422`; registro inexistente → `404`; id inválido → `400`.
- Producción sin HTTPS → `426`.

Meta razonable: subir la cobertura de **76 %** a **85 % o más**. Los archivos con menos cobertura probablemente son `auth.controller.js`, `auth.service.js`, `server.js`, `requestLogger.js` y `errorHandler.js` (compruébelo en `coverage/lcov-report/index.html`).

### 7.2 Lista de verificación en producción (15.5)

Ejecútela sobre la **URL pública** y registre URL, versión, pasos, resultado esperado y captura:

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Abrir `https://URL/` | Carga con candado HTTPS válido. |
| 2 | Abrir `http://URL/` | Redirige a HTTPS (lo hace el proxy del proveedor). |
| 3 | `GET /health` | `200` con `status: ok`. |
| 4 | Login con credenciales inválidas | `401`, mensaje genérico. |
| 5 | Login como `analista` | Entra; puede crear y editar. |
| 6 | Crear incidente con datos inválidos | `422` con detalle por campo. |
| 7 | Crear incidente válido | `201`; aparece en la lista. |
| 8 | Buscar por estado y prioridad | Filtros funcionan. |
| 9 | Actualizar estado | Cambia y persiste. |
| 10 | `analista` intenta eliminar (también con `curl` directo) | `403`. |
| 11 | Login como `admin` y eliminar | `204`; el incidente desaparece. |
| 12 | Petición sin token a `/api/incidentes` | `401`. |
| 13 | **Reiniciar el servicio** y volver a listar | Los datos siguen ahí (prueba la sección 3). |
| 14 | Revisar logs del proveedor | Eventos con `requestId`, sin contraseñas ni tokens. |
| 15 | Vista móvil y navegación con teclado | Usable. |
| 16 | Inspeccionar el código de la página (F12) | Sin secretos visibles. |

Ejemplo de comprobación con `curl` para el caso 10 (el servidor debe rechazarlo aunque la interfaz oculte el botón):

```bash
TOKEN=$(curl -s -X POST https://URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"analista","password":"LA_CONTRASEÑA"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -i -X DELETE https://URL/api/incidentes/1 -H "Authorization: Bearer $TOKEN"
```

Use solo cuentas y datos de demostración. No ejecute cargas agresivas.

---

## 8. Entregables (Tabla 2 de la guía) y estructura final

```text
incidentes-seguros/
├── .github/workflows/ci.yml         (opcional)
├── docs/
│   ├── documentacion-tecnica.md     (o .pdf)
│   ├── manual-usuario.md            (o .pdf)
│   └── evidencias/                  (capturas SIN secretos)
├── migrations/
├── public/
├── scripts/rendimiento.js
├── src/
├── tests/
├── data/.gitkeep
├── .env.example
├── .gitattributes
├── .gitignore
├── CHANGELOG.md
├── HTTPS.md
├── README.md
├── eslint.config.js
├── package.json
├── package-lock.json
└── render.yaml
```

| Entregable | Qué debe contener | Comprobación |
|---|---|---|
| **Plataforma** | CRUD, seguridad y visualización | URL funcional |
| **Código** | Estructura y configuración | Tag `v1.0.0` identificado |
| **Pruebas** | Casos y resultados | Evidencia reproducible (`npm test`, informe de cobertura) |
| **Documentación** | Técnica y de usuario | Pasos completos, con fecha y versión |
| **Defensa** | Problema, solución y demostración | Argumentación clara |

### Documentación técnica (16.3): índice sugerido

1. Arquitectura (diagrama: navegador → Express en Render → SQLite; módulos routes → controllers → services → models).
2. Requisitos e instalación (`npm ci`, Node ≥ 20.19).
3. Variables de entorno (tabla con nombre, propósito y ejemplo; sin valores reales).
4. API y modelos (rutas, métodos, roles, códigos de respuesta, esquema de la tabla).
5. Seguridad (JWT, bcrypt con costo 12, Helmet/CSP, CORS, validación, HTTPS, límite de tamaño de cuerpo).
6. Pruebas (cómo ejecutarlas, resultados, cobertura).
7. Despliegue, monitoreo y **plan de reversión**.
8. Limitaciones y mejoras.

**Fecha y versión** en el encabezado. Y la propia guía le pide probar la documentación siguiéndola desde cero en un entorno limpio: clone el repositorio en otra carpeta y siga sus pasos.

### Manual de usuario: índice sugerido

1. Acceso (login). 2. Crear incidente. 3. Actualizar estado. 4. Consultar y filtrar. 5. Eliminar (solo administrador). 6. Problemas frecuentes y mensajes esperados. Capturas **de la versión entregada**.

### PDF de evidencias

Ordene así: URL y versión (commit/tag) → capturas del panel con nombres de variables (sin valores) → log de inicio → `/health` → tabla de la sección 7.2 con capturas → salida de `npm test` y cobertura → logs con `requestId` → lint sin errores → plan de reversión.

---

## 9. Para la defensa (16.1, 16.4 y 16.5) — sin el video, pero conviene prepararlo

**Estructura (máximo 20 minutos):**

1. *Problema y usuario* (2 min): quién gestiona incidentes y por qué importa.
2. *Arquitectura* (3 min): un diagrama simple. Explique por qué un solo servicio y por qué SQLite.
3. *Demostración* (6 min), con plan principal y de contingencia (captura o video corto por si falla la URL): login → crear → consultar → actualizar → eliminar como admin → intento de eliminar como analista.
4. *Seguridad* (3 min): hash, JWT con vencimiento, rol verificado en servidor, validación, CORS, HTTPS, secretos fuera del código.
5. *Pruebas y monitoreo* (3 min): cobertura, `/health`, logs con `requestId`.
6. *Limitaciones y lecciones* (3 min).

**Preguntas probables y una respuesta honesta:**

- *¿Por qué SQLite?* Simplicidad y cero configuración; limita la escalabilidad horizontal y exige disco persistente.
- *¿Qué pasa si se cae la base?* `/health` responde `503` y el despliegue se marca como no saludable.
- *¿Cómo se revierte una mala versión?* Rollback al despliegue o tag anterior; los datos requieren copia previa.
- *¿Qué falta para uso real?* Ver la lista siguiente.

**Limitaciones que conviene declarar (la guía dice que ocultarlas resta confianza):**

- SQLite en un solo servidor: sin alta disponibilidad ni respaldo automático.
- Sin registro de usuarios ni cambio/recuperación de contraseña: las cuentas se crean desde variables de entorno.
- JWT sin revocación (vive hasta su vencimiento) y guardado en memoria del navegador (se pierde al recargar, a cambio de no estar expuesto a `localStorage`).
- Sin auditoría de quién modificó cada incidente.
- Cobertura de pruebas inferior al 100 % y sin pruebas de carga ni de accesibilidad automatizadas.
- Imágenes del sitio cargadas desde Unsplash (dependencia externa permitida en la política CSP); en uso real convendría alojarlas localmente.
- Si usa plan gratuito: el servicio puede suspenderse por inactividad y tardar en responder la primera vez. Dígalo antes de la demo.

**Lecciones aprendidas** (use ejemplos reales del proyecto, no frases generales): por ejemplo, que `validateConfiguration` evitó arrancar con un secreto de ejemplo, o que `TRUST_PROXY` mal configurado produciría `426` en producción. Convierta cada lección en una acción concreta (automatizar con CI, revisar permisos antes, etc.).

**Después de la defensa:** rote `JWT_SECRET` y las contraseñas, elimine los datos de demostración y confirme que el repositorio queda comprensible (README + tag).

---

## 10. Orden de trabajo sugerido

1. [ ] Limpieza (sección 2) y reparar `HTTPS.md`.
2. [ ] Agregar `/health` y logs estructurados (4.1 a 4.3), más `TRUST_PROXY` (4.5).
3. [ ] Agregar `tests/health.test.js` y otras pruebas; `npm run lint` y `npm test` en verde.
4. [ ] Crear el repositorio en GitHub y subir (sección 6).
5. [ ] Elegir opción de persistencia (sección 3), crear `render.yaml` y desplegar.
6. [ ] Ejecutar la lista de la sección 7.2 y guardar capturas.
7. [ ] Escribir documentación técnica y manual de usuario; probarlos en una carpeta limpia.
8. [ ] Etiquetar `v1.0.0`, armar el .zip (sin `node_modules`, `.env` ni `coverage`) y el PDF de evidencias.
9. [ ] Preparar presentación y grabar el video.
