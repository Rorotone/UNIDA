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
    showAppAlert(error.message || 'Error al cargar profesores.', 'error', {
      title: 'Error de carga'
    });
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('id_profesor')?.value;
  const data = getFormData();

  try {
    if (id) {
      await updateProfesor(id, data);
      showAppAlert('Profesor actualizado exitosamente.', 'success', {
        title: 'Cambios guardados'
      });
    } else {
      await createProfesor(data);
      showAppAlert('Profesor creado exitosamente.', 'success', {
        title: 'Registro creado'
      });
    }

    cerrarModal();
    resetFormUI();
    await cargarProfesores();
  } catch (error) {
    console.error('Error al guardar profesor:', error);
    showAppAlert(error.message || 'Error al guardar profesor.', 'error', {
      title: 'Error al guardar'
    });
  }
}

async function handleImportCSV() {
  const input = document.getElementById('csv-file-input');
  const file = input?.files?.[0];

  if (!file) {
    showAppAlert('Selecciona un archivo CSV.', 'warning', {
      title: 'Archivo requerido'
    });
    return;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'csv') {
    showAppAlert('Debes seleccionar un archivo con extensión .csv.', 'warning', {
      title: 'Formato inválido'
    });
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

    const fileName = document.getElementById('csv-file-name');
    const importBtn = document.getElementById('import-csv-btn');
    const csvInput = document.getElementById('csv-file-input');

    if (csvInput) csvInput.value = '';
    if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
    if (importBtn) importBtn.disabled = true;

    const errores = Array.isArray(result.detalle_errores) ? result.detalle_errores.length : 0;

    showAppAlert(
      `Insertados: ${Number(result.insertados || 0)} · Duplicados archivo: ${Number(result.duplicados_archivo || 0)} · Duplicados BD: ${Number(result.duplicados_bd || 0)} · Errores: ${errores}`,
      errores > 0 ? 'warning' : 'success',
      {
        title: result.message || 'Carga masiva procesada.',
        duration: 5500
      }
    );
  } catch (error) {
    console.error('Error al importar CSV:', error);
    showAppAlert(error.message || 'Error al importar el archivo CSV.', 'error', {
      title: 'Error de importación'
    });
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
    showAppAlert(error.message || 'Error al cargar profesor.', 'error', {
      title: 'Error al editar'
    });
  }
}

async function eliminarProfesor(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar profesor',
    message: '¿Seguro que deseas eliminar este profesor? Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });

  if (!confirmacion) return;

  try {
    await deleteProfesor(id);
    showAppAlert('Profesor eliminado exitosamente.', 'success', {
      title: 'Registro eliminado'
    });
    await cargarProfesores();
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    showAppAlert(error.message || 'Error al eliminar profesor.', 'error', {
      title: 'Error al eliminar'
    });
  }
}

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.cerrarModal = cerrarModal;