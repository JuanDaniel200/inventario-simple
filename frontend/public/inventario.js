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
const resumen = document.querySelector('#resumen-inventario');
const totalProductos = document.querySelector('#total-productos');
const totalUnidades = document.querySelector('#total-unidades');
const dialogo = document.querySelector('#confirmar-eliminacion');
const detalleEliminar = document.querySelector('#detalle-eliminar');
const tituloInventario = document.querySelector('#titulo-inventario');
const formatoCantidad = new Intl.NumberFormat('es-CO');

let productos = [];
let idEdicion = null;
let productoParaEliminar = null;
let ocupado = false;

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

function cambiarEstadoFormulario(operacionEnCurso) {
  ocupado = operacionEnCurso;
  guardar.disabled = operacionEnCurso;
  cancelar.disabled = operacionEnCurso;
}

function restablecerFormulario() {
  idEdicion = null;
  formulario.reset();
  titulo.textContent = 'Registrar producto';
  guardar.textContent = 'Guardar';
  cancelar.hidden = true;
}

function renderizar() {
  resumen.hidden = false;
  totalProductos.textContent = formatoCantidad.format(productos.length);
  totalUnidades.textContent = formatoCantidad.format(productos.reduce((suma, producto) => suma + producto.cantidad, 0));
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
      if (ocupado) return;
      idEdicion = producto.id;
      nombre.value = producto.nombre;
      cantidad.value = producto.cantidad;
      titulo.textContent = 'Editar producto';
      guardar.textContent = 'Actualizar';
      cancelar.hidden = false;
      mostrarMensaje('');
      nombre.focus();
    });

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'peligro';
    eliminar.textContent = 'Eliminar';
    eliminar.setAttribute('aria-label', `Eliminar ${producto.nombre}`);
    eliminar.addEventListener('click', () => {
      if (ocupado) return;
      productoParaEliminar = producto;
      detalleEliminar.textContent = `¿Quieres retirar «${producto.nombre}» del inventario?`;
      dialogo.returnValue = 'cancelar';
      dialogo.showModal();
    });

    const acciones = document.createElement('div');
    acciones.className = 'acciones-fila';
    acciones.append(editar, eliminar);
    fila.insertCell().append(acciones);
  }
}

cancelar.addEventListener('click', () => {
  restablecerFormulario();
  mostrarMensaje('');
  nombre.focus();
});

dialogo.addEventListener('close', async () => {
  const producto = productoParaEliminar;
  productoParaEliminar = null;
  if (dialogo.returnValue !== 'eliminar' || !producto || ocupado) return;

  cambiarEstadoFormulario(true);
  mostrarMensaje('Eliminando…');
  try {
    await consultar(`/${producto.id}`, { method: 'DELETE' });
    productos = productos.filter((actual) => actual.id !== producto.id);
    if (idEdicion === producto.id) restablecerFormulario();
    renderizar();
    mostrarMensaje('Producto retirado del inventario.');
    tituloInventario.focus();
  } catch (error) {
    mostrarMensaje(error.message, true);
  } finally {
    cambiarEstadoFormulario(false);
  }
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (ocupado) return;

  cambiarEstadoFormulario(true);
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
    cambiarEstadoFormulario(false);
  }
});

cambiarEstadoFormulario(true);
try {
  productos = await consultar('');
  renderizar();
} catch (error) {
  estado.textContent = error.message;
} finally {
  cambiarEstadoFormulario(false);
}
