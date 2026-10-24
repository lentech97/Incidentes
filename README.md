# Plataforma de Gestión de Incidentes de Ciberseguridad

Aplicación web para registrar, consultar, actualizar y eliminar incidentes de ciberseguridad, con autenticación, control de acceso por roles, validación de datos y persistencia en base de datos.

**Versión objetivo:** 1.0.0 · **Fecha:** 2026-10-23 · **URL publicada:** pendiente de despliegue · **Repositorio:** pendiente de publicación

> Proyecto académico — Desarrollo en Plataformas, PUCE Virtual (Reto 4). No está diseñado para tratar información institucional real sin los controles adicionales descritos en [Limitaciones](#limitaciones).

---

## Características

- **CRUD completo** de incidentes (título, descripción, tipo, prioridad, estado, fecha de creación) con filtros por estado y prioridad.
- **Autenticación** con JSON Web Tokens (HS256, con vencimiento) y contraseñas almacenadas con hash (bcrypt).
- **Autorización por roles** verificada en el servidor: `admin` y `analista`. Solo `admin` puede eliminar.
- **Validación** de entrada en el servidor y restricciones `CHECK` en la base de datos.
- **Persistencia** en SQLite con migraciones versionadas.
- **Seguridad HTTP:** Helmet (CSP), CORS restringido a un origen, límite de tamaño de cuerpo, HTTPS obligatorio en producción.
- **Operación:** configuración por variables de entorno validada al iniciar, ruta de salud `GET /health` y logs estructurados con identificador de solicitud.
- **Protección de login:** máximo de 10 intentos por IP cada 15 minutos.
- **Calidad:** pruebas automatizadas (Jest + Supertest) y análisis estático (ESLint).

## Arquitectura

```text
Navegador ──HTTPS──▶ Express (Render) ──▶ SQLite
                       │
                       ├─ routes ▶ controllers ▶ services ▶ models
                       ├─ middleware: logger, autenticación, errores
                       └─ frontend/: interfaz HTML, CSS y JS
```

Un único servicio Express sirve la API y la interfaz web (mismo origen).

```text
backend/
├── src/
│   ├── app.js          Configuración de Express, seguridad y rutas
│   ├── server.js       Arranque, validación y usuarios iniciales
│   ├── config/         Conexión a la base de datos
│   ├── db/             Aplicación de migraciones
│   ├── routes/         Definición de rutas
│   ├── controllers/    Entrada y salida HTTP
│   ├── services/       Reglas de negocio
│   ├── validators/     Validación de datos
│   ├── models/         Acceso a datos
│   └── middleware/     Autenticación, logs y manejo de errores
├── migrations/         Scripts SQL versionados
├── scripts/            Utilidades del backend
└── tests/              Pruebas automatizadas
frontend/               Interfaz web (HTML, CSS y JavaScript)
```

## Requisitos

- Node.js **20.19 o superior** (probado con 22)
- npm

## Instalación y ejecución local

```bash
git clone https://github.com/TU_USUARIO/incidentes-seguros.git
cd incidentes-seguros
npm ci
cp .env.example .env      # en Windows: copy .env.example .env
```

Edite `.env` con valores propios (ver tabla siguiente). Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Inicie la aplicación:

```bash
npm start
```

Abra `http://localhost:3000`. Al iniciar, el servidor aplica las migraciones y crea los usuarios `admin` y `analista` con las contraseñas definidas en `.env`.

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | No (3000) | Puerto de escucha. | `3000` |
| `NODE_ENV` | No | `production` activa la exigencia de HTTPS. | `development` |
| `DATABASE_URL` | Sí | Ruta del archivo SQLite con prefijo `sqlite:`. | `sqlite:./backend/data/incidentes.sqlite` |
| `JWT_SECRET` | Sí | Secreto de firma, **mínimo 32 caracteres** aleatorios. | _(generado)_ |
| `JWT_EXPIRES_IN` | No (`1h`) | Duración del token. | `1h` |
| `CLIENT_ORIGIN` | Sí | Origen permitido por CORS: solo `https://dominio`, sin ruta ni barra final. | `http://localhost:3000` |
| `ADMIN_PASSWORD` | Sí | Contraseña inicial de `admin`, mínimo 12 caracteres. | _(propia)_ |
| `ANALYST_PASSWORD` | Sí | Contraseña inicial de `analista`, mínimo 12 caracteres y distinta de la anterior. | _(propia)_ |
| `TRUST_PROXY` | No | `1` solo cuando la aplicación está detrás de un proxy de confianza (producción). | `1` |

Si falta una variable obligatoria o tiene un valor ilustrativo, la aplicación **no arranca** y muestra un mensaje claro. **Nunca** suba `.env` al repositorio.

## API

Todas las rutas de `/api/incidentes` requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Rol | Descripción | Respuestas |
|---|---|---|---|---|
| `GET` | `/health` | Público | Estado del servicio y de la base. | `200`, `503` |
| `POST` | `/api/auth/login` | Público; 10 intentos por 15 minutos/IP | Inicia sesión y devuelve el token. | `200`, `401`, `422`, `429` |
| `GET` | `/api/incidentes` | Autenticado | Lista (filtros `?estado=` y `?prioridad=`). | `200`, `401`, `422` |
| `GET` | `/api/incidentes/:id` | Autenticado | Consulta un incidente. | `200`, `400`, `404` |
| `POST` | `/api/incidentes` | Autenticado | Crea un incidente. | `201`, `422` |
| `PUT` | `/api/incidentes/:id` | Autenticado | Reemplaza todos los campos. | `200`, `400`, `404`, `422` |
| `PATCH` | `/api/incidentes/:id` | Autenticado | Actualiza campos parciales. | `200`, `400`, `404`, `422` |
| `DELETE` | `/api/incidentes/:id` | `admin` | Elimina un incidente. | `204`, `403`, `404` |

Valores permitidos:

- **tipo:** `Phishing`, `Malware`, `Acceso no autorizado`, `Otro`
- **prioridad:** `Baja`, `Media`, `Alta`, `Crítica`
- **estado:** `Pendiente`, `En análisis`, `Resuelto`

Formato de error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Los datos del incidente no son válidos.", "details": { "titulo": "Este campo es obligatorio." } } }
```

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"analista","password":"SU_CONTRASEÑA"}'
```

## Pruebas y calidad

```bash
npm test                # pruebas
npm run test:coverage   # pruebas con informe de cobertura (carpeta coverage/)
npm run lint            # análisis estático
```

Última verificación local (2026-10-23): **9 suites y 37 pruebas aprobadas**. Cobertura: **88,95 %** de instrucciones, **77,22 %** de ramas, **95,00 %** de funciones y **88,92 %** de líneas. Estos resultados corresponden al código actual y pueden variar al modificarlo.

## Despliegue

El servicio se despliega en **Render** como servicio web Node.js (ver `render.yaml`).

1. Conecte el repositorio y use `npm ci` como comando de construcción y `npm start` como comando de inicio.
2. Defina las variables de entorno en el panel del proveedor (nunca en el repositorio), con `NODE_ENV=production` y `TRUST_PROXY=1`.
3. Configure `healthCheckPath` en `/health`.
4. Defina `CLIENT_ORIGIN` con la URL pública y vuelva a desplegar.
5. Verifique `GET /health`, el login y el CRUD en la URL publicada.

Más detalles de TLS en [`HTTPS.md`](HTTPS.md).

**Persistencia:** SQLite guarda los datos en un archivo. Si el hosting tiene disco efímero, los datos se pierden al reiniciar. Use un disco persistente y apunte `DATABASE_URL` a su ruta (por ejemplo `sqlite:/var/data/incidentes.sqlite`).

**Plan de reversión:** cada despliegue corresponde a un commit o tag de Git. Para volver a una versión estable, use la función de rollback del proveedor o `git revert` y publique de nuevo. Revertir código no revierte datos: haga una copia del archivo de base de datos antes de aplicar migraciones nuevas.

## Monitoreo

- `GET /health` comprueba que el proceso responde y que la base es accesible. No sustituye las pruebas funcionales.
- Los logs se emiten como JSON con fecha, nivel (`INFO`, `WARN`, `ERROR`), método, ruta, código, duración e identificador de solicitud (`X-Request-Id`). No se registran contraseñas, tokens ni cuerpos de solicitud.

## Seguridad

- Contraseñas con hash bcrypt; tokens firmados (HS256) y con vencimiento.
- La autorización se valida siempre en el servidor, aunque la interfaz oculte acciones.
- Consultas SQL parametrizadas, validación estricta y límite de 20 KB por cuerpo.
- Cabeceras de seguridad con Helmet y política de contenido restrictiva.
- CORS limitado a `CLIENT_ORIGIN`.
- Secretos fuera del código: `.env` está ignorado por Git.

## Limitaciones

- SQLite en un solo servidor: sin alta disponibilidad ni respaldos automáticos.
- Sin registro de usuarios ni recuperación de contraseña; las cuentas iniciales se definen por variables de entorno.
- Los tokens no se pueden revocar antes de su vencimiento.
- Sin registro de auditoría de cambios por usuario.
- Cobertura de pruebas parcial; sin pruebas de carga ni de accesibilidad automatizadas.
- Algunas imágenes de la interfaz se cargan desde un servicio externo.
- Antes de manejar información institucional real harían falta: base administrada con respaldos, gestión de secretos, auditoría, monitoreo con alertas y revisión de seguridad.

## Documentación

- [Documentación técnica](docs/documentacion-tecnica.md)
- [Manual de usuario](docs/manual-usuario.md)
- [Registro de cambios](CHANGELOG.md)

## Licencia

Proyecto académico. Defina aquí la licencia que corresponda (por ejemplo, ISC, como indica `package.json`).
