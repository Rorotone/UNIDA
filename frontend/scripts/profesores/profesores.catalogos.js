import {
  fetchCatalogoTalleres,
  createCatalogoTaller,
  updateCatalogoTaller,
  deleteCatalogoTaller,
  fetchCatalogoFormaciones,
  createCatalogoFormacion,
  updateCatalogoFormacion,
  deleteCatalogoFormacion,
  fetchCatalogoPostgrados,
  createCatalogoPostgrado,
  updateCatalogoPostgrado,
  deleteCatalogoPostgrado,
  fetchCatalogoSedes,
  createCatalogoSede,
  updateCatalogoSede,
  deleteCatalogoSede
} from './profesores.api.js';

import {
  setCatalogoTalleresCache,
  getCatalogoTalleresCache,
  setCatalogoFormacionesCache,
  getCatalogoFormacionesCache,
  setCatalogoPostgradoCache,
  getCatalogoPostgradoCache,
  setCatalogoSedesCache,
  getCatalogoSedesCache
} from './profesores.state.js';

import {
  renderCatalogoTalleresTable,
  renderCatalogoFormacionesTable,
  renderCatalogoPostgradoTable,
  renderCatalogoSedesTable,
  renderTalleresSelector,
  renderFormacionesSelector,
  renderPostgradosSelector,
  getSelectedPostgradoIds,
  getSelectedTallerIds,
  getSelectedFormacionIds,
  resetCatalogoForm,
  fillCatalogoForm,
  resetCatalogoFormacionForm,
  fillCatalogoFormacionForm,
  resetCatalogoPostgradoForm,
  fillCatalogoPostgradoForm,
  resetCatalogoSedeForm,
  fillCatalogoSedeForm,
  abrirModalCatalogo,
  abrirModalCatalogoFormaciones,
  abrirModalCatalogoPostgrados
} from './profesores.ui.js';

/* =========================================================
   ESTADO INTERNO DE SEDES SELECCIONADAS
   (Migrado desde profesores.sedes.js)
========================================================= */

let selectedSedesCache = [];
let sedesSearchTimer = null;

function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function setSelectedSedes(data) {
  const normalized = Array.isArray(data) ? data : [];
  const unique = new Map();

  normalized.forEach((item) => {
    const id = Number(item?.id_sede ?? item?.id ?? item);
    if (!Number.isInteger(id) || id <= 0) return;

    unique.set(id, {
      id_sede: id,
      nombre_sede: item?.nombre_sede ?? item?.label ?? String(id),
      codigo_sede: item?.codigo_sede ?? null,
      ciudad: item?.ciudad ?? null,
      tipo_sede: item?.tipo_sede ?? 'docencia',
      modalidad: item?.modalidad ?? item?.modalidad_clases ?? '',
      flexibilidad_horaria: item?.flexibilidad_horaria ?? ''
    });
  });

  selectedSedesCache = Array.from(unique.values());
  renderSelectedSedes();
}

export function getSelectedSedes() {
  return selectedSedesCache;
}

export function getSelectedSedeIds() {
  return selectedSedesCache.map((item) => Number(item.id_sede ?? item.id));
}

export function updateSelectedSedeField(idSede, field, value) {
  selectedSedesCache = selectedSedesCache.map((item) => {
    if (Number(item.id_sede ?? item.id) !== Number(idSede)) return item;
    return { ...item, [field]: String(value ?? '').trim() };
  });
  renderSelectedSedes();
}

export function renderSelectedSedes() {
  const container = document.getElementById('sedes-selected');
  if (!container) return;

  if (!selectedSedesCache.length) {
    container.innerHTML = `<span class="inline-note">No hay sedes seleccionadas.</span>`;
    return;
  }

  container.innerHTML = selectedSedesCache.map((sede) => {
    const idSede = sede.id_sede ?? sede.id;
    return `
    <div class="sede-card">
      <div class="sede-card-header">
        <strong>${escapeHTML(sede.nombre_sede)}</strong>
        <button type="button" class="sede-chip-remove" data-id="${idSede}" aria-label="Quitar sede">&times;</button>
      </div>
      <div class="sede-card-grid">
        <label>
          Modalidad
          <select data-action="sede-field" data-field="modalidad" data-id="${idSede}">
            <option value="">Seleccionar modalidad</option>
            <option value="presencial" ${sede.modalidad === 'presencial' ? 'selected' : ''}>Presencial</option>
            <option value="online" ${sede.modalidad === 'online' ? 'selected' : ''}>Online</option>
            <option value="hibrida" ${sede.modalidad === 'hibrida' ? 'selected' : ''}>Híbrida</option>
          </select>
        </label>
        <label>
          Flexibilidad horaria
          <input
            type="text"
            data-action="sede-field"
            data-field="flexibilidad_horaria"
            data-id="${idSede}"
            value="${escapeHTML(sede.flexibilidad_horaria)}"
            placeholder="Ej. alta, franjas AM/PM"
          >
        </label>
      </div>
    </div>
  `}).join('');
}

export function hideSedesSuggestions() {
  const container = document.getElementById('sedes-suggestions');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

export function clearSedesSearch() {
  const input = document.getElementById('sedes-search-input');
  if (input) input.value = '';
  hideSedesSuggestions();
}

function addSelectedSede(sede) {
  const idSede = Number(sede?.id_sede ?? sede?.id);
  if (!Number.isInteger(idSede) || idSede <= 0) return;
  if (selectedSedesCache.some((item) => Number(item.id_sede ?? item.id) === idSede)) return;

  selectedSedesCache.push({
    id_sede: idSede,
    nombre_sede: sede.nombre_sede,
    codigo_sede: sede.codigo_sede ?? null,
    ciudad: sede.ciudad ?? null,
    tipo_sede: sede.tipo_sede ?? 'docencia',
    modalidad: sede.modalidad ?? sede.modalidad_clases ?? '',
    flexibilidad_horaria: sede.flexibilidad_horaria ?? ''
  });

  renderSelectedSedes();
  clearSedesSearch();
  document.getElementById('sedes-search-input')?.focus();
}

function removeSelectedSede(idSede) {
  selectedSedesCache = selectedSedesCache.filter((item) => Number(item.id_sede ?? item.id) !== Number(idSede));
  renderSelectedSedes();
}

function renderSedesSuggestions(items) {
  const container = document.getElementById('sedes-suggestions');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="sedes-suggestion-empty">No hay coincidencias.</div>`;
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = items.map((sede) => {
    const idSede = sede.id_sede ?? sede.id;
    return `
    <button type="button" class="sede-suggestion-item" data-id="${idSede}">
      <strong>${escapeHTML(sede.nombre_sede)}</strong>
      <small>${escapeHTML([sede.ciudad, sede.codigo_sede].filter(Boolean).join(' · ') || 'Sede activa')}</small>
    </button>
  `}).join('');

  container.classList.remove('hidden');
}

// Cache local de sedes disponibles para el buscador (siempre fresco desde API)
let sedesDisponiblesLocal = [];

export function bindSedesFieldEvents() {
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

        // Actualizar ambos caches
        setCatalogoSedesCache(sedes);
        sedesDisponiblesLocal = sedes;

        const selectedIds = new Set(getSelectedSedeIds());
        // Unir resultados de búsqueda con cache local para mayor tolerancia a inconsistencias
        const mergedMap = new Map();
        (sedes || []).forEach(s => mergedMap.set(Number(s.id_sede ?? s.id), s));
        (getCatalogoSedesCache() || []).forEach(s => mergedMap.set(Number(s.id_sede ?? s.id), s));
        const merged = Array.from(mergedMap.values());
        renderSedesSuggestions(merged.filter((s) => !selectedIds.has(Number(s.id_sede ?? s.id))));
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

      // Actualizar ambos caches
      setCatalogoSedesCache(sedes);
      sedesDisponiblesLocal = sedes;

      const selectedIds = new Set(getSelectedSedeIds());
      const mergedMap = new Map();
      (sedes || []).forEach(s => mergedMap.set(Number(s.id_sede ?? s.id), s));
      (getCatalogoSedesCache() || []).forEach(s => mergedMap.set(Number(s.id_sede ?? s.id), s));
      const merged = Array.from(mergedMap.values());
      renderSedesSuggestions(merged.filter((s) => !selectedIds.has(Number(s.id_sede ?? s.id))));
    } catch (error) {
      console.error('Error al cargar sugerencias de sedes:', error);
      renderSedesSuggestions([]);
    }
  });

  function seleccionarSede(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.target.closest('.sede-suggestion-item');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (!id) return;

    // Buscar en ambos caches (compatibilidad con id_sede o id)
    const sede =
      sedesDisponiblesLocal.find((s) => Number(s.id_sede ?? s.id) === id) ||
      getCatalogoSedesCache().find((s) => Number(s.id_sede ?? s.id) === id);

    if (!sede) {
      console.warn('Sede no encontrada en cache, id:', id, sedesDisponiblesLocal);
      return;
    }

    addSelectedSede(sede);
  }

  // mousedown captura antes del blur del input
  suggestions?.addEventListener('mousedown', seleccionarSede);
  // click como fallback para touch y comportamientos distintos por navegador
  suggestions?.addEventListener('click', seleccionarSede);

  selectedContainer?.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.sede-chip-remove');
    if (!removeBtn) return;
    removeSelectedSede(Number(removeBtn.dataset.id));
  });

  selectedContainer?.addEventListener('change', (event) => {
    const target = event.target;
    if (!target?.dataset?.action || target.dataset.action !== 'sede-field') return;

    const id = Number(target.dataset.id);
    const field = target.dataset.field;
    if (!Number.isInteger(id) || !field) return;

    updateSelectedSedeField(id, field, target.value?.trim?.() ?? '');
  });
}

/* =========================================================
   RECARGA DE CATÁLOGOS
========================================================= */

export function bindCatalogoEvents() {
  document.getElementById('catalogo-taller-form')?.addEventListener('submit', handleCatalogoTallerSubmit);
  document.getElementById('catalogo-reset-btn')?.addEventListener('click', resetCatalogoForm);

  document.getElementById('catalogo-formacion-form')?.addEventListener('submit', handleCatalogoFormacionSubmit);
  document.getElementById('catalogo-formacion-reset-btn')?.addEventListener('click', resetCatalogoFormacionForm);

  document.getElementById('catalogo-postgrado-form')?.addEventListener('submit', handleCatalogoPostgradoSubmit);
  document.getElementById('catalogo-postgrado-reset-btn')?.addEventListener('click', resetCatalogoPostgradoForm);

  document.getElementById('catalogo-sede-form')?.addEventListener('submit', handleCatalogoSedeSubmit);
  document.getElementById('catalogo-sede-reset-btn')?.addEventListener('click', resetCatalogoSedeForm);
}

export async function recargarCatalogosFormulario() {
  const [
    catalogoTalleres,
    catalogoFormaciones,
    catalogoPostgrados,
    catalogoSedes
  ] = await Promise.all([
    fetchCatalogoTalleres(),
    fetchCatalogoFormaciones(),
    fetchCatalogoPostgrados(),
    fetchCatalogoSedes()
  ]);

  if (!catalogoTalleres || !catalogoFormaciones || !catalogoPostgrados || !catalogoSedes) return;

  setCatalogoTalleresCache(catalogoTalleres);
  setCatalogoFormacionesCache(catalogoFormaciones);
  setCatalogoPostgradoCache(catalogoPostgrados);
  setCatalogoSedesCache(catalogoSedes);
  sedesDisponiblesLocal = catalogoSedes;

  renderCatalogoTalleresTable(getCatalogoTalleresCache());
  renderCatalogoFormacionesTable(getCatalogoFormacionesCache());
  renderCatalogoPostgradoTable(getCatalogoPostgradoCache());
  renderCatalogoSedesTable(getCatalogoSedesCache());

  renderTalleresSelector(getSelectedTallerIds());
  renderFormacionesSelector(getSelectedFormacionIds());
  renderPostgradosSelector(getSelectedPostgradoIds());
}

export async function recargarCatalogoTalleres() {
  const catalogoTalleres = await fetchCatalogoTalleres({ incluirInactivos: true });
  if (!catalogoTalleres) return;

  setCatalogoTalleresCache(catalogoTalleres);
  renderCatalogoTalleresTable(getCatalogoTalleresCache());
  renderTalleresSelector(getSelectedTallerIds());
}

export async function recargarCatalogoFormaciones() {
  const catalogoFormaciones = await fetchCatalogoFormaciones({ incluirInactivos: true });
  if (!catalogoFormaciones) return;

  setCatalogoFormacionesCache(catalogoFormaciones);
  renderCatalogoFormacionesTable(getCatalogoFormacionesCache());
  renderFormacionesSelector(getSelectedFormacionIds());
}

export async function recargarCatalogoPostgrados() {
  const catalogoPostgrados = await fetchCatalogoPostgrados({ incluirInactivos: true });
  if (!catalogoPostgrados) return;

  setCatalogoPostgradoCache(catalogoPostgrados);
  renderCatalogoPostgradoTable(getCatalogoPostgradoCache());
  renderPostgradosSelector(getSelectedPostgradoIds());
}

export async function recargarCatalogoSedes() {
  const catalogoSedes = await fetchCatalogoSedes();
  if (!catalogoSedes) return;

  // Actualizar ambos caches para que el buscador y la tabla estén sincronizados
  setCatalogoSedesCache(catalogoSedes);
  sedesDisponiblesLocal = catalogoSedes;
  renderCatalogoSedesTable(getCatalogoSedesCache());
}

/* =========================================================
   TALLERES
========================================================= */

export function getCatalogoTallerFormData() {
  return {
    nombre_taller: document.getElementById('catalogo_nombre_taller')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado')?.value || 'activo'
  };
}

export async function handleCatalogoTallerSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_taller')?.value;
  const data = getCatalogoTallerFormData();

  try {
    if (!data.nombre_taller) throw new Error('El nombre del taller es obligatorio.');

    if (id) {
      await updateCatalogoTaller(id, data);
      showAppAlert('Taller actualizado correctamente.', 'success', { title: 'Catálogo actualizado' });
    } else {
      await createCatalogoTaller(data);
      showAppAlert('Taller creado correctamente.', 'success', { title: 'Catálogo actualizado' });
    }

    resetCatalogoForm();
    await recargarCatalogoTalleres();
  } catch (error) {
    console.error('Error al guardar taller:', error);
    showAppAlert(error.message || 'Error al guardar taller.', 'error', { title: 'Error en catálogo' });
  }
}

export function editarCatalogoTaller(id) {
  const taller = getCatalogoTalleresCache().find((item) => Number(item.id_taller) === Number(id));
  if (!taller) return;
  fillCatalogoForm(taller);
  abrirModalCatalogo();
}

export async function eliminarCatalogoTaller(id) {
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
    showAppAlert('Taller eliminado correctamente.', 'success', { title: 'Catálogo actualizado' });
  } catch (error) {
    console.error('Error al eliminar taller:', error);
    showAppAlert(error.message || 'Error al eliminar taller.', 'error', { title: 'Error en catálogo' });
  }
}

/* =========================================================
   FORMACIONES
========================================================= */

export function getCatalogoFormacionFormData() {
  return {
    nombre_actividad: document.getElementById('catalogo_nombre_actividad')?.value?.trim() || '',
    tipo_formacion: document.getElementById('catalogo_tipo_formacion')?.value || 'VRA',
    institucion: document.getElementById('catalogo_institucion_formacion')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion_formacion')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_formacion')?.value || 'activo'
  };
}

export async function handleCatalogoFormacionSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_formacion')?.value;
  const data = getCatalogoFormacionFormData();

  try {
    if (!data.nombre_actividad) throw new Error('El nombre de la actividad es obligatorio.');

    if (id) {
      await updateCatalogoFormacion(id, data);
      showAppAlert('Formación actualizada correctamente.', 'success', { title: 'Catálogo actualizado' });
    } else {
      await createCatalogoFormacion(data);
      showAppAlert('Formación creada correctamente.', 'success', { title: 'Catálogo actualizado' });
    }

    resetCatalogoFormacionForm();
    await recargarCatalogoFormaciones();
  } catch (error) {
    console.error('Error al guardar formación:', error);
    showAppAlert(error.message || 'Error al guardar formación.', 'error', { title: 'Error en catálogo' });
  }
}

export function editarCatalogoFormacion(id) {
  const item = getCatalogoFormacionesCache().find((row) => Number(row.id_catalogo_formacion) === Number(id));
  if (!item) return;
  fillCatalogoFormacionForm(item);
  abrirModalCatalogoFormaciones();
}

export async function eliminarCatalogoFormacion(id) {
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
    showAppAlert('Formación eliminada correctamente.', 'success', { title: 'Catálogo actualizado' });
  } catch (error) {
    console.error('Error al eliminar formación:', error);
    showAppAlert(error.message || 'Error al eliminar formación.', 'error', { title: 'Error en catálogo' });
  }
}

/* =========================================================
   POSTGRADOS
========================================================= */

export function getCatalogoPostgradoFormData() {
  return {
    tipo_postgrado: document.getElementById('catalogo_tipo_postgrado')?.value || '',
    nombre_postgrado: document.getElementById('catalogo_nombre_postgrado')?.value?.trim() || '',
    institucion: document.getElementById('catalogo_institucion_postgrado')?.value?.trim() || '',
    area_estudio: document.getElementById('catalogo_area_estudio_postgrado')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion_postgrado')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_postgrado')?.value || 'activo',
    observaciones: document.getElementById('catalogo_observaciones_postgrado')?.value?.trim() || ''
  };
}

export async function handleCatalogoPostgradoSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_postgrado')?.value;
  const data = getCatalogoPostgradoFormData();

  try {
    if (!data.nombre_postgrado) throw new Error('El nombre del postgrado es obligatorio.');

    if (id) {
      await updateCatalogoPostgrado(id, data);
      showAppAlert('Postgrado actualizado correctamente.', 'success', { title: 'Catálogo actualizado' });
    } else {
      await createCatalogoPostgrado(data);
      showAppAlert('Postgrado creado correctamente.', 'success', { title: 'Catálogo actualizado' });
    }

    resetCatalogoPostgradoForm();
    await recargarCatalogoPostgrados();
  } catch (error) {
    console.error('Error al guardar postgrado:', error);
    showAppAlert(error.message || 'Error al guardar postgrado.', 'error', { title: 'Error en catálogo' });
  }
}

export function editarCatalogoPostgrado(id) {
  const item = getCatalogoPostgradoCache().find((row) => Number(row.id_catalogo_postgrado) === Number(id));
  if (!item) return;
  fillCatalogoPostgradoForm(item);
  abrirModalCatalogoPostgrados();
}

export async function eliminarCatalogoPostgrado(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar postgrado',
    message: '¿Deseas eliminar este postgrado del catálogo?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });
  if (!confirmacion) return;

  try {
    await deleteCatalogoPostgrado(id);
    resetCatalogoPostgradoForm();
    await recargarCatalogoPostgrados();
    showAppAlert('Postgrado eliminado correctamente.', 'success', { title: 'Catálogo actualizado' });
  } catch (error) {
    console.error('Error al eliminar postgrado:', error);
    showAppAlert(error.message || 'Error al eliminar postgrado.', 'error', { title: 'Error en catálogo' });
  }
}

/* =========================================================
   SEDES
========================================================= */

export function getCatalogoSedeFormData() {
  return {
    nombre_sede: document.getElementById('catalogo_nombre_sede')?.value?.trim() || '',
    codigo_sede: document.getElementById('catalogo_codigo_sede')?.value?.trim() || '',
    ciudad: document.getElementById('catalogo_ciudad_sede')?.value?.trim() || '',
    direccion: document.getElementById('catalogo_direccion_sede')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_sede')?.value || 'activa'
  };
}

export async function handleCatalogoSedeSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('catalogo_id_sede')?.value;
  const data = getCatalogoSedeFormData();

  try {
    if (!data.nombre_sede) throw new Error('El nombre de la sede es obligatorio.');

    if (id) {
      await updateCatalogoSede(id, data);
      showAppAlert('Sede actualizada correctamente.', 'success', { title: 'Catálogo actualizado' });
    } else {
      await createCatalogoSede(data);
      showAppAlert('Sede creada correctamente.', 'success', { title: 'Catálogo actualizado' });
    }

    resetCatalogoSedeForm();
    await recargarCatalogoSedes();
  } catch (error) {
    console.error('Error al guardar sede:', error);
    showAppAlert(error.message || 'Error al guardar sede.', 'error', { title: 'Error en catálogo' });
  }
}

export function editarCatalogoSede(id) {
  const item = getCatalogoSedesCache().find((row) => Number(row.id_sede ?? row.id) === Number(id));
  if (!item) return;
  fillCatalogoSedeForm(item);
}

export async function eliminarCatalogoSede(id) {
  const confirmacion = await showAppConfirm({
    title: 'Eliminar sede',
    message: '¿Deseas eliminar esta sede del catálogo? Si está asociada a profesores, el backend bloqueará la eliminación.',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true
  });
  if (!confirmacion) return;

  try {
    await deleteCatalogoSede(id);
    resetCatalogoSedeForm();
    await recargarCatalogoSedes();
    showAppAlert('Sede eliminada correctamente.', 'success', { title: 'Catálogo actualizado' });
  } catch (error) {
    console.error('Error al eliminar sede:', error);
    showAppAlert(error.message || 'Error al eliminar sede.', 'error', { title: 'Error en catálogo' });
  }
}

/* =========================================================
   EXPOSICIÓN GLOBAL PARA BOTONES INLINE
========================================================= */

window.editarCatalogoTaller = editarCatalogoTaller;
window.eliminarCatalogoTaller = eliminarCatalogoTaller;

window.editarCatalogoFormacion = editarCatalogoFormacion;
window.eliminarCatalogoFormacion = eliminarCatalogoFormacion;

window.editarCatalogoPostgrado = editarCatalogoPostgrado;
window.eliminarCatalogoPostgrado = eliminarCatalogoPostgrado;

window.editarCatalogoSede = editarCatalogoSede;
window.eliminarCatalogoSede = eliminarCatalogoSede;