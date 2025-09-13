document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-profesor');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('profesor-form');

    openBtn.onclick = () => { modal.style.display = 'block'; };
    closeBtn.onclick = () => { modal.style.display = 'none'; };

    window.onclick = function(event) {
        if (event.target == modal) modal.style.display = 'none';
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape") modal.style.display = 'none';
    });

    form.addEventListener('submit', function(e) {
        // Aquí puedes agregar tu lógica de guardado
        modal.style.display = 'none';
    });
});

// Filtros
let profesoresCache = [];

function renderRows(data) {
  const tbody = document.getElementById('profesores-body');
  tbody.innerHTML = '';
  data.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.departamento}</td>
      <td>${p.Sede || ''}</td>
      <td>${p.Sede_actual || ''}</td>
      <td>${p.Talleres || ''}</td>
      <td>${p.Formacion === 1 ? 'Sí' : 'No'}</td>
      <td>${p.Estado_I === 1 ? 'Sí' : 'No'}</td>
      <td>${p.Magister === 1 ? 'Sí' : 'No'}</td>
      <td>${p.Otro_i || ''}</td>
      <td>
        <button onclick="editarProfesor(${p.id_profesor})">Editar</button>
        <button onclick="eliminarProfesor(${p.id_profesor})">Eliminar</button>
      </td>`;
    tbody.appendChild(row);
  });
}

function uniqueValues(arr, key) {
  return [...new Set(arr.map(x => (x?.[key] ?? '').trim()).filter(Boolean))].sort();
}

function populateSelect(selectEl, values) {
  selectEl.innerHTML = `<option value="">Todos</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
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
    const bySede = !sede || (p.Sede || '') === sede;
    const bySedeA = !sedeCls || (p.Sede_actual || '') === sedeCls;
    const byTaller = !talleres || (p.Talleres || '') === talleres;
    return byNombre && byDepto && bySede && bySedeA && byTaller;
  });

  renderRows(filtrados);
}

async function cargarProfesores() {
  try {
    const res = await fetch('/api/profesores', { headers: getAuthHeader() });
    if (!res.ok) throw new Error(res.status);
    profesoresCache = await res.json();

    renderRows(profesoresCache);

    // Llenar selects
    populateSelect(document.getElementById('search-departamento'), uniqueValues(profesoresCache, 'departamento'));
    populateSelect(document.getElementById('search-sede'), uniqueValues(profesoresCache, 'Sede'));
    populateSelect(document.getElementById('search-sede-clases'), uniqueValues(profesoresCache, 'Sede_actual'));
    populateSelect(document.getElementById('search-talleres-vra'), uniqueValues(profesoresCache, 'Talleres'));

    // Eventos
    document.getElementById('search-nombre').addEventListener('input', applyFilters);
    document.getElementById('search-departamento').addEventListener('change', applyFilters);
    document.getElementById('search-sede').addEventListener('change', applyFilters);
    document.getElementById('search-sede-clases').addEventListener('change', applyFilters);
    document.getElementById('search-talleres-vra').addEventListener('change', applyFilters);
    document.getElementById('search-btn').addEventListener('click', applyFilters);

  } catch (e) {
    console.error('Error al cargar profesores:', e);
    alert('Error al cargar los profesores.');
  }
}

