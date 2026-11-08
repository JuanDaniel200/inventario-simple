import express from 'express';
import { fileURLToPath } from 'node:url';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 8080);
const apiUrl = new URL(process.env.API_URL ?? 'http://127.0.0.1:3000');

const app = express();
app.disable('x-powered-by');
app.use('/api', express.json({ limit: '8kb' }), async (request, response) => {
  const endpoint = new URL(apiUrl.origin);
  endpoint.pathname = `/api${request.path}`;
  const options = { method: request.method, signal: AbortSignal.timeout(6000), redirect: 'error' };
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(request.body);
  }

  try {
    const upstream = await fetch(endpoint, options);
    response.status(upstream.status).type('application/json').send(await upstream.text());
  } catch {
    response.status(502).json({ error: 'No se pudo contactar con la API de inventario.' });
  }
});
app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
app.use((error, _request, response, _next) => {
  const status = error.status ?? 500;
  response.status(status).json({ error: status < 500 ? 'Los datos enviados no son válidos.' : 'No se pudo cargar la aplicación.' });
});

app.listen(port, host, () => console.log(`Inventario Simple en http://${host}:${port}`));
