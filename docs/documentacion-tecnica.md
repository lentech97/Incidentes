# Documentación técnica

**Proyecto:** Plataforma de Gestión de Incidentes de Ciberseguridad  
**Versión objetivo:** 1.0.0  
**Fecha:** 2026-10-23

## 1. Arquitectura

El repositorio separa el backend (`backend/`) del frontend (`frontend/`). El servidor Express sirve los archivos estáticos del frontend y la API desde el mismo origen. Express aplica Helmet, CORS, el registro de solicitudes y validación de JSON; las rutas delegan en controladores, servicios y modelos. Los modelos usan `better-sqlite3` y las migraciones SQL versionadas crean las tablas.

```text
Navegador
   └── HTTPS / mismo origen
       └── Express (Render)
           ├── /health
           ├── /api/auth/login → controlador → servicio → usuarios
           └── /api/incidentes → controlador → servicio → modelo
                                           └── backend/data/SQLite

backend/
├── src/       Aplicación, API y módulos del servidor
├── migrations/ Migraciones SQL
├── tests/     Jest y Supertest
└── scripts/  Utilidades
frontend/      HTML, CSS y JavaScript del navegador
```

## 2. Requisitos e instalación

Se requiere Node.js 20.19 o superior y npm. Desde la raíz:

```sh
npm ci
```

Copie `.env.example` a `.env`, cambie los secretos de ejemplo por valores propios y ejecute `npm start`. El servidor migra la base de datos y crea `admin` y `analista` si no existen. Para desarrollo se puede usar `npm run dev`; la aplicación queda disponible en `http://localhost:3000` con la configuración local.

## 3. Variables de entorno

| Variable | Propósito | Ejemplo no secreto |
|---|---|---|
| `PORT` | Puerto HTTP del proceso | `3000` |
| `NODE_ENV` | En producción activa la exigencia de HTTPS | `production` |
| `TRUST_PROXY` | Confía en el proxy inverso solo cuando está controlado | `1` |
| `DATABASE_URL` | Ruta SQLite con prefijo `sqlite:` | `sqlite:./backend/data/incidentes.sqlite` |
| `JWT_SECRET` | Clave privada de firma JWT; mínimo 32 caracteres aleatorios | Generar un valor nuevo |
| `JWT_EXPIRES_IN` | Vigencia del JWT | `1h` |
| `CLIENT_ORIGIN` | Origen CORS exacto, sin ruta ni barra final | `https://app.example.com` |
| `ADMIN_PASSWORD` | Contraseña inicial del administrador | Secreto de al menos 12 caracteres |
| `ANALYST_PASSWORD` | Contraseña inicial del analista, diferente de la del administrador | Secreto de al menos 12 caracteres |

`validateConfiguration` impide el arranque si faltan secretos requeridos o tienen valores ilustrativos. Nunca publique `.env`, valores reales del panel ni secretos en capturas o logs.

## 4. API y datos

Todas las rutas de incidentes requieren `Authorization: Bearer <token>`. El login acepta JSON con `username` y `password`.

| Ruta | Método | Acceso | Respuesta principal |
|---|---|---|---|
| `/health` | GET | Público | `200` con DB disponible; `503` si no |
| `/api/auth/login` | POST | Público, 10 intentos por 15 minutos/IP | `200`, `401`, `422` o `429` |
| `/api/incidentes` | GET | Autenticado | `200`; filtros opcionales `estado`, `prioridad` |
| `/api/incidentes/:id` | GET | Autenticado | `200`, `400` o `404` |
| `/api/incidentes` | POST | Autenticado | `201` o `422` |
| `/api/incidentes/:id` | PUT/PATCH | Autenticado | `200`, `400`, `404` o `422` |
| `/api/incidentes/:id` | DELETE | Solo `admin` | `204`, `400`, `403` o `404` |

Los incidentes almacenan `id`, `titulo` (1–120 caracteres), `descripcion` (1–2000), `tipo`, `prioridad`, `estado` y `fecha_creacion`. Las listas cerradas y límites se comprueban en la aplicación y en restricciones `CHECK` de SQLite. Los roles son `admin` y `analista`.

## 5. Seguridad y observabilidad

- Contraseñas con bcrypt; el aprovisionamiento inicial usa costo 12.
- JWT firmado con HS256, vencimiento configurable y verificación que limita el algoritmo aceptado.
- El servidor comprueba roles en las rutas protegidas; ocultar controles en la interfaz no sustituye esa autorización.
- Helmet/CSP, CORS por origen, validación de entrada y límite de cuerpo JSON de 20 KB.
- En producción se requiere HTTPS detectado a través del proxy confiable. Configure `TRUST_PROXY=1` únicamente detrás del proxy controlado.
- Los logs son JSON con timestamp, nivel, evento, método, ruta sin query, estado, duración y `requestId`. No registran contraseñas ni tokens. El ID se devuelve como `X-Request-Id`; los errores internos lo incluyen también en el JSON.
- Los intentos de login fallidos generan un evento `WARN` sin registrar la contraseña.
- `GET /health` ejecuta `SELECT 1` y no revela rutas ni versiones internas.

## 6. Pruebas y calidad

```sh
npm run lint
npm test
npm run test:coverage
```

Jest y Supertest cubren validación, autenticación/autorización, API, limitación de login y la ruta de salud. Los resultados dependen del código y del entorno; genere un informe nuevo antes de entregar y adjunte la salida real, no porcentajes históricos.

## 7. Despliegue, monitoreo y reversión

`render.yaml` configura un servicio Node y `/health` como health check. Para conservar datos se necesita un disco persistente montado en `/var/data`, con `DATABASE_URL=sqlite:/var/data/incidentes.sqlite`. La sección de disco está comentada en la plantilla: habilítela y confirme el costo y las condiciones actuales antes del despliegue. El sistema de archivos efímero no garantiza persistencia.

En el panel configure `NODE_ENV=production`, `TRUST_PROXY=1`, `CLIENT_ORIGIN` con la URL exacta, `JWT_SECRET`, `ADMIN_PASSWORD` y `ANALYST_PASSWORD`. Mantenga los secretos fuera del manifiesto y de las evidencias. Tras desplegar, compruebe `/health`, login y CRUD en la URL pública, y revise eventos `ERROR` y latencias.

Plan de reversión:

1. Identifique la versión desplegada por commit/tag y el despliegue correspondiente.
2. Use **Deploys → Rollback** en Render o revierta el cambio con `git revert <commit>` y despliegue el commit resultante.
3. Antes de introducir migraciones futuras, haga copia de seguridad del archivo SQLite. Revertir código no revierte cambios de datos.
4. Observe salud, errores y tiempos de respuesta durante varios minutos tras el rollback o despliegue.

## 8. Limitaciones conocidas

- SQLite requiere almacenamiento persistente y no ofrece alta disponibilidad ni respaldo automático en esta configuración.
- Las cuentas se aprovisionan desde variables de entorno; no hay registro, cambio ni recuperación de contraseña.
- Los JWT no se revocan antes de su vencimiento y la interfaz los mantiene en memoria.
- No hay auditoría de cambios por usuario.
- La cobertura no garantiza por sí sola ausencia de defectos; no hay pruebas de carga ni de accesibilidad automatizadas.
- Algunas imágenes de la interfaz dependen de Unsplash y de conexión externa.
- En planes de hosting con suspensión por inactividad, el primer acceso puede demorar.
