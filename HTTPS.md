# HTTPS en producción

La aplicación espera que TLS termine en un proxy inverso de confianza. Configure el proxy con un certificado vigente, redirija HTTP a HTTPS y asegúrese de que sobrescriba `X-Forwarded-Proto` para que no se acepten valores enviados directamente por el cliente.

En el entorno de la aplicación:

- Configure `NODE_ENV=production` para que el servidor rechace solicitudes que no detecte como HTTPS.
- Defina `TRUST_PROXY=1` solo cuando la aplicación esté detrás del proxy controlado.
- Proteja `.env`, `JWT_SECRET` y las contraseñas iniciales; no los incluya en el repositorio ni en registros.
- Mantenga el certificado y la clave privada en el proxy o gestor de secretos, con permisos restringidos.
- Use HTTPS también para `CLIENT_ORIGIN` en producción.

En desarrollo local se puede usar HTTP en `localhost` con `NODE_ENV=development`. No reutilice esa configuración para publicar el servicio. Si más adelante se usan cookies para autenticación, configúrelas con `Secure`, `HttpOnly` y una política `SameSite` apropiada; actualmente la interfaz mantiene el JWT solo en memoria.

La aplicación no provisiona certificados ni redirige HTTP en el proxy: esas acciones dependen del entorno de despliegue. Verifique el certificado, la redirección y los encabezados del proxy en el entorno publicado.
