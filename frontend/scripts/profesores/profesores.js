document.addEventListener('DOMContentLoaded', () => {
  initProfesores();
});

async function initProfesores() {
  bindModalEvents();
  bindFilterEvents();
  bindFormSubmit();
  bindCSVImportEvents();
  await cargarProfesores();
}

function bindModalEvents() {
  const modal = document.getElementById('modal-profesor');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtn = document.getElementById('close-modal');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      resetFormUI();
      abrirModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', cerrarModal);
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) cerrarModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarModal();
  });
}

function bindFilterEvents() {
  document.getElementById('search-nombre')?.addEventListener('input', applyFilters);
  document.getElementById('search-departamento')?.addEventListener('change', applyFilters);
  document.getElementById('search-sede')?.addEventListener('change', applyFilters);
  document.getElementById('search-sede-clases')?.addEventListener('change', applyFilters);
  document.getElementById('search-talleres-vra')?.addEventListener('change', applyFilters);
  document.getElementById('search-btn')?.addEventListener('click', applyFilters);
  document.getElementById('reset-btn')?.addEventListener('click', resetFiltros);
  document.getElementById('toggle-filtros-btn')?.addEventListener('click', toggleFiltros);
}

function bindFormSubmit() {
  document.getElementById('profesor-form')?.addEventListener('submit', handleFormSubmit);
}

function bindCSVImportEvents() {
  const selectBtn = document.getElementById('select-csv-btn');
  const input = document.getElementById('csv-file-input');
  const importBtn = document.getElementById('import-csv-btn');

  if (selectBtn && input) {
    selectBtn.addEventListener('click', () => input.click());
  }

  if (input) {
    input.addEventListener('change', () => {
      const file = input.files?.[0] || null;
      updateSelectedCSVName(file);
      clearImportSummary();
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', handleImportCSV);
  }

  resetImportUI();
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
    alert(error.message || 'Error al cargar profesores.');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('id_profesor')?.value;
  const data = getFormData();

  try {
    if (id) {
      await updateProfesor(id, data);
      alert('Profesor actualizado exitosamente.');
    } else {
      await createProfesor(data);
      alert('Profesor creado exitosamente.');
    }

    cerrarModal();
    resetFormUI();
    await cargarProfesores();
  } catch (error) {
    console.error('Error al guardar profesor:', error);
    alert(error.message || 'Error al guardar profesor.');
  }
}

async function handleImportCSV() {
  const input = document.getElementById('csv-file-input');
  const file = input?.files?.[0];

  if (!file) {
    alert('Selecciona un archivo CSV.');
    return;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'csv') {
    alert('Debes seleccionar un archivo con extensión .csv');
    return;
  }

  try {
    setImportLoading(true);
    clearImportSummary();

    const result = await importarProfesoresCSV(file);
    if (!result) return;

    renderImportSummary(result);

    if (Number(result.insertados || 0) > 0) {
      await cargarProfesores();
    }

    resetImportUI();

    const mensaje = [
      result.message || 'Carga masiva procesada.',
      `Insertados: ${Number(result.insertados || 0)}`,
      `Duplicados archivo: ${Number(result.duplicados_archivo || 0)}`,
      `Duplicados BD: ${Number(result.duplicados_bd || 0)}`,
      `Errores: ${Array.isArray(result.detalle_errores) ? result.detalle_errores.length : 0}`
    ].join('\n');

    alert(mensaje);
  } catch (error) {
    console.error('Error al importar CSV:', error);
    alert(error.message || 'Error al importar el archivo CSV.');
  } finally {
    setImportLoading(false);
  }
}

async function editarProfesor(id) {
  try {
    const profesor = await fetchProfesorById(id);
    if (!profesor) return;

    fillForm(normalizeProfesor(profesor));
    abrirModal();
  } catch (error) {
    console.error('Error al cargar profesor:', error);
    alert(error.message || 'Error al cargar profesor.');
  }
}

async function eliminarProfesor(id) {
  const confirmacion = confirm('¿Seguro que deseas eliminar este profesor?');
  if (!confirmacion) return;

  try {
    await deleteProfesor(id);
    alert('Profesor eliminado exitosamente.');
    await cargarProfesores();
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    alert(error.message || 'Error al eliminar profesor.');
  }
}

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.cerrarModal = cerrarModal;