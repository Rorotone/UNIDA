let profesoresCache = [];

function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    otro_i: p.Otro_I ?? p.Otro_i ?? p.otro_i ?? '',
  };
}

function setProfesoresCache(data) {
  profesoresCache = data.map(normalizeProfesor);
}

function getProfesoresCache() {
  return profesoresCache;
}

function renderRows(data) {
  const tbody = document.getElementById('profesores-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  data.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(p.nombre)}</td>
      <td>${escapeHTML(p.departamento)}</td>
      <td>${escapeHTML(p.sede)}</td>
      <td>${escapeHTML(p.sede_actual)}</td>
      <td>${escapeHTML(p.talleres)}</td>
      <td>${Number(p.formacion) === 1 ? 'Sí' : 'No'}</td>
      <td>${Number(p.estado_I) === 1 ? 'Sí' : 'No'}</td>
      <td>${Number(p.magister) === 1 ? 'Sí' : 'No'}</td>
      <td>${escapeHTML(p.otro_i || '')}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-secondary btn-sm" onclick="editarProfesor(${Number(p.id_profesor)})">Editar</button>
          <button class="btn-danger btn-sm" onclick="eliminarProfesor(${Number(p.id_profesor)})">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function uniqueValues(arr, key) {
  return [...new Set(arr.map(x => String(x?.[key] ?? '').trim()).filter(Boolean))].sort();
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
  const sedeCls = document.getElementById('search-sede-clases')?.value || '';
  const talleres = document.getElementById('search-talleres-vra')?.value || '';

  const filtrados = profesoresCache.filter(p => {
    const byNombre = !qNombre || (p.nombre || '').toLowerCase().includes(qNombre);
    const byDepto = !depto || (p.departamento || '') === depto;
    const bySede = !sede || (p.sede || '') === sede;
    const bySedeA = !sedeCls || (p.sede_actual || '') === sedeCls;
    const byTaller = !talleres || (p.talleres || '') === talleres;
    return byNombre && byDepto && bySede && bySedeA && byTaller;
  });

  renderRows(filtrados);
  actualizarFiltrosEnCascada(filtrados, { depto, sede, sedeCls, talleres });
}

function actualizarFiltrosEnCascada(filtrados, seleccionActual) {
  const selectDepto = document.getElementById('search-departamento');
  const selectSede = document.getElementById('search-sede');
  const selectSedeClases = document.getElementById('search-sede-clases');
  const selectTalleres = document.getElementById('search-talleres-vra');

  populateSelect(selectDepto, uniqueValues(filtrados, 'departamento'));
  populateSelect(selectSede, uniqueValues(filtrados, 'sede'));
  populateSelect(selectSedeClases, uniqueValues(filtrados, 'sede_actual'));
  populateSelect(selectTalleres, uniqueValues(filtrados, 'talleres'));

  if (selectDepto) selectDepto.value = seleccionActual.depto;
  if (selectSede) selectSede.value = seleccionActual.sede;
  if (selectSedeClases) selectSedeClases.value = seleccionActual.sedeCls;
  if (selectTalleres) selectTalleres.value = seleccionActual.talleres;
}

function toggleFiltros() {
  const container = document.getElementById('search-container');
  const btn = document.getElementById('toggle-filtros-btn');
  if (!container || !btn) return;

  const visible = !container.classList.contains('hidden');
  container.classList.toggle('hidden');
  btn.textContent = visible ? 'Filtrar' : 'Ocultar filtros';
}

function resetFiltros() {
  const nombre = document.getElementById('search-nombre');
  const departamento = document.getElementById('search-departamento');
  const sede = document.getElementById('search-sede');
  const sedeClases = document.getElementById('search-sede-clases');
  const talleres = document.getElementById('search-talleres-vra');

  if (nombre) nombre.value = '';
  if (departamento) departamento.value = '';
  if (sede) sede.value = '';
  if (sedeClases) sedeClases.value = '';
  if (talleres) talleres.value = '';

  renderRows(profesoresCache);
  renderFiltros();
}

function abrirModal() {
  const modal = document.getElementById('modal-profesor');
  if (modal) modal.style.display = 'block';
}

function cerrarModal() {
  const modal = document.getElementById('modal-profesor');
  if (modal) modal.style.display = 'none';
}

function resetFormUI() {
  const form = document.getElementById('profesor-form');
  if (form) form.reset();

  const id = document.getElementById('id_profesor');
  const title = document.getElementById('form-title');

  if (id) id.value = '';
  if (title) title.textContent = 'Agregar Profesor';
}

function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre;
  document.getElementById('departamento').value = profesor.departamento;
  document.getElementById('sede').value = profesor.sede;
  document.getElementById('sede_actual').value = profesor.sede_actual;
  document.getElementById('talleres').value = profesor.talleres;
  document.getElementById('formacion').checked = Number(profesor.formacion) === 1;
  document.getElementById('estado_I').checked = Number(profesor.estado_I) === 1;
  document.getElementById('magister').checked = Number(profesor.magister) === 1;
  document.getElementById('otro_i').value = profesor.otro_i;
  document.getElementById('form-title').textContent = 'Editar Profesor';
}

function getFormData() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    departamento: document.getElementById('departamento').value.trim(),
    sede: document.getElementById('sede').value.trim(),
    sede_actual: document.getElementById('sede_actual').value.trim(),
    talleres: document.getElementById('talleres').value.trim(),
    formacion: document.getElementById('formacion').checked ? 1 : 0,
    estado_I: document.getElementById('estado_I').checked ? 1 : 0,
    magister: document.getElementById('magister').checked ? 1 : 0,
    otro_i: document.getElementById('otro_i').value.trim(),
  };
}

function resetImportUI() {
  const input = document.getElementById('csv-file-input');
  const filename = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');

  if (input) input.value = '';
  if (filename) filename.textContent = 'Ningún archivo seleccionado';
  if (importBtn) importBtn.disabled = true;
}

function setImportLoading(isLoading) {
  const importBtn = document.getElementById('import-csv-btn');
  const selectBtn = document.getElementById('select-csv-btn');
  const input = document.getElementById('csv-file-input');

  if (importBtn) {
    importBtn.disabled = isLoading || !(input?.files?.length);
    importBtn.textContent = isLoading ? 'Importando...' : 'Importar CSV';
  }

  if (selectBtn) {
    selectBtn.disabled = isLoading;
  }

  if (input) {
    input.disabled = isLoading;
  }
}

function updateSelectedCSVName(file) {
  const filename = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');

  if (filename) {
    filename.textContent = file ? file.name : 'Ningún archivo seleccionado';
  }

  if (importBtn) {
    importBtn.disabled = !file;
  }
}