let profesoresCache = [];

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
    sede: p.Sede ?? p.sede ?? '',
    sede_actual: p.Sede_actual ?? p.sede_actual ?? '',
    talleres: p.Talleres ?? p.talleres ?? '',
    formacion: Number(p.Formacion ?? p.formacion ?? 0),
    estado_I: Number(p.Estado_I ?? p.estado_I ?? 0),
    magister: Number(p.Magister ?? p.magister ?? 0),
    otro_i: p.Otro_I ?? p.Otro_i ?? p.otro_i ?? ''
  };
}

function setProfesoresCache(data) {
  profesoresCache = (data || []).map(normalizeProfesor);
}

function getProfesoresCache() {
  return profesoresCache;
}

function renderRows(data) {
  const tbody = document.getElementById('profesores-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;">No hay profesores para mostrar.</td>
      </tr>
    `;
    return;
  }

  data.forEach((p) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${escapeHTML(p.nombre)}</td>
      <td>${escapeHTML(p.departamento)}</td>
      <td>${escapeHTML(p.sede)}</td>
      <td>${escapeHTML(p.sede_actual)}</td>
      <td>${escapeHTML(p.talleres)}</td>
      <td>${p.formacion === 1 ? 'Sí' : 'No'}</td>
      <td>${p.estado_I === 1 ? 'Sí' : 'No'}</td>
      <td>${p.magister === 1 ? 'Sí' : 'No'}</td>
      <td>${escapeHTML(p.otro_i)}</td>
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
  populateSelect(document.getElementById('search-sede'), uniqueValues(profesoresCache, 'sede'));
  populateSelect(document.getElementById('search-sede-clases'), uniqueValues(profesoresCache, 'sede_actual'));
  populateSelect(document.getElementById('search-talleres-vra'), uniqueValues(profesoresCache, 'talleres'));
}

function applyFilters() {
  const qNombre = document.getElementById('search-nombre')?.value.toLowerCase() || '';
  const depto = document.getElementById('search-departamento')?.value || '';
  const sede = document.getElementById('search-sede')?.value || '';
  const sedeClases = document.getElementById('search-sede-clases')?.value || '';
  const talleres = document.getElementById('search-talleres-vra')?.value || '';

  const filtrados = profesoresCache.filter((p) => {
    const byNombre = !qNombre || (p.nombre || '').toLowerCase().includes(qNombre);
    const byDepto = !depto || (p.departamento || '') === depto;
    const bySede = !sede || (p.sede || '') === sede;
    const bySedeActual = !sedeClases || (p.sede_actual || '') === sedeClases;
    const byTaller = !talleres || (p.talleres || '') === talleres;

    return byNombre && byDepto && bySede && bySedeActual && byTaller;
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
    'search-sede',
    'search-sede-clases',
    'search-talleres-vra'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderRows(profesoresCache);
}

function abrirModal() {
  const modal = document.getElementById('modal-profesor');
  if (!modal) return;

  modal.classList.add('is-open');
}

function cerrarModal() {
  const modal = document.getElementById('modal-profesor');
  if (!modal) return;

  modal.classList.remove('is-open');
}

function resetFormUI() {
  const form = document.getElementById('profesor-form');
  const idInput = document.getElementById('id_profesor');
  const title = document.getElementById('form-title');

  if (form) form.reset();
  if (idInput) idInput.value = '';
  if (title) title.textContent = 'Agregar Profesor';
}

function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre ?? '';
  document.getElementById('departamento').value = profesor.departamento ?? '';
  document.getElementById('sede').value = profesor.sede ?? '';
  document.getElementById('sede_actual').value = profesor.sede_actual ?? '';
  document.getElementById('talleres').value = profesor.talleres ?? '';
  document.getElementById('formacion').checked = Number(profesor.formacion) === 1;
  document.getElementById('estado_I').checked = Number(profesor.estado_I) === 1;
  document.getElementById('magister').checked = Number(profesor.magister) === 1;
  document.getElementById('otro_i').value = profesor.otro_i ?? '';

  const title = document.getElementById('form-title');
  if (title) title.textContent = 'Editar Profesor';
}

function getFormData() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    departamento: document.getElementById('departamento').value.trim(),
    sede: document.getElementById('sede').value,
    sede_actual: document.getElementById('sede_actual').value,
    talleres: document.getElementById('talleres').value.trim(),
    formacion: document.getElementById('formacion').checked ? 1 : 0,
    estado_I: document.getElementById('estado_I').checked ? 1 : 0,
    magister: document.getElementById('magister').checked ? 1 : 0,
    otro_i: document.getElementById('otro_i').value.trim()
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