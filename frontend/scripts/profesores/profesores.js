document.addEventListener('DOMContentLoaded', () => {
  initProfesores();
});

async function initProfesores() {
  bindModalEvents();
  bindFilterEvents();
  bindFormSubmit();
  await cargarProfesores();
}

function bindModalEvents() {
  const modal = document.getElementById('modal-profesor');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtn = document.getElementById('close-modal');

  openBtn.addEventListener('click', abrirModal);
  closeBtn.addEventListener('click', cerrarModal);

  window.addEventListener('click', (event) => {
    if (event.target === modal) cerrarModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarModal();
  });
}

function bindFilterEvents() {
  document.getElementById('search-nombre').addEventListener('input', applyFilters);
  document.getElementById('search-departamento').addEventListener('change', applyFilters);
  document.getElementById('search-sede').addEventListener('change', applyFilters);
  document.getElementById('search-sede-clases').addEventListener('change', applyFilters);
  document.getElementById('search-talleres-vra').addEventListener('change', applyFilters);
  document.getElementById('search-btn').addEventListener('click', applyFilters);
  document.getElementById('reset-btn').addEventListener('click', resetFiltros);
  document.getElementById('toggle-filtros-btn').addEventListener('click', toggleFiltros);
}

function bindFormSubmit() {
  document.getElementById('profesor-form').addEventListener('submit', handleFormSubmit);
}

async function cargarProfesores() {
  try {
    const profesores = await fetchProfesores();
    if (!profesores) return;
    setProfesoresCache(profesores);
    renderRows(getProfesoresCache());
    renderFiltros();
  } catch (error) {
    console.error('Error al cargar profesores:', error);
    alert('Error al cargar los profesores.');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('id_profesor').value;
  const data = getFormData();

  try {
    if (id) {
      await updateProfesor(id, data);
      alert('Profesor actualizado exitosamente.');
    } else {
      await createProfesor(data);
      alert('Profesor creado exitosamente.');
    }

    resetFormUI();
    cerrarModal();
    await cargarProfesores();
  } catch (error) {
    console.error('Error al guardar profesor:', error);
    alert('Error al guardar el profesor.');
  }
}

async function editarProfesor(id) {
  try {
    const profesor = await fetchProfesorById(id);
    if (!profesor) return;
    fillForm(normalizeProfesor(profesor));
    abrirModal();
  } catch (error) {
    console.error('Error al cargar la información del profesor:', error);
    alert('Error al cargar la información del profesor.');
  }
}

async function eliminarProfesor(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este profesor?')) return;

  try {
    await deleteProfesor(id);
    alert('Profesor eliminado exitosamente.');
    await cargarProfesores();
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    alert('Error al eliminar el profesor.');
  }
}

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;