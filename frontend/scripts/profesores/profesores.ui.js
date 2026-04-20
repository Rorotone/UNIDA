let profesoresCache = [];
let catalogoTalleresCache = [];
let catalogoFormacionesCache = [];
let catalogoMagisterCache = [];
let catalogoSedesCache = [];
let selectedSedesCache = [];

function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* =========================================================
   NORMALIZACIÓN Y CACHES
========================================================= */

function normalizeProfesor(p) {
  return {
    ...p,
    sede: p.Sede ?? p.sede ?? p.sedes_resumen ?? '',
    sedes_resumen: p.sedes_resumen ?? p.Sede ?? p.sede ?? '',
    cantidad_talleres: Number(p.cantidad_talleres ?? 0),
    cantidad_formaciones: Number(p.cantidad_formaciones ?? 0),
    cantidad_magister: Number(p.cantidad_magister ?? 0),
    formacion_docente_resumen: p.formacion_docente_resumen ?? 'Sin registros',
    talleres_catalogo: Array.isArray(p.talleres_catalogo) ? p.talleres_catalogo : [],
    taller_ids: Array.isArray(p.taller_ids) ? p.taller_ids.map((id) => Number(id)) : [],
    formacion_ids: Array.isArray(p.formacion_ids) ? p.formacion_ids.map((id) => Number(id)) : [],
    sedes: Array.isArray(p.sedes) ? p.sedes : [],
    sede_ids: Array.isArray(p.sede_ids) ? p.sede_ids.map((id) => Number(id)) : [],
    formaciones_docentes: Array.isArray(p.formaciones_docentes) ? p.formaciones_docentes : [],
    magister: p.magister ?? null,
    magister_id: Number(
      p.magister_id ??
      p.magister?.id_catalogo_magister ??
      p.magister?.id_magister ??
      0
    ) || null,
    estado_I: Number(p.estado_I ?? p.Estado_I ?? 0),
    otro_i: p.otro_i ?? p.Otro_i ?? ''
  };
}

function setProfesoresCache(data) {
  profesoresCache = (data || []).map(normalizeProfesor);
}

function getProfesoresCache() {
  return profesoresCache;
}

function setCatalogoTalleresCache(data) {
  catalogoTalleresCache = Array.isArray(data) ? data : [];
}

function getCatalogoTalleresCache() {
  return catalogoTalleresCache;
}

function setCatalogoFormacionesCache(data) {
  catalogoFormacionesCache = Array.isArray(data) ? data : [];
}

function getCatalogoFormacionesCache() {
  return catalogoFormacionesCache;
}

function setCatalogoMagisterCache(data) {
  catalogoMagisterCache = Array.isArray(data) ? data : [];
}

function getCatalogoMagisterCache() {
  return catalogoMagisterCache;
}

function setCatalogoSedesCache(data) {
  catalogoSedesCache = Array.isArray(data) ? data : [];
}

function getCatalogoSedesCache() {
  return catalogoSedesCache;
}

/* =========================================================
   SEDES
========================================================= */

function setSelectedSedes(data) {
  const normalized = Array.isArray(data) ? data : [];
  const unique = new Map();

  normalized.forEach((item) => {
    const id = Number(item?.id_sede ?? item);
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

function getSelectedSedes() {
  return selectedSedesCache;
}

function getSelectedSedeIds() {
  return selectedSedesCache.map((item) => Number(item.id_sede));
}

function updateSelectedSedeField(idSede, field, value) {
  selectedSedesCache = selectedSedesCache.map((item) => {
    if (Number(item.id_sede) !== Number(idSede)) return item;
    return {
      ...item,
      [field]: String(value ?? '').trim(),
    };
  });

  renderSelectedSedes();
}

function renderSelectedSedes() {
  const container = document.getElementById('sedes-selected');
  if (!container) return;

  if (!selectedSedesCache.length) {
    container.innerHTML = `<span class="inline-note">No hay sedes seleccionadas.</span>`;
    return;
  }

  container.innerHTML = selectedSedesCache.map((sede) => `
    <div class="sede-card">
      <div class="sede-card-header">
        <strong>${escapeHTML(sede.nombre_sede)}</strong>
        <button type="button" class="sede-chip-remove" data-id="${sede.id_sede}" aria-label="Quitar sede">&times;</button>
      </div>

      <div class="sede-card-grid">
        <label>
          Modalidad
          <select data-action="sede-field" data-field="modalidad" data-id="${sede.id_sede}">
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
            data-id="${sede.id_sede}"
            value="${escapeHTML(sede.flexibilidad_horaria)}"
            placeholder="Ej. alta, franjas AM/PM"
          >
        </label>
      </div>
    </div>
  `).join('');
}

function hideSedesSuggestions() {
  const container = document.getElementById('sedes-suggestions');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

function clearSedesSearch() {
  const input = document.getElementById('sedes-search-input');
  if (input) input.value = '';
  hideSedesSuggestions();
}

function addSelectedSede(sede) {
  const idSede = Number(sede?.id_sede);
  if (!Number.isInteger(idSede) || idSede <= 0) return;
  if (selectedSedesCache.some((item) => Number(item.id_sede) === idSede)) return;

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
  selectedSedesCache = selectedSedesCache.filter((item) => Number(item.id_sede) !== Number(idSede));
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

  container.innerHTML = items.map((sede) => `
    <button type="button" class="sede-suggestion-item" data-id="${sede.id_sede}">
      <strong>${escapeHTML(sede.nombre_sede)}</strong>
      <small>${escapeHTML([sede.ciudad, sede.codigo_sede].filter(Boolean).join(' · ') || 'Sede activa')}</small>
    </button>
  `).join('');

  container.classList.remove('hidden');
}

/* =========================================================
   HELPERS GENÉRICOS DE CATÁLOGOS
========================================================= */

function getCheckedIds(selector) {
  return Array.from(document.querySelectorAll(`${selector} input[type="checkbox"]:checked`))
    .map((checkbox) => Number(checkbox.value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getRadioSelectedId(selector) {
  const selected = document.querySelector(`${selector} input[type="radio"]:checked`);
  if (!selected) return null;

  const value = Number(selected.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function updateSelectableCardState(container) {
  if (!container) return;

  container.querySelectorAll('.taller-option').forEach((item) => {
    const input = item.querySelector('input');
    item.classList.toggle('is-selected', !!input?.checked);
  });
}

function buildCatalogCard({
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
    <label class="taller-option ${checked ? 'is-selected' : ''}">
      <input type="${inputType}" ${inputName ? `name="${inputName}"` : ''} value="${value}" ${checked ? 'checked' : ''}>
      <span class="taller-option-main">
        <strong>${escapeHTML(title)}</strong>
        ${subtitle ? `<small>${escapeHTML(subtitle)}</small>` : ''}
        ${description ? `<small>${escapeHTML(description)}</small>` : ''}
        ${status && status !== 'activo' ? `<small>(Estado: ${escapeHTML(status)})</small>` : ''}
      </span>
    </label>
  `;
}

/* =========================================================
   TALLERES
========================================================= */

function getSelectedTallerIds() {
  return getCheckedIds('#talleres-selector');
}

function renderTalleresSelector(selectedIds = []) {
  const container = document.getElementById('talleres-selector');
  if (!container) return;

  const selectedSet = new Set((selectedIds || []).map((item) => Number(item)));
  const visibles = catalogoTalleresCache.filter((item) =>
    item.estado === 'activo' || selectedSet.has(Number(item.id_taller))
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay talleres activos en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles.map((taller) => buildCatalogCard({
    inputType: 'checkbox',
    value: taller.id_taller,
    checked: selectedSet.has(Number(taller.id_taller)),
    title: taller.nombre_taller,
    description: taller.descripcion || 'Sin descripción',
    status: taller.estado || 'activo'
  })).join('');

  updateSelectableCardState(container);
}

/* =========================================================
   FORMACIONES DESDE CATÁLOGO
========================================================= */

function getSelectedFormacionIds() {
  return getCheckedIds('#formaciones-selector');
}

function renderFormacionesSelector(selectedIds = []) {
  const container = document.getElementById('formaciones-selector');
  if (!container) return;

  const selectedSet = new Set((selectedIds || []).map((item) => Number(item)));
  const visibles = catalogoFormacionesCache.filter((item) =>
    item.estado === 'activo' || selectedSet.has(Number(item.id_catalogo_formacion))
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay formaciones activas en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles.map((formacion) => buildCatalogCard({
    inputType: 'checkbox',
    value: formacion.id_catalogo_formacion,
    checked: selectedSet.has(Number(formacion.id_catalogo_formacion)),
    title: formacion.nombre_actividad,
    subtitle: [
      formacion.tipo_formacion ? `Tipo: ${formacion.tipo_formacion}` : '',
      formacion.institucion ? `Institución: ${formacion.institucion}` : ''
    ].filter(Boolean).join(' · '),
    description: formacion.descripcion || 'Sin descripción',
    status: formacion.estado || 'activo'
  })).join('');

  updateSelectableCardState(container);
}

/* =========================================================
   MAGÍSTER DESDE CATÁLOGO
========================================================= */

function getSelectedMagisterId() {
  return getRadioSelectedId('#magister-selector');
}

function renderMagisterSelector(selectedId = null) {
  const container = document.getElementById('magister-selector');
  if (!container) return;

  const normalizedSelectedId = Number(selectedId) || null;
  const visibles = catalogoMagisterCache.filter((item) =>
    item.estado === 'activo' || Number(item.id_catalogo_magister) === normalizedSelectedId
  );

  if (!visibles.length) {
    container.innerHTML = `<div class="empty-selector">No hay magíster activos en el catálogo.</div>`;
    return;
  }

  container.innerHTML = visibles.map((magister) => buildCatalogCard({
    inputType: 'radio',
    inputName: 'magister_id',
    value: magister.id_catalogo_magister,
    checked: Number(magister.id_catalogo_magister) === normalizedSelectedId,
    title: magister.nombre_magister,
    subtitle: [
      magister.institucion ? `Institución: ${magister.institucion}` : '',
      magister.area_estudio ? `Área: ${magister.area_estudio}` : ''
    ].filter(Boolean).join(' · '),
    description: magister.descripcion || 'Sin descripción',
    status: magister.estado || 'activo'
  })).join('');

  updateSelectableCardState(container);
}

/* =========================================================
   TABLA PRINCIPAL
========================================================= */

function renderRows(data) {
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
    tr.innerHTML = `
      <td>${escapeHTML(p.nombre)}</td>
      <td>${escapeHTML(p.departamento)}</td>
      <td>${escapeHTML(p.sedes_resumen || p.sede || 'Sin sede')}</td>
      <td>
        <div class="summary-stack">
          <strong>${escapeHTML(p.formacion_docente_resumen || 'Sin registros')}</strong>
          <span class="inline-note">Talleres: ${Number(p.cantidad_talleres ?? 0)} · Formaciones: ${Number(p.cantidad_formaciones ?? 0)} · Magíster: ${Number(p.cantidad_magister ?? 0)}</span>
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

function uniqueValues(arr, key) {
  return [...new Set(arr.map(item => String(item?.[key] ?? '').trim()).filter(Boolean))].sort();
}

function populateSelect(selectEl, values) {
  if (!selectEl) return;

  selectEl.innerHTML =
    `<option value="">Todos</option>` +
    values.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
}

function renderFiltros() {
  populateSelect(document.getElementById('search-departamento'), uniqueValues(profesoresCache, 'departamento'));
  populateSelect(document.getElementById('search-sede'), uniqueValues(profesoresCache, 'sedes_resumen'));
}

function applyFilters() {
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

function toggleFiltros() {
  const container = document.getElementById('search-container');
  const btn = document.getElementById('toggle-filtros-btn');
  if (!container || !btn) return;

  const willShow = container.classList.contains('hidden');
  container.classList.toggle('hidden');
  btn.textContent = willShow ? 'Ocultar filtros' : 'Filtrar';
}

function resetFiltros() {
  const ids = [
    'search-nombre',
    'search-departamento',
    'search-sede'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderRows(profesoresCache);
}

/* =========================================================
   MODALES Y TABS
========================================================= */

function abrirModal() {
  document.getElementById('modal-profesor')?.classList.add('is-open');
}

function cerrarModal() {
  document.getElementById('modal-profesor')?.classList.remove('is-open');
  hideSedesSuggestions();
}

function abrirModalCatalogo() {
  document.getElementById('modal-catalogo-talleres')?.classList.add('is-open');
}

function cerrarModalCatalogo() {
  document.getElementById('modal-catalogo-talleres')?.classList.remove('is-open');
}

function abrirModalCatalogoFormaciones() {
  document.getElementById('modal-catalogo-formaciones')?.classList.add('is-open');
}

function cerrarModalCatalogoFormaciones() {
  document.getElementById('modal-catalogo-formaciones')?.classList.remove('is-open');
}

function abrirModalCatalogoMagister() {
  document.getElementById('modal-catalogo-magister')?.classList.add('is-open');
}

function cerrarModalCatalogoMagister() {
  document.getElementById('modal-catalogo-magister')?.classList.remove('is-open');
}

function activateTab(tabName) {
  document.querySelectorAll('.profesor-tab').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tabName);
  });

  document.querySelectorAll('.profesor-tab-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === tabName);
  });
}

function bindProfesorTabs() {
  document.querySelectorAll('.profesor-tab').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
}

/* =========================================================
   RESET / FILL / DATA FORM
========================================================= */

function resetFormUI() {
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

function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre ?? '';
  document.getElementById('departamento').value = profesor.departamento ?? '';
  document.getElementById('estado_I').checked = Number(profesor.estado_I) === 1;
  document.getElementById('otro_i').value = profesor.otro_i ?? '';

  setSelectedSedes(profesor.sedes ?? []);
  renderTalleresSelector(profesor.taller_ids ?? profesor.talleres_catalogo?.map((t) => t.id_taller) ?? []);
  renderFormacionesSelector(
    profesor.formacion_ids ??
    profesor.formaciones_docentes?.map((f) => f.id_catalogo_formacion).filter(Boolean) ??
    []
  );
  renderMagisterSelector(
    profesor.magister_id ??
    profesor.magister?.id_catalogo_magister ??
    null
  );

  const title = document.getElementById('form-title');
  if (title) title.textContent = 'Editar Profesor';
}

function getFormData() {
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
   CATÁLOGO TALLERES - TABLA Y FORM
========================================================= */

function renderCatalogoTalleresTable(data) {
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
      <td><span class="summary-badge ${taller.estado === 'inactivo' ? 'summary-badge-muted' : ''}">${escapeHTML(taller.estado)}</span></td>
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

function resetCatalogoForm() {
  document.getElementById('catalogo_id_taller').value = '';
  document.getElementById('catalogo_nombre_taller').value = '';
  document.getElementById('catalogo_descripcion').value = '';
  document.getElementById('catalogo_estado').value = 'activo';
}

function fillCatalogoForm(taller) {
  document.getElementById('catalogo_id_taller').value = taller.id_taller;
  document.getElementById('catalogo_nombre_taller').value = taller.nombre_taller ?? '';
  document.getElementById('catalogo_descripcion').value = taller.descripcion ?? '';
  document.getElementById('catalogo_estado').value = taller.estado ?? 'activo';
}

/* =========================================================
   CATÁLOGO FORMACIONES - TABLA Y FORM
========================================================= */

function renderCatalogoFormacionesTable(data) {
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
      <td><span class="summary-badge ${item.estado === 'inactivo' ? 'summary-badge-muted' : ''}">${escapeHTML(item.estado || 'activo')}</span></td>
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

function resetCatalogoFormacionForm() {
  document.getElementById('catalogo_id_formacion').value = '';
  document.getElementById('catalogo_nombre_actividad').value = '';
  document.getElementById('catalogo_tipo_formacion').value = 'VRA';
  document.getElementById('catalogo_institucion_formacion').value = '';
  document.getElementById('catalogo_descripcion_formacion').value = '';
  document.getElementById('catalogo_estado_formacion').value = 'activo';
}

function fillCatalogoFormacionForm(item) {
  document.getElementById('catalogo_id_formacion').value = item.id_catalogo_formacion;
  document.getElementById('catalogo_nombre_actividad').value = item.nombre_actividad ?? '';
  document.getElementById('catalogo_tipo_formacion').value = item.tipo_formacion ?? 'VRA';
  document.getElementById('catalogo_institucion_formacion').value = item.institucion ?? '';
  document.getElementById('catalogo_descripcion_formacion').value = item.descripcion ?? '';
  document.getElementById('catalogo_estado_formacion').value = item.estado ?? 'activo';
}

/* =========================================================
   CATÁLOGO MAGÍSTER - TABLA Y FORM
========================================================= */

function renderCatalogoMagisterTable(data) {
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
      <td><span class="summary-badge ${item.estado === 'inactivo' ? 'summary-badge-muted' : ''}">${escapeHTML(item.estado || 'activo')}</span></td>
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

function resetCatalogoMagisterForm() {
  document.getElementById('catalogo_id_magister').value = '';
  document.getElementById('catalogo_nombre_magister').value = '';
  document.getElementById('catalogo_institucion_magister').value = '';
  document.getElementById('catalogo_area_estudio_magister').value = '';
  document.getElementById('catalogo_descripcion_magister').value = '';
  document.getElementById('catalogo_estado_magister').value = 'activo';
}

function fillCatalogoMagisterForm(item) {
  document.getElementById('catalogo_id_magister').value = item.id_catalogo_magister;
  document.getElementById('catalogo_nombre_magister').value = item.nombre_magister ?? '';
  document.getElementById('catalogo_institucion_magister').value = item.institucion ?? '';
  document.getElementById('catalogo_area_estudio_magister').value = item.area_estudio ?? '';
  document.getElementById('catalogo_descripcion_magister').value = item.descripcion ?? '';
  document.getElementById('catalogo_estado_magister').value = item.estado ?? 'activo';
}