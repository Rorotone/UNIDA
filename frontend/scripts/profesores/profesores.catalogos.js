/* Refactor exacto basado en profesores(8).js */
import {
  fetchCatalogoTalleres,
  createCatalogoTaller,
  updateCatalogoTaller,
  deleteCatalogoTaller,
  fetchCatalogoFormaciones,
  createCatalogoFormacion,
  updateCatalogoFormacion,
  deleteCatalogoFormacion,
  fetchCatalogoMagister,
  createCatalogoMagister,
  updateCatalogoMagister,
  deleteCatalogoMagister,
  fetchCatalogoSedes
} from './profesores.api.js';

import {
  setCatalogoTalleresCache,
  getCatalogoTalleresCache,
  setCatalogoFormacionesCache,
  getCatalogoFormacionesCache,
  setCatalogoMagisterCache,
  getCatalogoMagisterCache,
  setCatalogoSedesCache
} from './profesores.state.js';

import {
  renderCatalogoTalleresTable,
  renderCatalogoFormacionesTable,
  renderCatalogoMagisterTable,
  renderTalleresSelector,
  renderFormacionesSelector,
  renderMagisterSelector,
  getSelectedTallerIds,
  getSelectedFormacionIds,
  getSelectedMagisterId,
  resetCatalogoForm,
  fillCatalogoForm,
  resetCatalogoFormacionForm,
  fillCatalogoFormacionForm,
  resetCatalogoMagisterForm,
  fillCatalogoMagisterForm,
  abrirModalCatalogo,
  abrirModalCatalogoFormaciones,
  abrirModalCatalogoMagister
} from './profesores.ui.js';

export function bindCatalogoEvents() {
  document.getElementById('catalogo-taller-form')?.addEventListener('submit', handleCatalogoTallerSubmit);
  document.getElementById('catalogo-reset-btn')?.addEventListener('click', resetCatalogoForm);

  document.getElementById('catalogo-formacion-form')?.addEventListener('submit', handleCatalogoFormacionSubmit);
  document.getElementById('catalogo-formacion-reset-btn')?.addEventListener('click', resetCatalogoFormacionForm);

  document.getElementById('catalogo-magister-form')?.addEventListener('submit', handleCatalogoMagisterSubmit);
  document.getElementById('catalogo-magister-reset-btn')?.addEventListener('click', resetCatalogoMagisterForm);
}

export async function recargarCatalogosFormulario() {
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

export async function recargarCatalogoMagister() {
  const catalogoMagister = await fetchCatalogoMagister({ incluirInactivos: true });
  if (!catalogoMagister) return;

  setCatalogoMagisterCache(catalogoMagister);
  renderCatalogoMagisterTable(getCatalogoMagisterCache());
  renderMagisterSelector(getSelectedMagisterId());
}

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

export function editarCatalogoFormacion(id) {
  const item = getCatalogoFormacionesCache().find(
    (row) => Number(row.id_catalogo_formacion) === Number(id)
  );
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

export function getCatalogoMagisterFormData() {
  return {
    nombre_magister: document.getElementById('catalogo_nombre_magister')?.value?.trim() || '',
    institucion: document.getElementById('catalogo_institucion_magister')?.value?.trim() || '',
    area_estudio: document.getElementById('catalogo_area_estudio_magister')?.value?.trim() || '',
    descripcion: document.getElementById('catalogo_descripcion_magister')?.value?.trim() || '',
    estado: document.getElementById('catalogo_estado_magister')?.value || 'activo'
  };
}

export async function handleCatalogoMagisterSubmit(event) {
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

export function editarCatalogoMagister(id) {
  const item = getCatalogoMagisterCache().find(
    (row) => Number(row.id_catalogo_magister) === Number(id)
  );
  if (!item) return;

  fillCatalogoMagisterForm(item);
  abrirModalCatalogoMagister();
}

export async function eliminarCatalogoMagister(id) {
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
   EXPOSICIÓN GLOBAL PARA BOTONES INLINE
========================================================= */

window.editarCatalogoTaller = editarCatalogoTaller;
window.eliminarCatalogoTaller = eliminarCatalogoTaller;

window.editarCatalogoFormacion = editarCatalogoFormacion;
window.eliminarCatalogoFormacion = eliminarCatalogoFormacion;

window.editarCatalogoMagister = editarCatalogoMagister;
window.eliminarCatalogoMagister = eliminarCatalogoMagister;
