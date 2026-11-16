# PharmaFrontend

## Despliegue en producción

```text
Navegador ── HTTPS 443 ──► Nginx ── HTTP privado 8080 ──► PharmaBackend
                              │                              ├── Oracle TCP 1521
                              └── Angular y archivos con hash └── Redis TCP 6379
```

Nginx escucha en el puerto 80 dentro del contenedor y sirve Angular en el mismo origen que `/api/v1`. El entorno de la práctica publica Nginx en `127.0.0.1:8081` y Oracle en `1522`. En el entorno final, los tres locales deben usar una URL HTTPS común y el proxy debe alcanzar al backend por una red privada.

| Variable | Propósito |
| --- | --- |
| `FRONTEND_ORIGINS` | Orígenes autorizados por el backend cuando el cliente usa otro origen. La SPA en producción usa una URL relativa. |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Conexión a Oracle. Se configuran exclusivamente en el backend. |
| `JWT_SECRET`, `JWT_EXPIRACION_MINUTOS` | Firma y vigencia de sesiones. Se configuran en el backend. |
| `REDIS_HOST`, `REDIS_PORT` | Dirección de caché que utiliza el backend. |
| `SPRING_PROFILES_ACTIVE`, `SERVER_PORT` | Perfil de producción y puerto del upstream. |

Angular se compila con la configuración `production`. Los archivos JS que descarga el navegador son públicos, por lo que las credenciales se inyectan únicamente en los servicios del servidor.

1. Ejecuta `npm ci`, `npm test -- --watch=false` y `npm run build -- --configuration production --stats-json`. Conserva `dist/pharma-frontend/browser` y el hash del commit por versión. Comprueba el presupuesto inicial.
2. Inicia el backend y valida health. En la práctica, ejecuta `docker compose -f deploy/docker-compose.yml up -d` para servir la SPA y Redis. Configura el upstream de `deploy/nginx.conf` para la red privada del entorno final y termina TLS en el punto de entrada.
3. Publica primero los archivos estáticos con hash y reemplaza `index.html` al final. Mantén disponibles los chunks de la versión anterior para las sesiones abiertas. Comprueba una recarga directa de `/productos`, las cabeceras y la navegación tras el login.
4. Para volver atrás, restituye el HTML y los archivos de la última versión aprobada. Si también cambió el contrato de API, coordina la reversión con el backend y valida el esquema Oracle. Comprueba login, Ventas y catálogo con una sesión nueva y otra ya abierta.

| Buena práctica de la sesión | Estado | Acción pendiente |
| --- | --- | --- |
| Rutas diferidas y reporte por permiso | Cumple | Revisar `browser-stats.json` ante aumentos del tamaño inicial. |
| Nginx revalida HTML y conserva archivos con hash | Cumple | Mantener artefactos previos durante el despliegue. |
| API sin caché de navegador | Cumple | Verificar el encabezado al activar el proxy HTTPS. |
| Redis con TTL, invalidación y degradación | Cumple parcialmente | Coordinar la purga tras interrupciones con escrituras. |
| Mensaje de error con código de seguimiento | Cumple | Usar ese código al abrir incidencias de soporte. |
| Logs y métricas con acceso controlado | Cumple | Configurar alertas de salud y latencia. |
| HTTPS y recuperación de datos | Cumple parcialmente | Habilitar certificados y ensayar la restauración de Oracle en el entorno final. |

1. **Prioridad alta.** Habilita HTTPS en la URL común y verifica el login desde las tres redes.
2. **Prioridad alta.** Coordina copias de Oracle y conserva una versión anterior de la SPA y el API para la reversión.
3. **Prioridad media.** Monitoriza health, errores y latencia por local. Usa Redis compartido en el servidor, con acceso limitado a las instancias del backend.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
