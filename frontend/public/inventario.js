const formulario = document.querySelector('#formulario');
const nombre = document.querySelector('#nombre');
const cantidad = document.querySelector('#cantidad');
const guardar = document.querySelector('#guardar');
const cancelar = document.querySelector('#cancelar');
const titulo = document.querySelector('#titulo-formulario');
const mensaje = document.querySelector('#mensaje');
const tabla = document.querySelector('#tabla');
const filas = document.querySelector('#productos');
const estado = document.querySelector('#estado-listado');

let productos = [];
let idEdicion = null;
let guardando = false;

async function consultar(ruta, opciones) {
  const respuesta = await fetch(`/api/productos${ruta}`, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error ?? 'La operación no pudo completarse.');
  return datos;
}

function mostrarMensaje(texto, error = false) {
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', error);
}

function restablecerFormulario() {
  idEdicion = null;
  formulario.reset();
  titulo.textContent = 'Registrar producto';
  guardar.textContent = 'Guardar';
  cancelar.hidden = true;
}

function renderizar() {
  tabla.hidden = productos.length === 0;
  estado.hidden = productos.length > 0;
  estado.textContent = 'Aún no hay productos registrados.';
  filas.replaceChildren();

  for (const producto of productos) {
    const fila = filas.insertRow();
    fila.insertCell().textContent = producto.nombre;
    fila.insertCell().textContent = producto.cantidad;
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'secundario';
    editar.textContent = 'Editar';
    editar.setAttribute('aria-label', `Editar ${producto.nombre}`);
    editar.addEventListener('click', () => {
      if (guardando) return;
      idEdicion = producto.id;
      nombre.value = producto.nombre;
      cantidad.value = producto.cantidad;
      titulo.textContent = 'Editar producto';
      guardar.textContent = 'Actualizar';
      cancelar.hidden = false;
      mostrarMensaje('');
      nombre.focus();
    });
    fila.insertCell().append(editar);
  }
}

cancelar.addEventListener('click', () => {
  restablecerFormulario();
  mostrarMensaje('');
  nombre.focus();
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (guardando) return;

  guardando = true;
  guardar.disabled = true;
  cancelar.disabled = true;
  const id = idEdicion;
  mostrarMensaje('Guardando…');
  try {
    const producto = await consultar(id === null ? '' : `/${id}`, {
      method: id === null ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.value.trim(), cantidad: cantidad.valueAsNumber }),
    });
    if (id === null) productos.unshift(producto);
    else productos = productos.map((actual) => actual.id === id ? producto : actual);
    renderizar();
    restablecerFormulario();
    mostrarMensaje(id === null ? 'Producto registrado.' : 'Producto actualizado.');
  } catch (error) {
    mostrarMensaje(error.message, true);
  } finally {
    guardando = false;
    guardar.disabled = false;
    cancelar.disabled = false;
  }
});

guardar.disabled = true;
try {
  productos = await consultar('');
  renderizar();
} catch (error) {
  estado.textContent = error.message;
} finally {
  guardar.disabled = false;
}
