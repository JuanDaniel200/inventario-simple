import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

const base = new URL(process.env.INVENTARIO_URL ?? 'http://127.0.0.1:8080');

function api(path, method = 'GET', body) {
  return fetch(new URL(`/api${path}`, base), {
    method,
    signal: AbortSignal.timeout(6000),
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

async function listar() {
  const respuesta = await api('/productos');
  assert.equal(respuesta.status, 200);
  return respuesta.json();
}

test('registra, actualiza y elimina un producto a través del frontend', async (context) => {
  const salud = await api('/salud');
  assert.equal(salud.status, 200);
  assert.deepEqual(await salud.json(), { estado: 'ok', baseDeDatos: 'conectada' });

  const nombre = `Producto QA ${randomUUID().slice(0, 8)}`;
  const alta = await api('/productos', 'POST', { nombre, cantidad: 5 });
  assert.equal(alta.status, 201);
  const producto = await alta.json();
  const ruta = `/productos/${producto.id}`;
  context.after(async () => {
    assert.equal((await api(ruta, 'DELETE')).status, 200);
  });
  assert.deepEqual((await listar()).find((fila) => fila.id === producto.id), { id: producto.id, nombre, cantidad: 5 });

  const actualizacion = await api(ruta, 'PUT', { nombre, cantidad: 8 });
  assert.equal(actualizacion.status, 200);
  assert.deepEqual((await listar()).find((fila) => fila.id === producto.id), { id: producto.id, nombre, cantidad: 8 });

  const baja = await api(ruta, 'DELETE');
  assert.equal(baja.status, 200);
  assert.deepEqual(await baja.json(), { id: producto.id });
  assert.equal((await listar()).some((fila) => fila.id === producto.id), false);
});
