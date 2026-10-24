# Manual de usuario

**Proyecto:** Plataforma de Gestión de Incidentes de Ciberseguridad  
**Versión objetivo:** 1.0.0  
**Fecha:** 2026-10-23

## 1. Acceso

Abra la URL del servicio usando HTTPS e inicie sesión con la cuenta que le proporcionó el responsable. Hay cuentas `admin` y `analista`; no comparta contraseñas ni tokens. Si las credenciales no son válidas, la aplicación muestra un mensaje genérico.

## 2. Crear un incidente

Desde la vista de incidentes, abra el formulario de creación y complete título, descripción, tipo, prioridad y estado. Los valores admitidos son:

- Tipo: `Phishing`, `Malware`, `Acceso no autorizado`, `Otro`.
- Prioridad: `Baja`, `Media`, `Alta`, `Crítica`.
- Estado: `Pendiente`, `En análisis`, `Resuelto`.

Guarde el formulario. Si hay campos incompletos, valores no admitidos o límites excedidos, revise los errores de validación indicados.

## 3. Consultar y filtrar

La lista muestra los incidentes disponibles para la cuenta. Use los filtros de estado y prioridad para acotar los resultados; quite los filtros para volver a la lista completa. Abra un registro para consultar su detalle.

## 4. Actualizar un incidente

Abra el registro, modifique los campos permitidos y guarde. También se puede cambiar el estado mediante la acción correspondiente. Si el registro ya no existe, la aplicación lo indicará.

## 5. Eliminar

Solo una cuenta con rol `admin` puede eliminar un registro. La cuenta `analista` puede crear, consultar y actualizar, pero recibirá un mensaje de acceso denegado si intenta eliminar.

## 6. Problemas frecuentes

| Situación | Qué hacer |
|---|---|
| Credenciales rechazadas | Verifique usuario/contraseña con el responsable; no repita intentos en exceso. |
| Sesión no autorizada o token vencido | Vuelva a iniciar sesión. |
| Error de validación | Corrija los campos señalados y use las opciones permitidas. |
| Recurso no encontrado | Actualice la lista y confirme que el registro siga disponible. |
| Servicio no disponible | Avise al responsable e incluya el `X-Request-Id` de la respuesta si aparece. |
| Error `426 HTTPS_REQUIRED` | Abra la URL HTTPS y contacte al responsable si persiste. |

Las capturas de la versión pública deben añadirse después del despliegue y no deben mostrar contraseñas, tokens ni valores secretos.
