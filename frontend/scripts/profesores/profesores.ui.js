let profesoresCache = [];
let catalogoTalleresCache = [];
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
    sedes: Array.isArray(p.sedes) ? p.sedes : [],
    sede_ids: Array.isArray(p.sede_ids) ? p.sede_ids.map((id) => Number(id)) : [],
    formaciones_docentes: Array.isArray(p.formaciones_docentes) ? p.formaciones_docentes : [],
    magister: p.magister ?? null,
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

function setCatalogoSedesCache(data) {
  catalogoSedesCache = Array.isArray(data) ? data : [];
}

function getCatalogoSedesCache() {
  return catalogoSedesCache;
}

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

function getSelectedTallerIds() {
  return Array.from(document.querySelectorAll('#talleres-selector input[type="checkbox"]:checked'))
    .map((checkbox) => Number(checkbox.value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

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

function resetFormUI() {
  const form = document.getElementById('profesor-form');
  const idInput = document.getElementById('id_profesor');
  const title = document.getElementById('form-title');

  if (form) form.reset();
  if (idInput) idInput.value = '';
  if (title) title.textContent = 'Agregar Profesor';

  document.getElementById('formaciones-docentes-list').innerHTML = '';
  renderTalleresSelector([]);
  setSelectedSedes([]);
  clearSedesSearch();
  addFormacionDocenteItem();
  activateTab('datos-generales');
  document.getElementById('magister_estado').value = 'finalizado';
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
          <input type="text" data-action="sede-field" data-field="flexibilidad_horaria" data-id="${sede.id_sede}" value="${escapeHTML(sede.flexibilidad_horaria)}" placeholder="Ej. alta, franjas AM/PM">
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

  container.innerHTML = visibles.map((taller) => `
    <label class="taller-option">
      <input type="checkbox" value="${taller.id_taller}" ${selectedSet.has(Number(taller.id_taller)) ? 'checked' : ''}>
      <span class="taller-option-main">
        <strong>${escapeHTML(taller.nombre_taller)}${taller.estado === 'inactivo' ? ' (inactivo)' : ''}</strong>
        <small>${escapeHTML(taller.descripcion || 'Sin descripción')}</small>
      </span>
    </label>
  `).join('');
}

function createFormacionDocenteItem(data = {}) {
  const template = document.getElementById('formacion-docente-template');
  if (!template) return null;

  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelectorAll('[data-field]').forEach((input) => {
    const field = input.dataset.field;
    input.value = data?.[field] ?? '';
  });

  node.querySelector('.btn-remove-formacion')?.addEventListener('click', () => {
    node.remove();
    ensureAtLeastOneFormacionItem();
  });

  return node;
}

function addFormacionDocenteItem(data = {}) {
  const list = document.getElementById('formaciones-docentes-list');
  if (!list) return;
  const item = createFormacionDocenteItem(data);
  if (item) list.appendChild(item);
}

function ensureAtLeastOneFormacionItem() {
  const list = document.getElementById('formaciones-docentes-list');
  if (!list) return;

  if (!list.children.length) {
    addFormacionDocenteItem();
  }
}

function getFormacionesDocentesData() {
  return Array.from(document.querySelectorAll('#formaciones-docentes-list .repeatable-card')).map((card) => {
    const data = {};
    card.querySelectorAll('[data-field]').forEach((input) => {
      data[input.dataset.field] = input.value?.trim?.() ?? input.value ?? '';
    });
    return data;
  });
}

function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre ?? '';
  document.getElementById('departamento').value = profesor.departamento ?? '';
  document.getElementById('estado_I').checked = Number(profesor.estado_I) === 1;
  document.getElementById('otro_i').value = profesor.otro_i ?? '';

  const magister = profesor.magister || {};
  document.getElementById('magister_institucion').value = magister.institucion ?? '';
  document.getElementById('magister_area_estudio').value = magister.area_estudio ?? '';
  document.getElementById('magister_anio_obtencion').value = magister.anio_obtencion ?? '';
  document.getElementById('magister_modalidad').value = magister.modalidad ?? '';
  document.getElementById('magister_estado').value = magister.estado ?? 'finalizado';
  document.getElementById('magister_observaciones').value = magister.observaciones ?? '';

  setSelectedSedes(profesor.sedes ?? []);
  renderTalleresSelector(profesor.taller_ids ?? []);

  const list = document.getElementById('formaciones-docentes-list');
  if (list) list.innerHTML = '';

  if (Array.isArray(profesor.formaciones_docentes) && profesor.formaciones_docentes.length > 0) {
    profesor.formaciones_docentes.forEach((item) => addFormacionDocenteItem(item));
  } else {
    addFormacionDocenteItem();
  }

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
    formaciones_docentes: getFormacionesDocentesData(),
    magister: {
      institucion: document.getElementById('magister_institucion').value.trim(),
      area_estudio: document.getElementById('magister_area_estudio').value.trim(),
      anio_obtencion: document.getElementById('magister_anio_obtencion').value.trim(),
      modalidad: document.getElementById('magister_modalidad').value,
      estado: document.getElementById('magister_estado').value,
      observaciones: document.getElementById('magister_observaciones').value.trim()
    }
  };
}

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

function getCatalogoFormData() {
  return {
    nombre_taller: document.getElementById('catalogo_nombre_taller').value.trim(),
    descripcion: document.getElementById('catalogo_descripcion').value.trim(),
    estado: document.getElementById('catalogo_estado').value
  };
}

function resetImportUI() {
  const input = document.getElementById('csv-file-input');
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');
  const summary = document.getElementById('csv-import-summary');

  if (input) input.value = '';
  if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
  if (importBtn) importBtn.disabled = true;
  if (summary) summary.innerHTML = '';
}

function setImportLoading(isLoading) {
  const input = document.getElementById('csv-file-input');
  const selectBtn = document.getElementById('select-csv-btn');
  const importBtn = document.getElementById('import-csv-btn');

  if (input) input.disabled = isLoading;
  if (selectBtn) selectBtn.disabled = isLoading;

  if (importBtn) {
    importBtn.disabled = isLoading || !(input?.files?.length);
    importBtn.textContent = isLoading ? 'Importando...' : 'Importar CSV';
  }
}

function updateSelectedCSVName(file) {
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');

  if (fileName) {
    fileName.textContent = file ? file.name : 'Ningún archivo seleccionado';
  }

  if (importBtn) {
    importBtn.disabled = !file;
  }
}

function renderImportSummary(result) {
  const container = document.getElementById('csv-import-summary');
  if (!container) return;

  const total = Number(result?.total_filas ?? 0);
  const validas = Number(result?.filas_validas ?? 0);
  const insertados = Number(result?.insertados ?? 0);
  const duplicadosArchivo = Number(result?.duplicados_archivo ?? 0);
  const duplicadosBd = Number(result?.duplicados_bd ?? 0);
  const errores = Array.isArray(result?.detalle_errores) ? result.detalle_errores : [];

  const resumenHTML = `
    <div class="csv-summary-card">
      <div class="csv-summary-grid">
        <div><strong>Total filas:</strong> ${total}</div>
        <div><strong>Filas válidas:</strong> ${validas}</div>
        <div><strong>Insertados:</strong> ${insertados}</div>
        <div><strong>Duplicados en archivo:</strong> ${duplicadosArchivo}</div>
        <div><strong>Duplicados en BD:</strong> ${duplicadosBd}</div>
        <div><strong>Errores:</strong> ${errores.length}</div>
      </div>
      ${errores.length ? `
        <div class="csv-error-list-wrap">
          <h4>Detalle de observaciones</h4>
          <div class="csv-error-list">
            ${errores.slice(0, 20).map(item => `
              <div class="csv-error-item">
                <strong>Fila ${escapeHTML(item.fila)}</strong> ·
                <span>${escapeHTML(item.campo)}</span> ·
                <span>${escapeHTML(item.error)}</span>
              </div>
            `).join('')}
          </div>
          ${errores.length > 20 ? `
            <p class="csv-error-note">Se muestran 20 observaciones de ${errores.length}.</p>
          ` : ''}
        </div>
      ` : `
        <div class="csv-success-note">La carga fue procesada sin observaciones.</div>
      `}
    </div>
  `;

  container.innerHTML = resumenHTML;
}

function clearImportSummary() {
  const container = document.getElementById('csv-import-summary');
  if (container) container.innerHTML = '';
}
