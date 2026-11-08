import express from 'express';
import pg from 'pg';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3000);

if (!process.env.PGDATABASE) {
  throw new Error('Configura la conexión de PostgreSQL a partir de backend/.env.example.');
}

const pool = new pg.Pool({ connectionTimeoutMillis: 3000, max: 5 });
pool.on('error', (error) => console.error('Conexión a PostgreSQL interrumpida:', error.message));

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));

function leerProducto(body) {
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
  const cantidad = body?.cantidad;
  if (!nombre || nombre.length > 80 || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 999999) {
    return null;
  }
  return { nombre, cantidad };
}

function leerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

app.get('/api/salud', async (_request, response) => {
  try {
    await pool.query('SELECT 1 FROM productos LIMIT 1');
    response.json({ estado: 'ok', baseDeDatos: 'conectada' });
  } catch {
    response.status(503).json({ error: 'La tabla de productos no está disponible.' });
  }
});

app.get('/api/productos', async (_request, response) => {
  const { rows } = await pool.query('SELECT id, nombre, cantidad FROM productos ORDER BY id DESC');
  response.json(rows);
});

app.post('/api/productos', async (request, response) => {
  const producto = leerProducto(request.body);
  if (!producto) {
    return response.status(400).json({ error: 'Ingresa un nombre de hasta 80 caracteres y una cantidad entera entre 0 y 999999.' });
  }

  const { rows } = await pool.query(
    'INSERT INTO productos (nombre, cantidad) VALUES ($1, $2) RETURNING id, nombre, cantidad',
    [producto.nombre, producto.cantidad],
  );
  response.status(201).json(rows[0]);
});

app.put('/api/productos/:id', async (request, response) => {
  const id = leerId(request.params.id);
  const producto = leerProducto(request.body);
  if (id === null || !producto) {
    return response.status(400).json({ error: 'Revisa el identificador, el nombre y la cantidad del producto.' });
  }

  const { rows } = await pool.query(
    'UPDATE productos SET nombre = $1, cantidad = $2 WHERE id = $3 RETURNING id, nombre, cantidad',
    [producto.nombre, producto.cantidad, id],
  );
  if (rows.length === 0) {
    return response.status(404).json({ error: 'El producto ya no está disponible.' });
  }
  response.json(rows[0]);
});

app.delete('/api/productos/:id', async (request, response) => {
  const id = leerId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: 'Revisa el identificador del producto.' });
  }

  await pool.query('DELETE FROM productos WHERE id = $1', [id]);
  response.json({ id });
});

app.use((_request, response) => response.status(404).json({ error: 'Ruta desconocida.' }));

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Envía datos JSON válidos.' });
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Los datos enviados superan el tamaño permitido.' });
  }
  console.error('Error al consultar el inventario:', error.message);
  response.status(500).json({ error: 'No se pudo completar la operación. Revisa la conexión a PostgreSQL.' });
});

app.listen(port, host, () => console.log(`API de Inventario Simple en http://${host}:${port}`));
