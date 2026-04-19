function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

function handleUnauthorized(response) {
  if (response.status === 401) {
    if (typeof showAppAlert === 'function') {
      showAppAlert('Sesión expirada. Por favor, inicia sesión nuevamente.', 'warning', {
        title: 'Sesión finalizada',
        duration: 1800
      });
    }

    localStorage.removeItem('token');

    window.setTimeout(() => {
      window.location.href = '/login.html';
    }, 900);

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

  const response = await fetch(url, {
    headers: getAuthHeader()
  });

  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al cargar profesores');

  return await response.json();
}

async function fetchCatalogoTalleres() {
  const response = await fetch('/api/profesores/catalogo-talleres', {
    headers: getAuthHeader()
  });

  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al cargar catálogo de talleres');

  return await response.json();
}

async function fetchCatalogoSedes(query = '') {
  const url = query
    ? `/api/profesores/catalogo-sedes?q=${encodeURIComponent(query)}`
    : '/api/profesores/catalogo-sedes';

  const response = await fetch(url, {
    headers: getAuthHeader()
  });

  if (handleUnauthorized(response)) return null;
  if (!response.ok) throw new Error('Error al cargar catálogo de sedes');

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

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al crear profesor');
  }

  return result;
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

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al actualizar profesor');
  }

  return result;
}

async function deleteProfesor(id) {
  const response = await fetch(`/api/profesores/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });

  if (handleUnauthorized(response)) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al eliminar profesor');
  }

  return result;
}

async function createCatalogoTaller(data) {
  const response = await fetch('/api/profesores/catalogo-talleres', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });

  if (handleUnauthorized(response)) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al crear taller');
  }

  return result;
}

async function updateCatalogoTaller(id, data) {
  const response = await fetch(`/api/profesores/catalogo-talleres/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });

  if (handleUnauthorized(response)) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al actualizar taller');
  }

  return result;
}

async function deleteCatalogoTaller(id) {
  const response = await fetch(`/api/profesores/catalogo-talleres/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });

  if (handleUnauthorized(response)) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || 'Error al eliminar taller');
  }

  return result;
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

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || 'Error al importar CSV');
  }

  return result;
}
