document.addEventListener('DOMContentLoaded', () => {
  initProfesores();
});

let sedesSearchTimer = null;

async function initProfesores() {
  bindModalEvents();
  bindFilterEvents();
  bindFormSubmit();
  bindCSVImportEvents();
  bindCatalogoEvents();
  bindProfesorTabs();
  bindSedesFieldEvents();
  await cargarDatosBase();
}

function bindModalEvents() {
  const modal = document.getElementById('modal-profesor');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtn = document.getElementById('close-modal');
  const openCatalogBtn = document.getElementById('open-catalogo-modal-btn');
  const openCatalogSecondaryBtn = document.getElementById('open-catalogo-modal-secondary-btn');
  const closeCatalogBtn = document.getElementById('close-catalogo-modal');

  openBtn?.addEventListener('click', () => {
    resetFormUI();
    abrirModal();
  });

  openCatalogBtn?.addEventListener('click', abrirModalCatalogo);
  openCatalogSecondaryBtn?.addEventListener('click', abrirModalCatalogo);
  closeBtn?.addEventListener('click', cerrarModal);
  closeCatalogBtn?.addEventListener('click', cerrarModalCatalogo);

  window.addEventListener('click', (event) => {
    if (event.target === modal) cerrarModal();
    if (event.target?.id === 'modal-catalogo-talleres') cerrarModalCatalogo();

    const suggestions = document.getElementById('sedes-suggestions');
    const searchWrap = document.querySelector('.sedes-search-wrap');
    if (suggestions && searchWrap && !searchWrap.contains(event.target)) {
      hideSedesSuggestions();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cerrarModal();
      cerrarModalCatalogo();
    }
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
  document.getElementById('add-formacion-btn')?.addEventListener('click', () => addFormacionDocenteItem());
}

function bindCatalogoEvents() {
  document.getElementById('catalogo-taller-form')?.addEventListener('submit', handleCatalogoSubmit);
  document.getElementById('catalogo-reset-btn')?.addEventListener('click', resetCatalogoForm);
}

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
    }, 120);
  });

  searchInput?.addEventListener('focus', async () => {
    try {
      const sedes = await fetchCatalogoSedes(searchInput.value.trim());
      if (!sedes) return;
      setCatalogoSedesCache(sedes);
      const selectedIds = new Set(getSelectedSedeIds());
      renderSedesSuggestions(sedes.filter((sede) => !selectedIds.has(Number(sede.id_sede))));
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

async function cargarDatosBase() {
  try {
    const [profesores, catalogoTalleres, catalogoSedes] = await Promise.all([
      fetchProfesores(),
      fetchCatalogoTalleres(),
      fetchCatalogoSedes()
    ]);

    if (!profesores || !catalogoTalleres || !catalogoSedes) return;

    setProfesoresCache(profesores);
    setCatalogoTalleresCache(catalogoTalleres);
    setCatalogoSedesCache(catalogoSedes);

    renderRows(getProfesoresCache());
    renderFiltros();
    renderCatalogoTalleresTable(getCatalogoTalleresCache());
    renderTalleresSelector([]);
    setSelectedSedes([]);
    ensureAtLeastOneFormacionItem();
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

async function recargarCatalogo() {
  const [catalogoTalleres, catalogoSedes] = await Promise.all([
    fetchCatalogoTalleres(),
    fetchCatalogoSedes()
  ]);

  if (!catalogoTalleres || !catalogoSedes) return;

  setCatalogoTalleresCache(catalogoTalleres);
  setCatalogoSedesCache(catalogoSedes);
  renderCatalogoTalleresTable(getCatalogoTalleresCache());
  renderTalleresSelector(getSelectedTallerIds());
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
    await recargarProfesores();
    await recargarCatalogo();
  } catch (error) {
    console.error('Error al guardar profesor:', error);
    showAppAlert(error.message || 'Error al guardar profesor.', 'error', {
      title: 'Error al guardar'
    });
  }
}

async function handleCatalogoSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_taller')?.value;
  const data = getCatalogoFormData();

  try {
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
    await recargarCatalogo();
  } catch (error) {
    console.error('Error al guardar taller:', error);
    showAppAlert(error.message || 'Error al guardar taller.', 'error', {
      title: 'Error en catálogo'
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

async function editarProfesor(id) {
  try {
    const profesor = await fetchProfesorById(id);
    if (!profesor) return;

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
    await recargarCatalogo();
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

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.cerrarModal = cerrarModal;
window.editarCatalogoTaller = editarCatalogoTaller;
window.eliminarCatalogoTaller = eliminarCatalogoTaller;
