let profesoresCache = [];

function normalizeProfesor(p) {
  return {
    ...p,
    sede: p.Sede ?? p.sede ?? '',
    sede_actual: p.Sede_actual ?? p.sede_actual ?? '',
    talleres: p.Talleres ?? p.talleres ?? '',
    formacion: p.Formacion ?? p.formacion ?? 0,
    estado_I: p.Estado_I ?? p.estado_I ?? 0,
    magister: p.Magister ?? p.magister ?? 0,
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
  tbody.innerHTML = '';

  data.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.departamento}</td>
      <td>${p.sede}</td>
      <td>${p.sede_actual}</td>
      <td>${p.talleres}</td>
      <td>${p.formacion === 1 ? 'Sí' : 'No'}</td>
      <td>${p.estado_I === 1 ? 'Sí' : 'No'}</td>
      <td>${p.magister === 1 ? 'Sí' : 'No'}</td>
      <td>${p.otro_i || ''}</td>
      <td>
        <button onclick="editarProfesor(${p.id_profesor})">Editar</button>
        <button onclick="eliminarProfesor(${p.id_profesor})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function uniqueValues(arr, key) {
  return [...new Set(arr.map(x => (x?.[key] ?? '').trim()).filter(Boolean))].sort();
}

function populateSelect(selectEl, values) {
  selectEl.innerHTML =
    `<option value="">Todos</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
}

function renderFiltros() {
  populateSelect(document.getElementById('search-departamento'), uniqueValues(profesoresCache, 'departamento'));
  populateSelect(document.getElementById('search-sede'), uniqueValues(profesoresCache, 'sede'));
  populateSelect(document.getElementById('search-sede-clases'), uniqueValues(profesoresCache, 'sede_actual'));
  populateSelect(document.getElementById('search-talleres-vra'), uniqueValues(profesoresCache, 'talleres'));
}

function applyFilters() {
  const qNombre = document.getElementById('search-nombre')?.value.toLowerCase() || '';
  const depto = document.getElementById('search-departamento').value;
  const sede = document.getElementById('search-sede').value;
  const sedeCls = document.getElementById('search-sede-clases').value;
  const talleres = document.getElementById('search-talleres-vra').value;

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

  // Restaurar la selección actual si el valor todavía existe
  selectDepto.value = seleccionActual.depto;
  selectSede.value = seleccionActual.sede;
  selectSedeClases.value = seleccionActual.sedeCls;
  selectTalleres.value = seleccionActual.talleres;
}

function resetFiltros() {
  document.getElementById('search-nombre').value = '';
  document.getElementById('search-departamento').value = '';
  document.getElementById('search-sede').value = '';
  document.getElementById('search-sede-clases').value = '';
  document.getElementById('search-talleres-vra').value = '';
  renderRows(profesoresCache);
  renderFiltros();
}

function abrirModal() {
  document.getElementById('modal-profesor').style.display = 'block';
}

function cerrarModal() {
  document.getElementById('modal-profesor').style.display = 'none';
}

function resetFormUI() {
  document.getElementById('profesor-form').reset();
  document.getElementById('id_profesor').value = '';
  document.getElementById('form-title').textContent = 'Agregar Profesor';
}

function fillForm(profesor) {
  document.getElementById('id_profesor').value = profesor.id_profesor;
  document.getElementById('nombre').value = profesor.nombre;
  document.getElementById('departamento').value = profesor.departamento;
  document.getElementById('sede').value = profesor.sede;
  document.getElementById('sede_actual').value = profesor.sede_actual;
  document.getElementById('talleres').value = profesor.talleres;
  document.getElementById('formacion').checked = profesor.formacion === 1;
  document.getElementById('estado_I').checked = profesor.estado_I === 1;
  document.getElementById('magister').checked = profesor.magister === 1;
  document.getElementById('otro_i').value = profesor.otro_i;
  document.getElementById('form-title').textContent = 'Editar Profesor';
}

function getFormData() {
  return {
    nombre: document.getElementById('nombre').value,
    departamento: document.getElementById('departamento').value,
    sede: document.getElementById('sede').value,
    sede_actual: document.getElementById('sede_actual').value,
    talleres: document.getElementById('talleres').value,
    formacion: document.getElementById('formacion').checked ? 1 : 0,
    estado_I: document.getElementById('estado_I').checked ? 1 : 0,
    magister: document.getElementById('magister').checked ? 1 : 0,
    otro_i: document.getElementById('otro_i').value,
  };
}