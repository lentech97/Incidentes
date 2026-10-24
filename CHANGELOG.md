# Changelog

## 1.0.0 — 2026-10-23

- Se añadió el endpoint `/health` con comprobación de SQLite.
- Se agregaron logs estructurados con `requestId` y errores internos correlacionados.
- Se registran intentos de login fallidos y se limitan a 10 por 15 minutos e IP.
- Se agregó configuración de despliegue Render, integración continua y documentación técnica/usuario.
- Se corrigieron los archivos de configuración, exclusiones de Git y el script de rendimiento.
