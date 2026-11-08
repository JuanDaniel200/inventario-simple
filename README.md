# Inventario Simple

Aplicación web para registrar productos, consultar el inventario y editar las existencias. Pensada como proyecto académico de Integración Continua.

| Componente | Responsabilidad |
| --- | --- |
| `frontend/` | Sirve la interfaz HTML, CSS y JavaScript. Reenvía las peticiones `/api/` al backend. |
| `backend/` | Ofrece una API en Node.js y Express. Valida los datos y consulta PostgreSQL. |
| `database/` | Define la tabla `productos` y sus restricciones. |

El flujo es **navegador → frontend → backend → PostgreSQL**. El backend recibe la configuración de PostgreSQL mediante variables de entorno. El frontend usa `API_URL` para localizar al backend.

## Ejecutar en Windows

Requisitos de la prueba local: Node.js 24 y PostgreSQL 17 o posterior. Los comandos de esta sección usan PowerShell y parten de la raíz del repositorio.

1. Crea una base de datos llamada `inventario_simple` en tu instalación de PostgreSQL. Ejecuta `database/schema.sql` en esa base. Si `psql` está disponible en tu terminal, puedes hacerlo con estos comandos:

   ```powershell
   psql -h 127.0.0.1 -U postgres -d postgres -c 'CREATE DATABASE inventario_simple;'
   psql -h 127.0.0.1 -U postgres -d inventario_simple -f database/schema.sql
   ```

2. Abre una terminal para el backend. Completa el archivo `.env` con los datos de tu instalación de PostgreSQL antes de iniciar el servidor.

   ```powershell
   Set-Location backend
   Copy-Item .env.example .env
   npm ci
   npm start
   ```

3. Abre otra terminal en la raíz del repositorio e inicia el frontend.

   ```powershell
   Set-Location frontend
   npm ci
   npm start
   ```

4. Abre <http://127.0.0.1:8080>. Registra un producto, cambia sus unidades y recarga la página. El cambio debe seguir visible porque se guarda en PostgreSQL.

## API

| Solicitud | Resultado |
| --- | --- |
| `GET /api/salud` | Verifica que la API pueda consultar la tabla `productos`. |
| `GET /api/productos` | Devuelve los productos registrados. |
| `POST /api/productos` | Registra un producto con `nombre` y `cantidad`. |
| `PUT /api/productos/:id` | Actualiza el nombre y las unidades de un producto. |

Puedes verificar el recorrido completo en <http://127.0.0.1:8080/api/salud>. Si los tres componentes están disponibles, la respuesta contiene `{"estado":"ok","baseDeDatos":"conectada"}`.
