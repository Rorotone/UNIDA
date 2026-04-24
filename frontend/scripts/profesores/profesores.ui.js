import {
  getProfesoresCache,
  getCatalogoTalleresCache,
  getCatalogoFormacionesCache,
  getCatalogoMagisterCache,
  getCatalogoSedesCache
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
  const openMagisterBtn = document.getElementById('open-catalogo-magister-btn');

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
  openMagisterBtn?.addEventListener('click', () => abrirCatalogosEn('magister'));

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

export function getSelectedMagisterId() {
  return getRadioSelectedId('#magister-selector');
}

export function renderMagisterSelector(selectedId = null) {
  const container = document.getElementById('magister-selector');
  if (!container) return;

  const catalogoMagisterCache = getCatalogoMagisterCache();
  const normalizedSelectedId = Number(selectedId) || null;

  const visibles = catalogoMagisterCache.filter(
    (item) =>
      item.estado === 'activo' ||
      Number(item.id_catalogo_magister) === normalizedSelectedId
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay magíster activos en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles
    .map((magister) =>
      buildCatalogCard({
        inputType: 'checkbox',
        inputName: 'magister_id',
        value: magister.id_catalogo_magister,
        checked: Number(magister.id_catalogo_magister) === normalizedSelectedId,
        title: magister.nombre_magister,
        subtitle: [
          magister.institucion ? `Institución: ${magister.institucion}` : '',
          magister.area_estudio ? `Área: ${magister.area_estudio}` : ''
        ]
          .filter(Boolean)
          .join(' · '),
        description: magister.descripcion || 'Sin descripción',
        status: magister.estado || 'activo'
      })
    )
    .join('');

  updateSelectableCardState(container);
}

/* =========================================================
   TABLA PRINCIPAL
========================================================= */

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
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(p.formacion_docente_resumen || 'Sin registros')}</strong>
          <span class="inline-note">
            Talleres: ${Number(p.cantidad_talleres ?? 0)} ·
            Formaciones: ${Number(p.cantidad_formaciones ?? 0)} ·
            Magíster: ${Number(p.cantidad_magister ?? 0)}
          </span>
        </div>
      </td>
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

export function abrirModalCatalogoMagister() {
  document.getElementById('modal-catalogo-magister')?.classList.add('is-open');
}

export function cerrarModalCatalogoMagister() {
  document.getElementById('modal-catalogo-magister')?.classList.remove('is-open');
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
  renderMagisterSelector(null);
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
  renderMagisterSelector(
    profesor.magister_id ?? profesor.magister?.id_catalogo_magister ?? null
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
    magister_id: getSelectedMagisterId()
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

export function renderCatalogoMagisterTable(data) {
  const tbody = document.getElementById('catalogo-magister-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">No hay magíster en el catálogo.</td>
      </tr>
    `;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(item.nombre_magister)}</strong>
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
          <button type="button" class="btn-secondary btn-sm" onclick="editarCatalogoMagister(${item.id_catalogo_magister})">Editar</button>
          <button type="button" class="btn-danger btn-sm" onclick="eliminarCatalogoMagister(${item.id_catalogo_magister})">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

export function resetCatalogoMagisterForm() {
  document.getElementById('catalogo_id_magister').value = '';
  document.getElementById('catalogo_nombre_magister').value = '';
  document.getElementById('catalogo_institucion_magister').value = '';
  document.getElementById('catalogo_area_estudio_magister').value = '';
  document.getElementById('catalogo_descripcion_magister').value = '';
  document.getElementById('catalogo_estado_magister').value = 'activo';
}

export function fillCatalogoMagisterForm(item) {
  document.getElementById('catalogo_id_magister').value = item.id_catalogo_magister;
  document.getElementById('catalogo_nombre_magister').value = item.nombre_magister ?? '';
  document.getElementById('catalogo_institucion_magister').value = item.institucion ?? '';
  document.getElementById('catalogo_area_estudio_magister').value = item.area_estudio ?? '';
  document.getElementById('catalogo_descripcion_magister').value = item.descripcion ?? '';
  document.getElementById('catalogo_estado_magister').value = item.estado ?? 'activo';
}

export function resetCatalogoSedeForm() {
  const form = document.getElementById('catalogo-sede-form');
  if (form) form.reset();

  const idInput = document.getElementById('catalogo_id_sede');
  if (idInput) idInput.value = '';

  const estado = document.getElementById('catalogo_estado_sede');
  if (estado) estado.value = 'activa';
}

export function fillCatalogoSedeForm(sede) {
  document.getElementById('catalogo_id_sede').value = sede.id_sede ?? sede.id ?? '';
  document.getElementById('catalogo_nombre_sede').value = sede.nombre_sede ?? '';
  document.getElementById('catalogo_codigo_sede').value = sede.codigo_sede ?? '';
  document.getElementById('catalogo_ciudad_sede').value = sede.ciudad ?? '';
  document.getElementById('catalogo_direccion_sede').value = sede.direccion ?? '';
  document.getElementById('catalogo_estado_sede').value = sede.estado ?? 'activa';
}
