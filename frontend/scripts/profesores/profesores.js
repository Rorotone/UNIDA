document.addEventListener('DOMContentLoaded', () => {
  initProfesores();
});

let sedesSearchTimer = null;

/* =========================================================
   INIT
========================================================= */

async function initProfesores() {
  bindModalEvents();
  bindFilterEvents();
  bindFormSubmit();
  bindCSVImportEvents();
  bindCatalogoEvents();
  bindProfesorTabs();
  bindSedesFieldEvents();
  bindSelectorCardEvents();
  await cargarDatosBase();
}

/* =========================================================
   BINDS GENERALES
========================================================= */

function bindModalEvents() {
  const modalProfesor = document.getElementById('modal-profesor');
  const modalTalleres = document.getElementById('modal-catalogo-talleres');
  const modalFormaciones = document.getElementById('modal-catalogo-formaciones');
  const modalMagister = document.getElementById('modal-catalogo-magister');

  const openBtn = document.getElementById('open-modal-btn');
  const closeBtn = document.getElementById('close-modal');

  const openCatalogBtn = document.getElementById('open-catalogo-modal-btn');
  const openCatalogSecondaryBtn = document.getElementById('open-catalogo-modal-secondary-btn');
  const closeCatalogBtn = document.getElementById('close-catalogo-modal');

  const openCatalogoFormacionesBtn = document.getElementById('open-catalogo-formaciones-btn');
  const closeCatalogoFormacionesBtn = document.getElementById('close-catalogo-formaciones-modal');

  const openCatalogoMagisterBtn = document.getElementById('open-catalogo-magister-btn');
  const closeCatalogoMagisterBtn = document.getElementById('close-catalogo-magister-modal');

  openBtn?.addEventListener('click', async () => {
    resetFormUI();
    await recargarCatalogosFormulario();
    abrirModal();
  });

  closeBtn?.addEventListener('click', cerrarModal);

  openCatalogBtn?.addEventListener('click', abrirModalCatalogo);
  openCatalogSecondaryBtn?.addEventListener('click', abrirModalCatalogo);
  closeCatalogBtn?.addEventListener('click', cerrarModalCatalogo);

  openCatalogoFormacionesBtn?.addEventListener('click', abrirModalCatalogoFormaciones);
  closeCatalogoFormacionesBtn?.addEventListener('click', cerrarModalCatalogoFormaciones);

  openCatalogoMagisterBtn?.addEventListener('click', abrirModalCatalogoMagister);
  closeCatalogoMagisterBtn?.addEventListener('click', cerrarModalCatalogoMagister);

  window.addEventListener('click', (event) => {
    if (event.target === modalProfesor) cerrarModal();
    if (event.target === modalTalleres) cerrarModalCatalogo();
    if (event.target === modalFormaciones) cerrarModalCatalogoFormaciones();
    if (event.target === modalMagister) cerrarModalCatalogoMagister();

    const suggestions = document.getElementById('sedes-suggestions');
    const searchWrap = document.querySelector('.sedes-search-wrap');

    if (suggestions && searchWrap && !searchWrap.contains(event.target)) {
      hideSedesSuggestions();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    cerrarModal();
    cerrarModalCatalogo();
    cerrarModalCatalogoFormaciones();
    cerrarModalCatalogoMagister();
  });
}

function bindFilterEvents() {
  document.getElementById('search-nombre')?.addEventListener('input', applyFilters);
  document.getElementById('search-departamento')?.addEventListener('change', applyFilters);
  document.getElementById('search-sede')?.addEventListener('change', applyFilters);
  document.getElementById('search-btn')?.addEventListener('click', applyFilters);
  document.getElementById('reset-btn')?.addEventListener('click', resetFiltros);
  document.getElementById('toggle-filtros-btn')?.addEventListener('click', toggleFiltros);
}

function bindFormSubmit() {
  document.getElementById('profesor-form')?.addEventListener('submit', handleFormSubmit);
}

function bindCatalogoEvents() {
  document.getElementById('catalogo-taller-form')?.addEventListener('submit', handleCatalogoTallerSubmit);
  document.getElementById('catalogo-reset-btn')?.addEventListener('click', resetCatalogoForm);

  document.getElementById('catalogo-formacion-form')?.addEventListener('submit', handleCatalogoFormacionSubmit);
  document.getElementById('catalogo-formacion-reset-btn')?.addEventListener('click', resetCatalogoFormacionForm);

  document.getElementById('catalogo-magister-form')?.addEventListener('submit', handleCatalogoMagisterSubmit);
  document.getElementById('catalogo-magister-reset-btn')?.addEventListener('click', resetCatalogoMagisterForm);
}

function bindSelectorCardEvents() {
  document.addEventListener('change', (event) => {
    const card = event.target.closest('.taller-option');
    if (!card) return;

    const container =
      card.closest('#talleres-selector') ||
      card.closest('#formaciones-selector') ||
      card.closest('#magister-selector');

    if (!container) return;

    updateSelectableCardState(container);
  });

  document.addEventListener('click', (event) => {
    const card = event.target.closest('.taller-option');
    if (!card) return;

    const input = card.querySelector('input');
    if (!input) return;
    if (event.target === input) return;

    if (input.type === 'checkbox') {
      input.checked = !input.checked;
    } else if (input.type === 'radio') {
      input.checked = true;
    }

    const container =
      card.closest('#talleres-selector') ||
      card.closest('#formaciones-selector') ||
      card.closest('#magister-selector');

    updateSelectableCardState(container);
  });
}

/* =========================================================
   SEDES
========================================================= */

function bindSedesFieldEvents() {
  const searchInput = document.getElementById('sedes-search-input');
  const selectedContainer = document.getElementById('sedes-selected');
  const suggestions = document.getElementById('sedes-suggestions');

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim();
    window.clearTimeout(sedesSearchTimer);

    sedesSearchTimer = window.setTimeout(async () => {
      try {
        const sedes = await fetchCatalogoSedes(query);
        if (!sedes) return;

        setCatalogoSedesCache(sedes);

        const selectedIds = new Set(getSelectedSedeIds());
        const visibles = sedes.filter((sede) => !selectedIds.has(Number(sede.id_sede)));
        renderSedesSuggestions(visibles);
      } catch (error) {
        console.error('Error al buscar sedes:', error);
        renderSedesSuggestions([]);
      }
    }, 150);
  });

  searchInput?.addEventListener('focus', async () => {
    try {
      const sedes = await fetchCatalogoSedes(searchInput.value.trim());
      if (!sedes) return;

      setCatalogoSedesCache(sedes);

      const selectedIds = new Set(getSelectedSedeIds());
      renderSedesSuggestions(
        sedes.filter((sede) => !selectedIds.has(Number(sede.id_sede)))
      );
    } catch (error) {
      console.error('Error al cargar sugerencias de sedes:', error);
      renderSedesSuggestions([]);
    }
  });

  suggestions?.addEventListener('click', (event) => {
    const button = event.target.closest('.sede-suggestion-item');
    if (!button) return;

    const id = Number(button.dataset.id);
    const sede = getCatalogoSedesCache().find((item) => Number(item.id_sede) === id);
    if (!sede) return;

    addSelectedSede(sede);
  });

  selectedContainer?.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.sede-chip-remove');
    if (!removeBtn) return;
    removeSelectedSede(Number(removeBtn.dataset.id));
  });

  const handleSelectedSedeField = (event) => {
    const target = event.target;
    if (!target?.dataset?.action || target.dataset.action !== 'sede-field') return;

    const id = Number(target.dataset.id);
    const field = target.dataset.field;
    if (!Number.isInteger(id) || !field) return;

    updateSelectedSedeField(id, field, target.value?.trim?.() ?? '');
  };

  selectedContainer?.addEventListener('change', handleSelectedSedeField);
}

/* =========================================================
   CSV
========================================================= */

function bindCSVImportEvents() {
  const selectBtn = document.getElementById('select-csv-btn');
  const input = document.getElementById('csv-file-input');
  const importBtn = document.getElementById('import-csv-btn');

  if (selectBtn && input) {
    selectBtn.addEventListener('click', () => input.click());
  }

  input?.addEventListener('change', () => {
    const file = input.files?.[0] || null;
    updateSelectedCSVName(file);
    clearImportSummary();
  });

  importBtn?.addEventListener('click', handleImportCSV);
  resetImportUI();
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
      await recargarProfesores();
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

/* =========================================================
   CARGA INICIAL
========================================================= */

async function cargarDatosBase() {
  try {
    const [
      profesores,
      catalogoTalleres,
      catalogoFormaciones,
      catalogoMagister,
      catalogoSedes
    ] = await Promise.all([
      fetchProfesores(),
      fetchCatalogoTalleres(),
      fetchCatalogoFormaciones(),
      fetchCatalogoMagister(),
      fetchCatalogoSedes()
    ]);

    if (!profesores || !catalogoTalleres || !catalogoFormaciones || !catalogoMagister || !catalogoSedes) {
      return;
    }

    setProfesoresCache(profesores);
    setCatalogoTalleresCache(catalogoTalleres);
    setCatalogoFormacionesCache(catalogoFormaciones);
    setCatalogoMagisterCache(catalogoMagister);
    setCatalogoSedesCache(catalogoSedes);

    renderRows(getProfesoresCache());
    renderFiltros();

    renderCatalogoTalleresTable(getCatalogoTalleresCache());
    renderCatalogoFormacionesTable(getCatalogoFormacionesCache());
    renderCatalogoMagisterTable(getCatalogoMagisterCache());

    renderTalleresSelector([]);
    renderFormacionesSelector([]);
    renderMagisterSelector(null);
    setSelectedSedes([]);
  } catch (error) {
    console.error('Error al cargar profesores:', error);
    showAppAlert(error.message || 'Error al cargar profesores.', 'error', {
      title: 'Error de carga'
    });
  }
}

async function recargarProfesores() {
  const profesores = await fetchProfesores();
  if (!profesores) return;

  setProfesoresCache(profesores);
  renderRows(getProfesoresCache());
  renderFiltros();
}

async function recargarCatalogosFormulario() {
  const [
    catalogoTalleres,
    catalogoFormaciones,
    catalogoMagister,
    catalogoSedes
  ] = await Promise.all([
    fetchCatalogoTalleres(),
    fetchCatalogoFormaciones(),
    fetchCatalogoMagister(),
    fetchCatalogoSedes()
  ]);

  if (!catalogoTalleres || !catalogoFormaciones || !catalogoMagister || !catalogoSedes) return;

  setCatalogoTalleresCache(catalogoTalleres);
  setCatalogoFormacionesCache(catalogoFormaciones);
  setCatalogoMagisterCache(catalogoMagister);
  setCatalogoSedesCache(catalogoSedes);

  renderTalleresSelector(getSelectedTallerIds());
  renderFormacionesSelector(getSelectedFormacionIds());
  renderMagisterSelector(getSelectedMagisterId());
}

async function recargarCatalogoTalleres() {
  const catalogoTalleres = await fetchCatalogoTalleres({ incluirInactivos: true });
  if (!catalogoTalleres) return;

  setCatalogoTalleresCache(catalogoTalleres);
  renderCatalogoTalleresTable(getCatalogoTalleresCache());
  renderTalleresSelector(getSelectedTallerIds());
}

async function recargarCatalogoFormaciones() {
  const catalogoFormaciones = await fetchCatalogoFormaciones({ incluirInactivos: true });
  if (!catalogoFormaciones) return;

  setCatalogoFormacionesCache(catalogoFormaciones);
  renderCatalogoFormacionesTable(getCatalogoFormacionesCache());
  renderFormacionesSelector(getSelectedFormacionIds());
}

async function recargarCatalogoMagister() {
  const catalogoMagister = await fetchCatalogoMagister({ incluirInactivos: true });
  if (!catalogoMagister) return;

  setCatalogoMagisterCache(catalogoMagister);
  renderCatalogoMagisterTable(getCatalogoMagisterCache());
  renderMagisterSelector(getSelectedMagisterId());
}

/* =========================================================
   PROFESORES
========================================================= */

function validarProfesorPayload(data) {
  if (!data.nombre?.trim()) {
    throw new Error('El nombre del profesor es obligatorio.');
  }

  if (!data.departamento?.trim()) {
    throw new Error('El departamento es obligatorio.');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('id_profesor')?.value;
  const data = getFormData();

  try {
    validarProfesorPayload(data);

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
    await recargarProfesores();
    await recargarCatalogosFormulario();
  } catch (error) {
    console.error('Error al guardar profesor:', error);
    showAppAlert(error.message || 'Error al guardar profesor.', 'error', {
      title: 'Error al guardar'
    });
  }
}

async function editarProfesor(id) {
  try {
    const profesor = await fetchProfesorById(id);
    if (!profesor) return;

    await recargarCatalogosFormulario();
    resetFormUI();
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
    await recargarProfesores();
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    showAppAlert(error.message || 'Error al eliminar profesor.', 'error', {
      title: 'Error al eliminar'
    });
  }
}

/* =========================================================
   CATÁLOGO TALLERES
========================================================= */

function getCatalogoTallerFormData() {
  return {
    nombre_taller: document.getElementById('catalogo_nombre_taller')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado')?.value || 'activo'
  };
}

async function handleCatalogoTallerSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_taller')?.value;
  const data = getCatalogoTallerFormData();

  try {
    if (!data.nombre_taller) {
      throw new Error('El nombre del taller es obligatorio.');
    }

    if (id) {
      await updateCatalogoTaller(id, data);
      showAppAlert('Taller actualizado correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    } else {
      await createCatalogoTaller(data);
      showAppAlert('Taller creado correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    }

    resetCatalogoForm();
    await recargarCatalogoTalleres();
  } catch (error) {
    console.error('Error al guardar taller:', error);
    showAppAlert(error.message || 'Error al guardar taller.', 'error', {
      title: 'Error en catálogo'
    });
  }
}

function editarCatalogoTaller(id) {
  const taller = getCatalogoTalleresCache().find((item) => Number(item.id_taller) === Number(id));
  if (!taller) return;

  fillCatalogoForm(taller);
  abrirModalCatalogo();
}

async function eliminarCatalogoTaller(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar taller',
    message: '¿Deseas eliminar este taller del catálogo?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });

  if (!confirmacion) return;

  try {
    await deleteCatalogoTaller(id);
    resetCatalogoForm();
    await recargarCatalogoTalleres();
    showAppAlert('Taller eliminado correctamente.', 'success', {
      title: 'Catálogo actualizado'
    });
  } catch (error) {
    console.error('Error al eliminar taller:', error);
    showAppAlert(error.message || 'Error al eliminar taller.', 'error', {
      title: 'Error en catálogo'
    });
  }
}

/* =========================================================
   CATÁLOGO FORMACIONES
========================================================= */

function getCatalogoFormacionFormData() {
  return {
    nombre_actividad: document.getElementById('catalogo_nombre_actividad')?.value?.trim() || '',
    tipo_formacion: document.getElementById('catalogo_tipo_formacion')?.value || 'VRA',
    institucion: document.getElementById('catalogo_institucion_formacion')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion_formacion')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_formacion')?.value || 'activo'
  };
}

async function handleCatalogoFormacionSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_formacion')?.value;
  const data = getCatalogoFormacionFormData();

  try {
    if (!data.nombre_actividad) {
      throw new Error('El nombre de la actividad es obligatorio.');
    }

    if (id) {
      await updateCatalogoFormacion(id, data);
      showAppAlert('Formación actualizada correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    } else {
      await createCatalogoFormacion(data);
      showAppAlert('Formación creada correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    }

    resetCatalogoFormacionForm();
    await recargarCatalogoFormaciones();
  } catch (error) {
    console.error('Error al guardar formación:', error);
    showAppAlert(error.message || 'Error al guardar formación.', 'error', {
      title: 'Error en catálogo'
    });
  }
}

function editarCatalogoFormacion(id) {
  const item = getCatalogoFormacionesCache().find(
    (row) => Number(row.id_catalogo_formacion) === Number(id)
  );
  if (!item) return;

  fillCatalogoFormacionForm(item);
  abrirModalCatalogoFormaciones();
}

async function eliminarCatalogoFormacion(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar formación',
    message: '¿Deseas eliminar esta formación del catálogo?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });

  if (!confirmacion) return;

  try {
    await deleteCatalogoFormacion(id);
    resetCatalogoFormacionForm();
    await recargarCatalogoFormaciones();
    showAppAlert('Formación eliminada correctamente.', 'success', {
      title: 'Catálogo actualizado'
    });
  } catch (error) {
    console.error('Error al eliminar formación:', error);
    showAppAlert(error.message || 'Error al eliminar formación.', 'error', {
      title: 'Error en catálogo'
    });
  }
}

/* =========================================================
   CATÁLOGO MAGÍSTER
========================================================= */

function getCatalogoMagisterFormData() {
  return {
    nombre_magister: document.getElementById('catalogo_nombre_magister')?.value?.trim() || '',
    institucion: document.getElementById('catalogo_institucion_magister')?.value?.trim() || '',
    area_estudio: document.getElementById('catalogo_area_estudio_magister')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion_magister')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_magister')?.value || 'activo'
  };
}

async function handleCatalogoMagisterSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_magister')?.value;
  const data = getCatalogoMagisterFormData();

  try {
    if (!data.nombre_magister) {
      throw new Error('El nombre del magíster es obligatorio.');
    }

    if (id) {
      await updateCatalogoMagister(id, data);
      showAppAlert('Magíster actualizado correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    } else {
      await createCatalogoMagister(data);
      showAppAlert('Magíster creado correctamente.', 'success', {
        title: 'Catálogo actualizado'
      });
    }

    resetCatalogoMagisterForm();
    await recargarCatalogoMagister();
  } catch (error) {
    console.error('Error al guardar magíster:', error);
    showAppAlert(error.message || 'Error al guardar magíster.', 'error', {
      title: 'Error en catálogo'
    });
  }
}

function editarCatalogoMagister(id) {
  const item = getCatalogoMagisterCache().find(
    (row) => Number(row.id_catalogo_magister) === Number(id)
  );
  if (!item) return;

  fillCatalogoMagisterForm(item);
  abrirModalCatalogoMagister();
}

async function eliminarCatalogoMagister(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar magíster',
    message: '¿Deseas eliminar este magíster del catálogo?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });

  if (!confirmacion) return;

  try {
    await deleteCatalogoMagister(id);
    resetCatalogoMagisterForm();
    await recargarCatalogoMagister();
    showAppAlert('Magíster eliminado correctamente.', 'success', {
      title: 'Catálogo actualizado'
    });
  } catch (error) {
    console.error('Error al eliminar magíster:', error);
    showAppAlert(error.message || 'Error al eliminar magíster.', 'error', {
      title: 'Error en catálogo'
    });
  }
}
/* =========================================================
   CSV HELPERS UI
========================================================= */

function resetImportUI() {
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');
  const input = document.getElementById('csv-file-input');

  if (input) input.value = '';
  if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
  if (importBtn) importBtn.disabled = true;

  clearImportSummary();
}

function updateSelectedCSVName(file) {
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');

  if (file) {
    if (fileName) fileName.textContent = file.name;
    if (importBtn) importBtn.disabled = false;
  } else {
    if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
    if (importBtn) importBtn.disabled = true;
  }
}

function setImportLoading(isLoading) {
  const importBtn = document.getElementById('import-csv-btn');

  if (!importBtn) return;

  importBtn.disabled = isLoading;
  importBtn.textContent = isLoading ? 'Importando...' : 'Importar CSV';
}

function clearImportSummary() {
  const container = document.getElementById('csv-import-summary');
  if (container) container.innerHTML = '';
}

function renderImportSummary(result) {
  const container = document.getElementById('csv-import-summary');
  if (!container) return;

  const errores = result?.detalle_errores || [];

  container.innerHTML = `
    <div class="csv-summary-card">
      <div class="csv-summary-grid">
        <div><strong>Insertados:</strong> ${result.insertados || 0}</div>
        <div><strong>Duplicados archivo:</strong> ${result.duplicados_archivo || 0}</div>
        <div><strong>Duplicados BD:</strong> ${result.duplicados_bd || 0}</div>
        <div><strong>Errores:</strong> ${errores.length}</div>
      </div>

      ${
        errores.length
          ? `
        <div class="csv-error-list-wrap">
          <h4>Errores</h4>
          <div class="csv-error-list">
            ${errores
              .map(e => `<div class="csv-error-item">${e}</div>`)
              .join('')}
          </div>
        </div>
      `
          : `<div class="csv-success-note">Carga completada sin errores.</div>`
      }
    </div>
  `;
}
/* =========================================================
   EXPOSICIÓN GLOBAL PARA BOTONES INLINE
========================================================= */

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.cerrarModal = cerrarModal;

window.editarCatalogoTaller = editarCatalogoTaller;
window.eliminarCatalogoTaller = eliminarCatalogoTaller;

window.editarCatalogoFormacion = editarCatalogoFormacion;
window.eliminarCatalogoFormacion = eliminarCatalogoFormacion;

window.editarCatalogoMagister = editarCatalogoMagister;
window.eliminarCatalogoMagister = eliminarCatalogoMagister;