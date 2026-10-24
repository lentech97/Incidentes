# Auditoría técnica previa a GitHub y despliegue
## Plataforma de gestión de incidentes de ciberseguridad

**Proyecto auditado:** `Lenin_Lema_T7S7`  
**Objetivo:** revisar el proyecto antes de publicarlo en GitHub y desplegarlo, identificar riesgos y dejar una lista verificable de mejoras.  
**Estado:** auditoría documental inicial del ZIP entregado. Las casillas deben marcarse únicamente después de ejecutar y comprobar cada paso en el entorno real.

> **Importante:** esta auditoría no certifica que la aplicación ya esté lista para producción. La URL pública, el repositorio remoto, el TLS real, las pruebas en el entorno de despliegue y las evidencias deben verificarse después de ejecutar las tareas.

---

## 1. Resumen ejecutivo

El proyecto ya contiene una base técnica útil: Node.js y Express, separación por rutas/controladores/modelos/servicios, SQLite persistente, migración SQL, JWT, contraseñas con `bcryptjs`, validación de configuración, middleware de logs, `helmet`, CORS, pruebas Jest/Supertest, ESLint y documentación inicial de HTTPS.

La revisión del ZIP detectó aspectos que deben resolverse antes de subirlo o publicarlo:

- **Bloqueante: el ZIP incluye un archivo `.env`.** No debe publicarse. Aunque `.gitignore` ya incluye `.env`, hay que comprobar qué archivos están rastreados por Git. Si el secreto estuvo alguna vez en un repositorio remoto, quitarlo del último commit no basta: se deben rotar los secretos.
- **Bloqueante: el ZIP incluye `node_modules/`, `coverage/` y archivos de base de datos SQLite.** No se deben versionar dependencias instaladas, reportes generados ni datos locales de ejecución.
- **Pendiente de implementación/verificación:** no se observó una ruta de health check en el código revisado.
- **Pendiente de producción:** `HTTPS.md` describe TLS detrás de un proxy inverso, pero el proyecto no instala ni configura por sí mismo el certificado, la redirección HTTP→HTTPS ni el dominio.
- **Pendiente de documentación:** existe `README.txt`; conviene sustituirlo por un `README.md` completo con instalación, variables, migración, ejecución, pruebas, endpoints, despliegue y limitaciones.
- **Limpieza:** hay dos configuraciones ESLint (`eslint.config.js` y `eslint.config.mjs`). Debe mantenerse una sola, después de confirmar cuál funciona con el comando de lint.

## 2. Criterios de prioridad

- **P0 — Bloqueante:** no publicar ni desplegar hasta resolverlo.
- **P1 — Alta:** resolver antes de anunciar el servicio como operativo.
- **P2 — Media:** mejora necesaria para mantenibilidad y operación.
- **P3 — Documental:** completar para la entrega y defensa.

---

## 3. Auditoría de seguridad y publicación en GitHub

### 3.1 Secretos y archivos sensibles — P0

- [ ] Revisar `.env` **localmente**, sin copiar sus valores al informe ni compartirlos.
- [ ] Confirmar que `.env` está ignorado por Git: `git check-ignore -v .env`.
- [ ] Revisar archivos rastreados: `git status --short` y `git ls-files`.
- [ ] Si `.env` ya está rastreado, retirarlo del índice sin borrarlo localmente: `git rm --cached .env`; después confirmar el cambio con `git status`.
- [ ] Comprobar que `.env.example` solo contiene nombres de variables y valores de ejemplo, nunca secretos reales.
- [ ] No incluir contraseñas, JWT, claves privadas, certificados privados, tokens ni datos personales en capturas, logs o documentación.
- [ ] Si algún secreto real se publicó o compartió, cambiarlo antes del despliegue: `JWT_SECRET`, contraseñas iniciales y cualquier credencial afectada.
- [ ] Generar un `JWT_SECRET` aleatorio de al menos 32 caracteres; no reutilizar el valor de ejemplo.
- [ ] Usar contraseñas distintas y robustas para `ADMIN_PASSWORD` y `ANALYST_PASSWORD`.
- [ ] No usar las credenciales de desarrollo en producción.

**Comandos de revisión (ejecutar desde la carpeta del proyecto):**

```bash
git status --short
git check-ignore -v .env
git ls-files
```

Si todavía no se inicializó Git, primero se debe revisar el contenido que se pretende añadir; no se debe hacer `git add .` a ciegas.

### 3.2 Archivos que no deben subirse — P0/P1

El `.gitignore` observado ya contempla `node_modules/`, `.env`, los archivos SQLite y `coverage/`. Aun así, el ZIP incluye esos archivos, por lo que se debe validar que Git los excluya.

- [ ] No versionar `node_modules/`.
- [ ] No versionar `coverage/` ni `reporte-cobertura.txt`, salvo que el docente solicite explícitamente el reporte como evidencia; en ese caso, entregar el reporte de forma controlada o adjuntarlo a la entrega, no incluir todo el directorio generado.
- [ ] No versionar `data/incidentes.sqlite`, `data/incidentes.sqlite-shm` ni `data/incidentes.sqlite-wal`.
- [ ] Revisar `data/incidente.json` para confirmar que no contiene datos personales, credenciales ni datos reales.
- [ ] Mantener en Git el código fuente, las migraciones, las pruebas, los archivos estáticos, `.env.example`, la configuración ESLint elegida, `HTTPS.md`, `README.md` y documentación/evidencias no sensibles.

**Antes del primer commit:**

```bash
git status --short
git check-ignore -v node_modules coverage .env data/incidentes.sqlite
```

Si un archivo sensible ya está rastreado, `.gitignore` por sí solo no lo elimina del historial. Retirarlo del índice y, si se publicó, evaluar la limpieza del historial además de rotar secretos.

---

## 4. Auditoría funcional del CRUD persistente

### 4.1 Base de datos y migraciones — P1

- [ ] Confirmar que `DATABASE_URL` apunta a una ruta escribible en el entorno de ejecución.
- [ ] Confirmar que la carpeta de la base de datos existe o puede crearse con los permisos del usuario del proceso.
- [ ] Ejecutar la migración en una base limpia y comprobar que crea las tablas e índices esperados.
- [ ] Reiniciar la aplicación y comprobar que los incidentes creados siguen existiendo.
- [ ] Probar filtros por `estado` y `prioridad`, lectura por ID y respuestas para IDs inexistentes.
- [ ] Verificar que todas las consultas SQL usan parámetros enlazados y no concatenan datos del usuario.
- [ ] Definir una estrategia de copia de seguridad y restauración de SQLite.
- [ ] En despliegues con varios procesos o instancias, confirmar que SQLite es adecuada para el patrón de escritura y el almacenamiento disponible; si no lo es, planificar una base de datos administrada.
- [ ] No guardar la base de datos en un sistema de archivos efímero si se espera persistencia tras reinicios o nuevos despliegues.

### 4.2 Operaciones que deben probarse — P1

- [ ] `GET /api/incidentes`: listar incidentes autenticado.
- [ ] `GET /api/incidentes/:id`: consultar uno existente y uno inexistente.
- [ ] `POST /api/incidentes`: crear uno válido; rechazar campos inválidos.
- [ ] `PUT /api/incidentes/:id`: reemplazar/actualizar según el contrato documentado.
- [ ] `PATCH /api/incidentes/:id`: actualizar parcialmente y rechazar un objeto vacío si esa es la regla definida.
- [ ] `DELETE /api/incidentes/:id`: permitir a administrador y rechazar a analista.
- [ ] Comprobar persistencia tras cerrar y volver a iniciar el servidor.
- [ ] Comprobar códigos HTTP consistentes (`200`, `201`, `400` o `422` según el contrato, `401`, `403`, `404`, `500`).
- [ ] Comprobar que un error de base de datos no devuelve trazas ni detalles internos al cliente.

---

## 5. Autenticación, autorización y validación

El código revisado contiene JWT, hashing con `bcryptjs` y control de rol de administrador en la eliminación. Deben validarse estos puntos en pruebas de extremo a extremo:

- [ ] Sin token: las rutas protegidas devuelven `401`.
- [ ] Token malformado, expirado o firmado con otra clave: devuelve `401`.
- [ ] Token válido sin rol suficiente: devuelve `403` cuando corresponda.
- [ ] Administrador puede eliminar; analista no puede eliminar.
- [ ] Contraseñas almacenadas como hash; nunca en texto plano.
- [ ] La autenticación no revela si una cuenta existe mediante mensajes excesivamente específicos.
- [ ] Validar y normalizar `titulo`, `descripcion`, `tipo`, `prioridad` y `estado` tanto en el servidor como en el cliente.
- [ ] Rechazar valores fuera de los permitidos, cadenas vacías, tamaños excesivos y tipos incorrectos.
- [ ] Rechazar campos que el usuario no puede modificar (por ejemplo, rol, ID o fecha de creación), en vez de confiar en el cuerpo recibido.
- [ ] Verificar que la validación no muta el objeto de entrada si la validación falla.
- [ ] Considerar limitación de intentos de inicio de sesión y rate limiting antes de exponer el servicio públicamente.
- [ ] Definir el procedimiento de rotación de `JWT_SECRET` y la duración de los tokens.
- [ ] Revisar dónde se almacena el JWT en el navegador. La documentación indica que la interfaz lo mantiene en memoria; evitar moverlo a almacenamiento persistente sin una evaluación de riesgos XSS.

---

## 6. HTTPS, CORS y cabeceras

### 6.1 HTTPS real — P0 para producción

`HTTPS.md` indica que TLS termina en un proxy inverso. Eso significa que HTTPS depende también de la plataforma de despliegue:

- [ ] Elegir un proveedor de despliegue y definir dominio o URL pública.
- [ ] Configurar certificado TLS vigente en el proxy/plataforma.
- [ ] Forzar redirección de HTTP a HTTPS en el proxy.
- [ ] Configurar `NODE_ENV=production`.
- [ ] Configurar `TRUST_PROXY=1` únicamente si la aplicación está detrás de un proxy de confianza que sobrescribe correctamente los encabezados `X-Forwarded-*`.
- [ ] Configurar `CLIENT_ORIGIN` con el origen HTTPS exacto en producción, sin ruta ni parámetros.
- [ ] Probar desde fuera del entorno local que HTTPS funciona y que HTTP no permite usar la API en producción.
- [ ] Confirmar que la plataforma conserva la base de datos y permite escritura persistente.
- [ ] Documentar la renovación del certificado y el comportamiento ante una caída del proxy.

**No afirmar que la plataforma ya está desplegada con HTTPS hasta comprobar la URL pública y el certificado desde un navegador.**

### 6.2 CORS y cabeceras — P1

- [ ] En producción, permitir únicamente el origen real del frontend.
- [ ] Rechazar orígenes no autorizados y comprobarlo con una prueba.
- [ ] Revisar la configuración de `helmet` y Content Security Policy con la interfaz desplegada.
- [ ] Si el frontend y la API se publican en orígenes diferentes, actualizar `CLIENT_ORIGIN` y verificar `connect-src` de la CSP.
- [ ] No usar `Access-Control-Allow-Origin: *` como solución rápida para errores de CORS.

---

## 7. Logs, errores y health check

### 7.1 Logs — P1

- [ ] Verificar que se registra método, ruta, código HTTP y duración de cada petición.
- [ ] No registrar `Authorization`, JWT, contraseñas, cuerpo de inicio de sesión ni datos sensibles.
- [ ] Diferenciar logs de desarrollo y producción; evitar imprimir información de cuentas iniciales en producción.
- [ ] Asegurar que los errores se registran en el servidor con un identificador de petición cuando sea posible.
- [ ] Comprobar que el middleware central de errores devuelve mensajes seguros al cliente.
- [ ] Definir retención y acceso a logs en el proveedor de despliegue.

### 7.2 Health check — P1

En los archivos revisados de `src/app.js` no se observó una ruta explícita de health check. Añadir una ruta pública, por ejemplo `GET /health`, con respuesta mínima:

```json
{
  "status": "ok"
}
```

Requisitos recomendados:

- [ ] Responder con `200` si el proceso está operativo.
- [ ] Comprobar la conexión a la base de datos con una consulta sencilla, si se necesita un readiness check.
- [ ] No revelar secretos, configuración, rutas internas ni datos de usuarios.
- [ ] Decidir si separar `GET /health` (liveness) de `GET /ready` (readiness).
- [ ] Configurar el proveedor para consultar la ruta elegida y documentar su respuesta esperada.
- [ ] Añadir pruebas automatizadas para el health check y para el caso de base de datos no disponible, si se implementa readiness.

---

## 8. Pruebas automatizadas y calidad

El proyecto contiene suites Jest/Supertest y scripts `test` y `lint`. En una ejecución final se deben guardar los resultados actuales, no reutilizar resultados antiguos.

- [ ] Ejecutar `npm test` y confirmar que todas las suites pasan.
- [ ] Ejecutar `npm run lint` y resolver errores y advertencias relevantes.
- [ ] Ejecutar `npx jest --coverage` y guardar el resumen de cobertura como evidencia.
- [ ] Revisar las ramas críticas que siguen sin cubrirse; no perseguir solo un porcentaje alto.
- [ ] Cubrir autenticación, roles, CRUD, persistencia, validaciones, filtros, errores, health check y configuración.
- [ ] Incluir pruebas negativas: sin token, token inválido, rol insuficiente, datos inválidos, ID inexistente y origen no autorizado.
- [ ] Confirmar que las pruebas usan una base de datos temporal/de pruebas y no modifican la base de datos local de trabajo.
- [ ] Confirmar que las pruebas limpian los datos que crean.
- [ ] Ejecutar las pruebas en una instalación limpia después de `npm ci`.
- [ ] No afirmar que todas las pruebas pasan si la ejecución final no lo confirma.

**Comandos de validación:**

```bash
npm ci
npm run lint
npm test
npx jest --coverage
```

### 8.1 Configuración ESLint — P2

Se encontraron `eslint.config.js` y `eslint.config.mjs`. Antes de publicar:

- [ ] Revisar cuál de las dos configuraciones carga la versión instalada de ESLint.
- [ ] Mantener una sola configuración funcional para evitar ambigüedad.
- [ ] Confirmar que `npm run lint` revisa el código fuente y las pruebas, pero excluye dependencias, cobertura y archivos generados cuando corresponda.
- [ ] Guardar el resultado final de `npm run lint`.

---

## 9. Rendimiento y estabilidad

- [ ] Medir una consulta real de lectura en la base de datos con una cantidad representativa de incidentes.
- [ ] Revisar índices para los campos usados en filtros y ordenamiento; añadirlos solo con evidencia y después de evaluar el plan de consulta.
- [ ] Medir la carga de la interfaz y el tamaño de los recursos estáticos desde el navegador.
- [ ] Medir una petición real de API desde DevTools: duración, estado y tamaño de respuesta.
- [ ] Comprobar comportamiento con listas grandes, errores de red y servidor detenido.
- [ ] Evitar cargar todos los registros si el volumen esperado requiere paginación.
- [ ] Definir límites de tamaño de petición y de campos; comprobar que se rechazan cargas excesivas.
- [ ] Registrar valores antes/después, fecha, entorno y procedimiento de medición. No presentar micropruebas aisladas como garantía del rendimiento de producción.

---

## 10. Despliegue y configuración por entorno

- [ ] Documentar la versión de Node.js compatible y usar una versión soportada por el proveedor.
- [ ] Confirmar que `npm ci` instala el proyecto desde `package-lock.json`.
- [ ] Configurar las variables de entorno en el panel del proveedor, no en el repositorio.
- [ ] Establecer `NODE_ENV=production`, `PORT` según lo que proporcione la plataforma, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` y `CLIENT_ORIGIN`.
- [ ] Configurar las contraseñas iniciales de forma segura; evitar mantener credenciales de demostración después del despliegue.
- [ ] Confirmar que las migraciones se ejecutan una sola vez de manera controlada y que no se pierden datos en cada reinicio.
- [ ] Configurar almacenamiento persistente para SQLite si se conserva SQLite.
- [ ] Probar el arranque con configuración incompleta: la aplicación debe fallar de forma clara y no arrancar con secretos de ejemplo.
- [ ] Probar el reinicio y la recuperación después de un error.
- [ ] Verificar la URL pública desde una red/dispositivo distinto al equipo de desarrollo.
- [ ] Documentar cómo detener, actualizar y revertir el despliegue.

---

## 11. Limpieza y estructura del repositorio

- [ ] Mantener una sola entrada de servidor clara (`src/server.js`) y documentarla.
- [ ] Revisar si `server.js` en la raíz sigue siendo necesario; si es una versión antigua, retirarla solo después de comprobar que ningún script la usa.
- [ ] Revisar `data/incidente.json` y decidir si es un fixture de pruebas o un archivo obsoleto.
- [ ] Mantener una sola configuración ESLint.
- [ ] No subir `node_modules/`, `coverage/`, `.env`, bases de datos locales ni archivos WAL/SHM.
- [ ] Añadir `README.md` con requisitos, instalación, configuración, migración, ejecución, pruebas, rutas API, despliegue y solución de problemas.
- [ ] Añadir manual de usuario con capturas que no expongan tokens ni contraseñas.
- [ ] Añadir documento de arquitectura y seguridad, incluyendo limitaciones conocidas.
- [ ] Añadir licencia si corresponde y definir una política de contribución/versionado si el trabajo lo requiere.

---

## 12. Checklist de Git antes del primer push

Ejecutar desde la raíz del proyecto. Si el repositorio todavía no existe, inicializarlo solo después de revisar los archivos.

```bash
git status --short
git check-ignore -v .env node_modules coverage data/incidentes.sqlite
git diff --check
npm ci
npm run lint
npm test
```

Después de verificar que los archivos sensibles no están rastreados:

```bash
git add .
git status --short
git diff --cached --stat
git diff --cached --name-only
```

**Antes de confirmar el commit**, revisar la lista de archivos staged. Si aparece `.env`, `node_modules/`, `coverage/` o una base de datos local, detenerse y corregir el staging.

```bash
git commit -m "Preparar plataforma de incidentes para despliegue"
git remote -v
git push -u origin main
```

Los últimos comandos solo se ejecutan cuando el repositorio remoto ya está configurado y el nombre de la rama está confirmado.

---

## 13. Evidencias que deben conservarse

Guardar capturas o archivos con fecha y sin secretos visibles:

1. [ ] `npm run lint` sin errores.
2. [ ] `npm test` con resumen de suites y pruebas aprobadas.
3. [ ] Cobertura Jest actual.
4. [ ] Migración y persistencia tras reinicio.
5. [ ] CRUD completo desde la interfaz y/o API.
6. [ ] Rechazo de peticiones sin token.
7. [ ] Rechazo de analista al intentar una operación exclusiva de administrador.
8. [ ] Validación de datos incorrectos.
9. [ ] Health check respondiendo correctamente.
10. [ ] Logs sin contraseñas ni tokens.
11. [ ] DevTools mostrando una petición real y su tiempo de respuesta.
12. [ ] URL pública con HTTPS válido.
13. [ ] Repositorio GitHub con estructura limpia, `.env.example` y commits.
14. [ ] Manual de usuario, documentación técnica e informe final.
15. [ ] Presentación y guion de defensa.

---

## 14. Entregables de la unidad final

- [ ] **URL operativa:** dominio o URL pública real, con HTTPS comprobado.
- [ ] **Repositorio versionado:** historial de commits y archivos permitidos.
- [ ] **Documentación técnica:** arquitectura, módulos, modelo de datos, endpoints, configuración, seguridad, pruebas, despliegue y limitaciones.
- [ ] **Manual de usuario:** inicio de sesión, roles, creación/consulta/edición/cambio de estado/eliminación y mensajes de error.
- [ ] **Evidencias:** pruebas, lint, cobertura, persistencia, logs, health check y TLS.
- [ ] **Presentación:** problema, arquitectura, flujo, medidas de seguridad, pruebas, demostración y limitaciones.
- [ ] **Defensa preparada:** demostración del flujo completo y respuestas sobre arquitectura, seguridad, pruebas y decisiones técnicas.

No se debe inventar una URL de producción ni presentar una captura local como evidencia de despliegue público.

---

## 15. Guion mínimo para la defensa

1. Explicar el flujo: navegador → rutas Express → autenticación/autorización → controladores/servicios/modelos → SQLite → respuesta al cliente.
2. Iniciar sesión como administrador y mostrar una operación CRUD.
3. Iniciar sesión como analista y demostrar que una acción exclusiva de administrador es rechazada.
4. Mostrar una validación fallida y una respuesta de error controlada.
5. Mostrar que los datos sobreviven al reinicio del servidor.
6. Consultar el health check y explicar qué verifica.
7. Mostrar HTTPS en el navegador y explicar el papel del proxy inverso.
8. Presentar los resultados actuales de Jest, cobertura y ESLint.
9. Explicar límites: alcance de SQLite, gestión de secretos, ausencia de monitoreo avanzado, rate limiting si no está implementado y cualquier otra limitación real.

### Preguntas que conviene preparar

- ¿Por qué se separó la aplicación en rutas, controladores, servicios y modelos?
- ¿Cómo se almacenan y verifican las contraseñas?
- ¿Qué diferencia hay entre autenticación (`401`) y autorización (`403`)?
- ¿Cómo se protege una ruta y cómo se verifica el rol?
- ¿Cómo se conserva la información entre reinicios?
- ¿Dónde se configura HTTPS y qué pasa si se accede por HTTP?
- ¿Qué cubren las pruebas automatizadas y qué no cubren?
- ¿Qué limitaciones tiene SQLite en un despliegue con varias instancias?
- ¿Cómo se rotan secretos y se recupera una base de datos?
- ¿Qué evidencia demuestra que la versión publicada es la que se probó?

---

## 16. Orden recomendado de trabajo

1. **Bloquear publicación de secretos:** comprobar `.env`, Git y cualquier credencial expuesta.
2. **Limpiar el repositorio:** excluir dependencias, cobertura y bases de datos locales.
3. **Cerrar brechas operativas:** health check, persistencia y validación final.
4. **Consolidar calidad:** una configuración ESLint, pruebas y cobertura ejecutadas de nuevo.
5. **Completar documentación:** `README.md`, manual de usuario, arquitectura y limitaciones.
6. **Preparar despliegue:** variables del proveedor, almacenamiento persistente, TLS y URL.
7. **Verificar desde fuera:** probar la URL pública y recopilar evidencias.
8. **Preparar presentación y defensa:** demostrar el flujo real y declarar las limitaciones sin ocultarlas.

**Criterio de aprobación de esta auditoría:** no marcar la plataforma como operativa hasta que los puntos P0 estén resueltos y los puntos de despliegue, pruebas, URL y evidencias hayan sido verificados en el entorno publicado.
