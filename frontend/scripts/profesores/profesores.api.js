function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

function handleUnauthorized(response) {
  if (response.status === 401) {
    alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
    window.location.href = '/login.html';
    return true;
  }
  return false;
}

async function fetchProfesores(params = null) {
  let url = '/api/profesores';
  if (params) {
    const query = new URLSearchParams(params);
    if (query.toString()) url += `?${query.toString()}`;
  }

  const response = await fetch(url, { headers: getAuthHeader() });
  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al cargar profesores');
  return await response.json();
}

async function fetchProfesorById(id) {
  const response = await fetch(`/api/profesores/${id}`, {
    headers: getAuthHeader()
  });
  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al cargar profesor');
  return await response.json();
}

async function createProfesor(data) {
  const response = await fetch('/api/profesores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al crear profesor');
  return await response.json().catch(() => null);
}

async function updateProfesor(id, data) {
  const response = await fetch(`/api/profesores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al actualizar profesor');
  return await response.json().catch(() => null);
}

async function deleteProfesor(id) {
  const response = await fetch(`/api/profesores/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al eliminar profesor');
  return true;
}

async function importarProfesoresCSV(file) {
  const formData = new FormData();
  formData.append('archivo', file);

  const response = await fetch('/api/profesores/carga-masiva', {
    method: 'POST',
    headers: {
      ...getAuthHeader()
    },
    body: formData
  });

  if (handleUnauthorized(response)) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Error al importar CSV');
  }

  return data;
}