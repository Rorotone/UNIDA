import {
  getProfesoresCache,
  getCatalogoTalleresCache,
  getCatalogoFormacionesCache,
  getCatalogoSedesCache,
  getCatalogoPostgradoCache
} from './profesores.state.js';

import {
  setSelectedSedes,
  getSelectedSedes,
  getSelectedSedeIds,
  clearSedesSearch
} from './profesores.sedes.js';

export function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function getCheckedIds(selector) {
  return Array.from(
    document.querySelectorAll(`${selector} input[type="checkbox"]:checked`)
  )
    .map((checkbox) => Number(checkbox.value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export function getRadioSelectedId(selector) {
  const selected = document.querySelector(`${selector} input[type="checkbox"]:checked`);
  if (!selected) return null;

  const value = Number(selected.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function updateSelectableCardState(container) {
  if (!container) return;

  container.querySelectorAll('.taller-option').forEach((item) => {
    const input = item.querySelector('input');
    item.classList.toggle('is-selected', !!input?.checked);
  });
}

export function buildCatalogCard({
  inputType = 'checkbox',
  inputName = '',
  value,
  checked = false,
  title = '',
  subtitle = '',
  description = '',
  status = ''
}) {
  return `
    <label class="taller-option">
      <input
        type="${escapeHTML(inputType)}"
        ${inputName ? `name="${escapeHTML(inputName)}"` : ''}
        value="${escapeHTML(value)}"
        ${checked ? 'checked' : ''}
      >
      <div class="taller-option-main">
        <strong>${escapeHTML(title)}</strong>
        ${subtitle ? `<small>${escapeHTML(subtitle)}</small>` : ''}
        ${description ? `<small>${escapeHTML(description)}</small>` : ''}
        ${status ? `<small>Estado: ${escapeHTML(status)}</small>` : ''}
      </div>
    </label>
  `;
}

/* =========================================================
   SELECTORES DE CATÁLOGO
========================================================= */

export function getSelectedTallerIds() {
  return getCheckedIds('#talleres-selector');
}

export function initCatalogosModal() {
  const modal = document.getElementById('modal-catalogos-secondary');
  const closeBtn = document.getElementById('close-catalogos-secondary-modal');

  const openBtn = document.getElementById('open-catalogos-modal-secondary-btn');
  const openTalleresBtn = document.getElementById('open-catalogo-modal-btn');
  const openFormacionesBtn = document.getElementById('open-catalogo-formaciones-btn');
  const openPostgradoBtn = document.getElementById('open-catalogo-postgrado-btn');

  if (!modal || !closeBtn) return;

  const tabs = modal.querySelectorAll('.catalogos-secondary-tab');
  const panels = modal.querySelectorAll('.catalogos-secondary-panel');

  function activarTab(tabName) {
    tabs.forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.catalogoTab === tabName);
    });

    panels.forEach(panel => {
      panel.classList.toggle(
        'is-active',
        panel.dataset.catalogoPanel === tabName
      );
    });
  }

  function abrirCatalogosEn(tabName = 'talleres') {
    modal.classList.add('is-open');
    activarTab(tabName);
  }

  openBtn?.addEventListener('click', () => abrirCatalogosEn('talleres'));
  openTalleresBtn?.addEventListener('click', () => abrirCatalogosEn('talleres'));
  openFormacionesBtn?.addEventListener('click', () => abrirCatalogosEn('formaciones'));
  openPostgradoBtn?.addEventListener('click', () => abrirCatalogosEn('postgrados'));

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('is-open');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activarTab(tab.dataset.catalogoTab);
    });
  });
}

export function bindCatalogoSearch() {
  document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('catalogo-search-input')) return;

    const input = e.target;
    const tableBodyId = input.dataset.searchTable;
    const tbody = document.getElementById(tableBodyId);

    if (!tbody) return;

    const searchText = input.value.trim().toLowerCase();

    tbody.querySelectorAll('tr').forEach(row => {
      const match = row.textContent.toLowerCase().includes(searchText);
      row.style.display = match ? '' : 'none';
    });
  });
}

export function renderCatalogoSedesTable(data) {
  const tbody = document.getElementById('catalogo-sedes-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay sedes en el catálogo.</td>
      </tr>
    `;
    return;
  }

  data.forEach((sede) => {
    const tr = document.createElement('tr');
    const idSede = sede.id_sede ?? sede.id;

    tr.innerHTML = `
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(sede.nombre_sede)}</strong>
          <span class="inline-note">${escapeHTML(sede.direccion || 'Sin dirección')}</span>
        </div>
      </td>
      <td>${escapeHTML(sede.codigo_sede || '-')}</td>
      <td>${escapeHTML(sede.ciudad || '-')}</td>
      <td>
        <span class="summary-badge ${sede.estado === 'inactiva' ? 'summary-badge-muted' : ''}">
          ${escapeHTML(sede.estado || 'activa')}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn-secondary btn-sm" onclick="editarCatalogoSede(${Number(idSede)})">
            Editar
          </button>
          <button type="button" class="btn-danger btn-sm" onclick="eliminarCatalogoSede(${Number(idSede)})">
            Eliminar
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

export function renderTalleresSelector(selectedIds = []) {
  const container = document.getElementById('talleres-selector');
  if (!container) return;

  const catalogoTalleresCache = getCatalogoTalleresCache();
  const selectedSet = new Set((selectedIds || []).map((item) => Number(item)));

  const visibles = catalogoTalleresCache.filter(
    (item) => item.estado === 'activo' || selectedSet.has(Number(item.id_taller))
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay talleres activos en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles
    .map((taller) =>
      buildCatalogCard({
        inputType: 'checkbox',
        inputName: 'taller_ids',
        value: taller.id_taller,
        checked: selectedSet.has(Number(taller.id_taller)),
        title: taller.nombre_taller,
        description: taller.descripcion || 'Sin descripción',
        status: taller.estado || 'activo'
      })
    )
    .join('');

  updateSelectableCardState(container);
}

export function getSelectedFormacionIds() {
  return getCheckedIds('#formaciones-selector');
}

export function renderFormacionesSelector(selectedIds = []) {
  const container = document.getElementById('formaciones-selector');
  if (!container) return;

  const catalogoFormacionesCache = getCatalogoFormacionesCache();
  const selectedSet = new Set((selectedIds || []).map((item) => Number(item)));

  const visibles = catalogoFormacionesCache.filter(
    (item) =>
      item.estado === 'activo' || selectedSet.has(Number(item.id_catalogo_formacion))
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay formaciones activas en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles
    .map((formacion) =>
      buildCatalogCard({
        inputType: 'checkbox',
        inputName: 'formacion_ids',
        value: formacion.id_catalogo_formacion,
        checked: selectedSet.has(Number(formacion.id_catalogo_formacion)),
        title: formacion.nombre_actividad,
        subtitle: [
          formacion.tipo_formacion ? `Tipo: ${formacion.tipo_formacion}` : '',
          formacion.institucion ? `Institución: ${formacion.institucion}` : ''
        ]
          .filter(Boolean)
          .join(' · '),
        description: formacion.descripcion || 'Sin descripción',
        status: formacion.estado || 'activo'
      })
    )
    .join('');

  updateSelectableCardState(container);


}
export function getSelectedPostgradoIds() {
return getCheckedIds('#postgrados-selector');
}

export function renderPostgradosSelector(selectedIds = []) {
  const container = document.getElementById('postgrados-selector');
  if (!container) return;

  const cache = getCatalogoPostgradoCache();
  const selectedSet = new Set((selectedIds || []).map((id) => Number(id)));

  const visibles = cache.filter(
    (item) => item.estado === 'activo' || selectedSet.has(Number(item.id_catalogo_postgrado))
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay postgrados activos en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles
    .map((p) =>
      buildCatalogCard({
        inputType: 'checkbox',
        inputName: 'postgrado_ids',
        value: p.id_catalogo_postgrado,
        checked: selectedSet.has(Number(p.id_catalogo_postgrado)),
        title: p.nombre_postgrado,
        subtitle: [
          p.tipo_postgrado ? `Tipo: ${p.tipo_postgrado}` : '',
          p.institucion ? `Institución: ${p.institucion}` : ''
        ].filter(Boolean).join(' · '),
        description: p.descripcion || 'Sin descripción',
        status: p.estado || 'activo'
      })
    )
    .join('');

  updateSelectableCardState(container);
}

/* =========================================================
   POSTGRADOS UI
========================================================= */

let postgradosList = [];

export function initPostgradosUI() {
  const btnAgregar = document.getElementById('btn-agregar-postgrado');
  const btnCancelar = document.getElementById('btn-cancelar-postgrado');
  const btnGuardar = document.getElementById('btn-guardar-postgrado');

  btnAgregar?.addEventListener('click', () => abrirFormPostgrado());
  btnCancelar?.addEventListener('click', () => cerrarFormPostgrado());
  btnGuardar?.addEventListener('click', () => guardarPostgradoLocal());
}

function abrirFormPostgrado(index = null) {
  const wrapper = document.getElementById('postgrado-form-wrapper');
  if (!wrapper) return;

  if (index !== null && postgradosList[index]) {
    const p = postgradosList[index];
    document.getElementById('postgrado_edit_index').value = index;
    document.getElementById('postgrado_tipo').value = p.tipo_postgrado || '';
    document.getElementById('postgrado_nombre').value = p.nombre_postgrado || '';
    document.getElementById('postgrado_institucion').value = p.institucion || '';
    document.getElementById('postgrado_area').value = p.area_estudio || '';
    document.getElementById('postgrado_anio').value = p.anio_obtencion || '';
    document.getElementById('postgrado_modalidad').value = p.modalidad || '';
    document.getElementById('postgrado_estado').value = p.estado || 'finalizado';
    document.getElementById('postgrado_observaciones').value = p.observaciones || '';
  } else {
    limpiarFormPostgrado();
  }

  wrapper.style.display = 'block';
}

function cerrarFormPostgrado() {
  const wrapper = document.getElementById('postgrado-form-wrapper');
  if (wrapper) wrapper.style.display = 'none';
  limpiarFormPostgrado();
}

function limpiarFormPostgrado() {
  const ids = [
    'postgrado_edit_index', 'postgrado_tipo', 'postgrado_nombre',
    'postgrado_institucion', 'postgrado_area', 'postgrado_anio',
    'postgrado_modalidad', 'postgrado_observaciones'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const estado = document.getElementById('postgrado_estado');
  if (estado) estado.value = 'finalizado';
}

function guardarPostgradoLocal() {
  const tipo = document.getElementById('postgrado_tipo')?.value;
  const nombre = document.getElementById('postgrado_nombre')?.value?.trim();
  const institucion = document.getElementById('postgrado_institucion')?.value?.trim();
  const area = document.getElementById('postgrado_area')?.value?.trim();

  if (!tipo || !nombre || !institucion || !area) {
    alert('Tipo, nombre, institución y área son obligatorios.');
    return;
  }

  const postgrado = {
    tipo_postgrado: tipo,
    nombre_postgrado: nombre,
    institucion,
    area_estudio: area,
    anio_obtencion: document.getElementById('postgrado_anio')?.value || null,
    modalidad: document.getElementById('postgrado_modalidad')?.value || null,
    estado: document.getElementById('postgrado_estado')?.value || 'finalizado',
    observaciones: document.getElementById('postgrado_observaciones')?.value?.trim() || null,
  };

  const editIndex = document.getElementById('postgrado_edit_index')?.value;
  if (editIndex !== '') {
    postgradosList[Number(editIndex)] = postgrado;
  } else {
    postgradosList.push(postgrado);
  }

  cerrarFormPostgrado();
  renderPostgradosLista();
}

function renderPostgradosLista() {
  const lista = document.getElementById('postgrados-lista');
  if (!lista) return;

  if (postgradosList.length === 0) {
    lista.innerHTML = '<p class="inline-note" style="padding:0.5rem 0">Sin postgrados registrados.</p>';
    return;
  }

  lista.innerHTML = postgradosList.map((p, i) => `
    <div class="postgrado-item">
      <div class="postgrado-item-info">
        <span class="postgrado-item-title">${escapeHTML(p.nombre_postgrado)} <small>(${escapeHTML(p.tipo_postgrado)})</small></span>
        <span class="postgrado-item-sub">
          ${escapeHTML(p.institucion)}${p.area_estudio ? ' · ' + escapeHTML(p.area_estudio) : ''}${p.anio_obtencion ? ' · ' + escapeHTML(String(p.anio_obtencion)) : ''} · ${escapeHTML(p.estado)}
        </span>
      </div>
      <div class="postgrado-item-actions">
        <button type="button" class="btn-icon" onclick="editarPostgrado(${i})">✏️</button>
        <button type="button" class="btn-icon btn-danger" onclick="eliminarPostgrado(${i})">🗑️</button>
      </div>
    </div>
  `).join('');
}

window.editarPostgrado = (i) => abrirFormPostgrado(i);
window.eliminarPostgrado = (i) => {
  postgradosList.splice(i, 1);
  renderPostgradosLista();
};

export function setPostgradosList(postgrados = []) {
  postgradosList = postgrados.map(p => ({ ...p }));
  renderPostgradosLista();
}

export function getPostgradosList() {
  return [...postgradosList];
}

export function resetPostgradosUI() {
  postgradosList = [];
  cerrarFormPostgrado();
  renderPostgradosLista();
}

/* =========================================================
   TABLA PRINCIPAL
========================================================= */

function buildFormacionCell(p) {
  const talleres = Number(p.cantidad_talleres ?? 0);
  const formaciones = Number(p.cantidad_formaciones ?? 0);
  const postgrados = Number(p.cantidad_postgrados ?? 0);
  const total = talleres + formaciones + postgrados;

  if (total === 0) {
    return '<span class="text-muted">Sin registro</span>';
  }

  return (
    '<div class="summary-stack">' +
      '<span class="inline-note">' +
        'Talleres: ' + talleres + ' · ' +
        'Formaciones: ' + formaciones + ' · ' +
        'Postgrados: ' + postgrados +
      '</span>' +
      '<button type="button" class="btn-detalle-formacion" onclick="verDetalleFormacion(' + p.id_profesor + ')" title="Ver formación docente">' +
        '&#x24D8;' +
      '</button>' +
    '</div>'
  );
}

export function renderRows(data) {
  const tbody = document.getElementById('profesores-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay profesores para mostrar.</td>
      </tr>
    `;
    return;
  }

  data.forEach((p) => {
    const tr = document.createElement('tr');

    const nombres = p.sedes_resumen ? p.sedes_resumen.split(', ').map(s => s.trim()).filter(Boolean) : [];
    const modalidades = p.sedes_modalidad ? p.sedes_modalidad.split(', ').map(s => s.trim()) : [];

    const sedeHTML = nombres.length > 0
      ? nombres.map((nombre, i) => {
          const modalidad = (modalidades[i] || '').toLowerCase();
          const badgeClass = modalidad === 'presencial'
            ? 'modalidad-badge modalidad-presencial'
            : modalidad === 'híbrido' || modalidad === 'hibrido'
              ? 'modalidad-badge modalidad-hibrido'
              : modalidad === 'online' || modalidad === 'virtual'
                ? 'modalidad-badge modalidad-online'
                : 'modalidad-badge modalidad-otro';
          return `<div class="sede-row">
            <span class="sede-nombre">${escapeHTML(nombre)}</span>
            <span class="${badgeClass}">${escapeHTML(modalidades[i] || 'N/A')}</span>
          </div>`;
        }).join('')
      : `<span class="text-muted">Sin sede</span>`;

    tr.innerHTML = `
      <td>${escapeHTML(p.nombre)}</td>
      <td>${escapeHTML(p.departamento)}</td>
      <td><div class="sedes-cell">${sedeHTML}</div></td>
      <td>${buildFormacionCell(p)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-secondary btn-sm" onclick="editarProfesor(${p.id_profesor})">Editar</button>
          <button class="btn-danger btn-sm" onclick="eliminarProfesor(${p.id_profesor})">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================================================
   FILTROS
========================================================= */

export function uniqueValues(arr, key) {
  return [
    ...new Set(
      arr
        .map((item) => String(item?.[key] ?? '').trim())
        .filter(Boolean)
    )
  ].sort();
}

export function populateSelect(selectEl, values) {
  if (!selectEl) return;

  selectEl.innerHTML =
    `<option value="">Todos</option>` +
    values.map((v) => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
}

export function renderFiltros() {
  const profesoresCache = getProfesoresCache();

  populateSelect(
    document.getElementById('search-departamento'),
    uniqueValues(profesoresCache, 'departamento')
  );

  populateSelect(
    document.getElementById('search-sede'),
    uniqueValues(profesoresCache, 'sedes_resumen')
  );
}

export function applyFilters() {
  const profesoresCache = getProfesoresCache();

  const qNombre = document.getElementById('search-nombre')?.value.toLowerCase() || '';
  const depto = document.getElementById('search-departamento')?.value || '';
  const sede = document.getElementById('search-sede')?.value || '';

  const filtrados = profesoresCache.filter((p) => {
    const byNombre = !qNombre || (p.nombre || '').toLowerCase().includes(qNombre);
    const byDepto = !depto || (p.departamento || '') === depto;
    const bySede = !sede || (p.sedes_resumen || p.sede || '') === sede;

    return byNombre && byDepto && bySede;
  });

  renderRows(filtrados);
}

export function toggleFiltros() {
  const container = document.getElementById('search-container');
  const btn = document.getElementById('toggle-filtros-btn');
  if (!container || !btn) return;

  const willShow = container.classList.contains('hidden');
  container.classList.toggle('hidden');
  btn.textContent = willShow ? 'Ocultar filtros' : 'Filtrar';
}

export function resetFiltros() {
  const profesoresCache = getProfesoresCache();

  ['search-nombre', 'search-departamento', 'search-sede'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderRows(profesoresCache);
}

/* =========================================================
   MODALES
========================================================= */

export function abrirModal() {
  document.getElementById('modal-profesor')?.classList.add('is-open');
}

export function cerrarModal() {
  document.getElementById('modal-profesor')?.classList.remove('is-open');
  clearSedesSearch();
}

export function abrirModalCatalogo() {
  document.getElementById('modal-catalogo-talleres')?.classList.add('is-open');
}

export function cerrarModalCatalogo() {
  document.getElementById('modal-catalogo-talleres')?.classList.remove('is-open');
}

export function abrirModalCatalogoFormaciones() {
  document.getElementById('modal-catalogo-formaciones')?.classList.add('is-open');
}

export function cerrarModalCatalogoFormaciones() {
  document.getElementById('modal-catalogo-formaciones')?.classList.remove('is-open');
}

export function abrirModalCatalogoPostgrados() {
  document.getElementById('modal-catalogo-postgrado')?.classList.add('is-open');
}

export function cerrarModalCatalogoPostgrados() {
  document.getElementById('modal-catalogo-postgrado')?.classList.remove('is-open');
}

/* =========================================================
   TABS
========================================================= */

export function activateTab(tabName) {
  document.querySelectorAll('.profesor-tab').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tabName);
  });

  document.querySelectorAll('.profesor-tab-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === tabName);
  });
}

export function bindProfesorTabs() {
  document.querySelectorAll('.profesor-tab').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
}

/* =========================================================
   FORMULARIO PRINCIPAL
========================================================= */

export function resetFormUI() {
  const form = document.getElementById('profesor-form');
  const idInput = document.getElementById('id_profesor');
  const title = document.getElementById('form-title');

  if (form) form.reset();
  if (idInput) idInput.value = '';
  if (title) title.textContent = 'Agregar Profesor';

  renderTalleresSelector([]);
  renderFormacionesSelector([]);
  resetPostgradosUI();
  setSelectedSedes([]);
  clearSedesSearch();
  activateTab('datos-generales');
}

export function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre ?? '';
  document.getElementById('departamento').value = profesor.departamento ?? '';
  document.getElementById('estado_I').checked = Number(profesor.estado_I) === 1;
  document.getElementById('otro_i').value = profesor.otro_i ?? '';

  setSelectedSedes(profesor.sedes ?? []);
  renderTalleresSelector(
    profesor.taller_ids ?? profesor.talleres_catalogo?.map((t) => t.id_taller) ?? []
  );
  renderFormacionesSelector(
    profesor.formacion_ids ??
      profesor.formaciones_docentes
        ?.map((f) => f.id_catalogo_formacion)
        .filter(Boolean) ??
      []
  );
  renderPostgradosSelector(
  profesor.postgrado_ids ??
  profesor.postgrados?.map((p) => p.id_catalogo_postgrado).filter(Boolean) ??
  []
);

  const title = document.getElementById('form-title');
  if (title) title.textContent = 'Editar Profesor';
}

export function getFormData() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    departamento: document.getElementById('departamento').value.trim(),
    sedes: getSelectedSedes(),
    sede_ids: getSelectedSedeIds(),
    estado_I: document.getElementById('estado_I').checked ? 1 : 0,
    otro_i: document.getElementById('otro_i').value.trim(),
    taller_ids: getSelectedTallerIds(),
    formacion_ids: getSelectedFormacionIds(),
    postgrado_ids: getSelectedPostgradoIds()
  };
}

/* =========================================================
   TABLAS DE CATÁLOGO
========================================================= */

export function renderCatalogoTalleresTable(data) {
  const tbody = document.getElementById('catalogo-talleres-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;">No hay talleres en el catálogo.</td>
      </tr>
    `;
    return;
  }

  data.forEach((taller) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(taller.nombre_taller)}</strong>
          <span class="inline-note">${escapeHTML(taller.descripcion || 'Sin descripción')}</span>
        </div>
      </td>
      <td>
        <span class="summary-badge ${taller.estado === 'inactivo' ? 'summary-badge-muted' : ''}">
          ${escapeHTML(taller.estado)}
        </span>
      </td>
      <td>${Number(taller.profesores_asociados ?? 0)}</td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn-secondary btn-sm" onclick="editarCatalogoTaller(${taller.id_taller})">Editar</button>
          <button type="button" class="btn-danger btn-sm" onclick="eliminarCatalogoTaller(${taller.id_taller})">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

export function resetCatalogoForm() {
  document.getElementById('catalogo_id_taller').value = '';
  document.getElementById('catalogo_nombre_taller').value = '';
  document.getElementById('catalogo_descripcion').value = '';
  document.getElementById('catalogo_estado').value = 'activo';
}

export function fillCatalogoForm(taller) {
  document.getElementById('catalogo_id_taller').value = taller.id_taller;
  document.getElementById('catalogo_nombre_taller').value = taller.nombre_taller ?? '';
  document.getElementById('catalogo_descripcion').value = taller.descripcion ?? '';
  document.getElementById('catalogo_estado').value = taller.estado ?? 'activo';
}

export function renderCatalogoFormacionesTable(data) {
  const tbody = document.getElementById('catalogo-formaciones-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay formaciones en el catálogo.</td>
      </tr>
    `;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(item.nombre_actividad)}</strong>
          <span class="inline-note">${escapeHTML(item.descripcion || 'Sin descripción')}</span>
        </div>
      </td>
      <td>${escapeHTML(item.tipo_formacion || '-')}</td>
      <td>${escapeHTML(item.institucion || '-')}</td>
      <td>
        <span class="summary-badge ${item.estado === 'inactivo' ? 'summary-badge-muted' : ''}">
          ${escapeHTML(item.estado || 'activo')}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn-secondary btn-sm" onclick="editarCatalogoFormacion(${item.id_catalogo_formacion})">Editar</button>
          <button type="button" class="btn-danger btn-sm" onclick="eliminarCatalogoFormacion(${item.id_catalogo_formacion})">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

export function resetCatalogoFormacionForm() {
  document.getElementById('catalogo_id_formacion').value = '';
  document.getElementById('catalogo_nombre_actividad').value = '';
  document.getElementById('catalogo_tipo_formacion').value = 'VRA';
  document.getElementById('catalogo_institucion_formacion').value = '';
  document.getElementById('catalogo_descripcion_formacion').value = '';
  document.getElementById('catalogo_estado_formacion').value = 'activo';
}

export function fillCatalogoFormacionForm(item) {
  document.getElementById('catalogo_id_formacion').value = item.id_catalogo_formacion;
  document.getElementById('catalogo_nombre_actividad').value = item.nombre_actividad ?? '';
  document.getElementById('catalogo_tipo_formacion').value = item.tipo_formacion ?? 'VRA';
  document.getElementById('catalogo_institucion_formacion').value = item.institucion ?? '';
  document.getElementById('catalogo_descripcion_formacion').value = item.descripcion ?? '';
  document.getElementById('catalogo_estado_formacion').value = item.estado ?? 'activo';
}

export function renderCatalogoPostgradoTable(data) {
  const tbody = document.getElementById('catalogo-postgrado-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay postgrados en el catálogo.</td>
      </tr>
    `;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(item.nombre_postgrado)}</strong>
          <span class="inline-note">${escapeHTML(item.descripcion || 'Sin descripción')}</span>
        </div>
      </td>
      <td>${escapeHTML(item.institucion || '-')}</td>
      <td>${escapeHTML(item.area_estudio || '-')}</td>
      <td>
        <span class="summary-badge ${item.estado === 'inactivo' ? 'summary-badge-muted' : ''}">
          ${escapeHTML(item.estado || 'activo')}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn-secondary btn-sm" onclick="editarCatalogoPostgrado(${item.id_catalogo_postgrado})">Editar</button>
          <button type="button" class="btn-danger btn-sm" onclick="eliminarCatalogoPostgrado(${item.id_catalogo_postgrado})">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

export function resetCatalogoPostgradoForm() {
  document.getElementById('catalogo_id_postgrado').value = '';
  document.getElementById('catalogo_nombre_postgrado').value = '';
  document.getElementById('catalogo_institucion_postgrado').value = '';
  document.getElementById('catalogo_area_estudio_postgrado').value = '';
  document.getElementById('catalogo_anio_obtencion_postgrado').value = '';
  document.getElementById('catalogo_modalidad_postgrado').value = '';
  document.getElementById('catalogo_observaciones_postgrado').value = '';
  document.getElementById('catalogo_estado_postgrado').value = 'activo';
}

export function fillCatalogoPostgradoForm(item) {
  document.getElementById('catalogo_id_postgrado').value = item.id_catalogo_postgrado;
  document.getElementById('catalogo_nombre_postgrado').value = item.nombre_postgrado ?? '';
  document.getElementById('catalogo_institucion_postgrado').value = item.institucion ?? '';
  document.getElementById('catalogo_area_estudio_postgrado').value = item.area_estudio ?? '';
  document.getElementById('catalogo_anio_obtencion_postgrado').value = item.anio_obtencion ?? '';
  document.getElementById('catalogo_modalidad_postgrado').value = item.modalidad ?? '';
  document.getElementById('catalogo_observaciones_postgrado').value = item.observaciones ?? '';
  document.getElementById('catalogo_estado_postgrado').value = item.estado ?? 'activo';
}

export function resetCatalogoSedeForm() {
  const form = document.getElementById('catalogo-sede-form');
  if (form) form.reset();

  const idInput = document.getElementById('catalogo_id_sede');
  if (idInput) idInput.value = '';

  const estado = document.getElementById('catalogo_estado_sede');
  if (estado) estado.value = 'activa';
}


/* =========================================================
   MODAL DETALLE FORMACIÓN DOCENTE
========================================================= */

export function abrirModalDetalleFormacion() {
  document.getElementById('modal-detalle-formacion')?.classList.add('is-open');
}

export function cerrarModalDetalleFormacion() {
  document.getElementById('modal-detalle-formacion')?.classList.remove('is-open');
}

export function renderModalDetalleFormacion(profesor) {
  const nombre = document.getElementById('detalle-formacion-nombre');
  const depto = document.getElementById('detalle-formacion-depto');
  const body = document.getElementById('detalle-formacion-body');

  if (nombre) nombre.textContent = profesor.nombre ?? 'Profesor';
  if (depto) depto.textContent = profesor.departamento ?? '';
  if (!body) return;

  const talleres = Array.isArray(profesor.talleres_catalogo) ? profesor.talleres_catalogo : [];
  const formaciones = Array.isArray(profesor.formaciones_docentes) ? profesor.formaciones_docentes : [];
  const postgrados = Array.isArray(profesor.postgrados) ? profesor.postgrados : [];

  body.innerHTML = `
    <!-- TALLERES -->
    <div class="detalle-seccion">
      <div class="detalle-seccion-header">
        <span class="summary-badge">Talleres</span>
        <strong>${talleres.length} registrado${talleres.length !== 1 ? 's' : ''}</strong>
      </div>
      ${talleres.length === 0
        ? '<p class="detalle-vacio">Sin talleres registrados.</p>'
        : talleres.map(t => `
          <div class="detalle-item">
            <div class="detalle-item-title">${escapeHTML(t.nombre_taller ?? '')}</div>
            ${t.descripcion ? `<div class="detalle-item-sub">${escapeHTML(t.descripcion)}</div>` : ''}
            <span class="detalle-badge detalle-badge-${t.estado === 'activo' ? 'green' : 'muted'}">${escapeHTML(t.estado ?? '')}</span>
          </div>`).join('')
      }
    </div>

    <!-- FORMACIONES -->
    <div class="detalle-seccion">
      <div class="detalle-seccion-header">
        <span class="summary-badge summary-badge-green">Formación Docente</span>
        <strong>${formaciones.length} registrada${formaciones.length !== 1 ? 's' : ''}</strong>
      </div>
      ${formaciones.length === 0
        ? '<p class="detalle-vacio">Sin formaciones registradas.</p>'
        : formaciones.map(f => `
          <div class="detalle-item">
            <div class="detalle-item-title">${escapeHTML(f.nombre_actividad ?? '')}</div>
            <div class="detalle-item-sub">
              ${f.tipo_formacion ? `<span>${escapeHTML(f.tipo_formacion)}</span>` : ''}
              ${f.institucion ? `<span>· ${escapeHTML(f.institucion)}</span>` : ''}
              ${f.anio ? `<span>· ${escapeHTML(String(f.anio))}</span>` : ''}
              ${f.modalidad ? `<span>· ${escapeHTML(f.modalidad)}</span>` : ''}
            </div>
            <span class="detalle-badge detalle-badge-${f.estado === 'vigente' ? 'green' : 'muted'}">${escapeHTML(f.estado ?? '')}</span>
          </div>`).join('')
      }
    </div>

    <!-- POSTGRADOS -->
    <div class="detalle-seccion">
      <div class="detalle-seccion-header">
        <span class="summary-badge summary-badge-blue">Postgrados</span>
        <strong>${postgrados.length} registrado${postgrados.length !== 1 ? 's' : ''}</strong>
      </div>
      ${postgrados.length === 0
        ? '<p class="detalle-vacio">Sin postgrados registrados.</p>'
        : postgrados.map(p => `
          <div class="detalle-item">
            <div class="detalle-item-title">${escapeHTML(p.nombre_postgrado ?? '')} <small>(${escapeHTML(p.tipo_postgrado ?? '')})</small></div>
            <div class="detalle-item-sub">
              ${p.institucion ? `<span>${escapeHTML(p.institucion)}</span>` : ''}
              ${p.area_estudio ? `<span>· ${escapeHTML(p.area_estudio)}</span>` : ''}
              ${p.anio_obtencion ? `<span>· ${escapeHTML(String(p.anio_obtencion))}</span>` : ''}
              ${p.modalidad ? `<span>· ${escapeHTML(p.modalidad)}</span>` : ''}
            </div>
            <span class="detalle-badge detalle-badge-${p.estado === 'finalizado' ? 'blue' : 'muted'}">${escapeHTML(p.estado ?? '')}</span>
          </div>`).join('')
      }
    </div>
  `;
}

export function fillCatalogoSedeForm(sede) {
  document.getElementById('catalogo_id_sede').value = sede.id_sede ?? sede.id ?? '';
  document.getElementById('catalogo_nombre_sede').value = sede.nombre_sede ?? '';
  document.getElementById('catalogo_codigo_sede').value = sede.codigo_sede ?? '';
  document.getElementById('catalogo_ciudad_sede').value = sede.ciudad ?? '';
  document.getElementById('catalogo_direccion_sede').value = sede.direccion ?? '';
  document.getElementById('catalogo_estado_sede').value = sede.estado ?? 'activa';
}