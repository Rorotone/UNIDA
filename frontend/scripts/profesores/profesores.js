import {
  fetchProfesores,
  fetchProfesorById,
  createProfesor,
  updateProfesor,
  deleteProfesor,
  fetchCatalogoTalleres,
  fetchCatalogoFormaciones,
  fetchCatalogoMagister,
  fetchCatalogoSedes
} from './profesores.api.js';

import {
  normalizeProfesor,
  setProfesoresCache,
  getProfesoresCache,
  setCatalogoTalleresCache,
  getCatalogoTalleresCache,
  setCatalogoFormacionesCache,
  getCatalogoFormacionesCache,
  setCatalogoMagisterCache,
  getCatalogoMagisterCache,
  setCatalogoSedesCache,
  getCatalogoSedesCache
} from './profesores.state.js';

import {
  renderRows,
  renderFiltros,
  applyFilters,
  toggleFiltros,
  resetFiltros,
  abrirModal,
  cerrarModal,
  abrirModalCatalogo,
  cerrarModalCatalogo,
  abrirModalCatalogoFormaciones,
  cerrarModalCatalogoFormaciones,
  abrirModalCatalogoMagister,
  cerrarModalCatalogoMagister,
  bindProfesorTabs,
  resetFormUI,
  fillForm,
  getFormData,
  renderCatalogoTalleresTable,
  renderCatalogoFormacionesTable,
  renderCatalogoMagisterTable,
  renderTalleresSelector,
  renderFormacionesSelector,
  renderMagisterSelector,
  updateSelectableCardState,
  initCatalogosModal,
  bindCatalogoSearch,
  renderCatalogoSedesTable
} from './profesores.ui.js';

import {
  setSelectedSedes,
  bindSedesFieldEvents,
  hideSedesSuggestions
} from './profesores.sedes.js';

import {
  bindCatalogoEvents,
  recargarCatalogosFormulario
} from './profesores.catalogos.js';

import { bindCSVImportEvents } from './profesores.csv.js';
import { validarProfesorPayload } from './profesores.validators.js';

document.addEventListener('DOMContentLoaded', () => {
  initProfesores();
});

export async function initProfesores() {
  bindModalEvents();
  bindFilterEvents();
  bindFormSubmit();
  bindCSVImportEvents(recargarProfesores);
  bindCatalogoEvents();
  bindProfesorTabs();
  bindSedesFieldEvents();
  bindSelectorCardEvents();
  initCatalogosModal();
  bindCatalogoSearch();
  await cargarDatosBase();
}

export function bindModalEvents() {
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

export function bindFilterEvents() {
  document.getElementById('search-nombre')?.addEventListener('input', applyFilters);
  document.getElementById('search-departamento')?.addEventListener('change', applyFilters);
  document.getElementById('search-sede')?.addEventListener('change', applyFilters);
  document.getElementById('search-btn')?.addEventListener('click', applyFilters);
  document.getElementById('reset-btn')?.addEventListener('click', resetFiltros);
  document.getElementById('toggle-filtros-btn')?.addEventListener('click', toggleFiltros);
}

export function bindFormSubmit() {
  document.getElementById('profesor-form')?.addEventListener('submit', handleFormSubmit);
}

export function bindSelectorCardEvents() {
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
}

export async function cargarDatosBase() {
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
    renderCatalogoSedesTable(getCatalogoSedesCache());

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

export async function recargarProfesores() {
  const profesores = await fetchProfesores();
  if (!profesores) return;

  setProfesoresCache(profesores);
  renderRows(getProfesoresCache());
  renderFiltros();
}

export async function handleFormSubmit(event) {
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

export async function editarProfesor(id) {
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

export async function eliminarProfesor(id) {
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
   EXPOSICIÓN GLOBAL PARA BOTONES INLINE
========================================================= */

window.editarProfesor = editarProfesor;
window.eliminarProfesor = eliminarProfesor;
window.cerrarModal = cerrarModal;