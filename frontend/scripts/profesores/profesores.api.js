function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

async function request(url, options = {}, defaultErrorMessage = 'Error en la solicitud') {
  const finalOptions = {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, finalOptions);

  if (handleUnauthorized(response)) return null;

  const result = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(result?.message || defaultErrorMessage);
  }

  return result;
}

/* =========================================================
   PROFESORES
========================================================= */

async function fetchProfesores(params = null) {
  let url = '/api/profesores';

  if (params) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        query.append(key, value);
      }
    });

    if (query.toString()) {
      url += `?${query.toString()}`;
    }
  }

  return await request(url, {}, 'Error al cargar profesores');
}

async function fetchProfesorById(id) {
  return await request(`/api/profesores/${id}`, {}, 'Error al cargar profesor');
}

async function createProfesor(data) {
  return await request(
    '/api/profesores',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al crear profesor'
  );
}

async function updateProfesor(id, data) {
  return await request(
    `/api/profesores/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al actualizar profesor'
  );
}

async function deleteProfesor(id) {
  return await request(
    `/api/profesores/${id}`,
    {
      method: 'DELETE'
    },
    'Error al eliminar profesor'
  );
}

/* =========================================================
   CATÁLOGO DE SEDES
========================================================= */

async function fetchCatalogoSedes(query = '') {
  const url = query
    ? `/api/profesores/catalogo-sedes?q=${encodeURIComponent(query)}`
    : '/api/profesores/catalogo-sedes';

  return await request(url, {}, 'Error al cargar catálogo de sedes');
}

/* =========================================================
   CATÁLOGO DE TALLERES
========================================================= */

async function fetchCatalogoTalleres(params = {}) {
  const query = new URLSearchParams();

  if (params.incluirInactivos) query.append('incluirInactivos', '1');
  if (params.q) query.append('q', params.q);

  const qs = query.toString();
  const url = qs
    ? `/api/profesores/catalogo-talleres?${qs}`
    : '/api/profesores/catalogo-talleres';

  return await request(url, {}, 'Error al cargar catálogo de talleres');
}

async function createCatalogoTaller(data) {
  return await request(
    '/api/profesores/catalogo-talleres',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al crear taller'
  );
}

async function updateCatalogoTaller(id, data) {
  return await request(
    `/api/profesores/catalogo-talleres/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al actualizar taller'
  );
}

async function deleteCatalogoTaller(id) {
  return await request(
    `/api/profesores/catalogo-talleres/${id}`,
    {
      method: 'DELETE'
    },
    'Error al eliminar taller'
  );
}

/* =========================================================
   CATÁLOGO DE FORMACIONES DOCENTES
========================================================= */

async function fetchCatalogoFormaciones(params = {}) {
  const query = new URLSearchParams();

  if (params.incluirInactivos) query.append('incluirInactivos', '1');
  if (params.q) query.append('q', params.q);
  if (params.tipo_formacion) query.append('tipo_formacion', params.tipo_formacion);

  const qs = query.toString();
  const url = qs
    ? `/api/profesores/catalogo-formaciones?${qs}`
    : '/api/profesores/catalogo-formaciones';

  return await request(url, {}, 'Error al cargar catálogo de formaciones');
}

async function createCatalogoFormacion(data) {
  return await request(
    '/api/profesores/catalogo-formaciones',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al crear formación'
  );
}

async function updateCatalogoFormacion(id, data) {
  return await request(
    `/api/profesores/catalogo-formaciones/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al actualizar formación'
  );
}

async function deleteCatalogoFormacion(id) {
  return await request(
    `/api/profesores/catalogo-formaciones/${id}`,
    {
      method: 'DELETE'
    },
    'Error al eliminar formación'
  );
}

/* =========================================================
   CATÁLOGO DE MAGÍSTER
========================================================= */

async function fetchCatalogoMagister(params = {}) {
  const query = new URLSearchParams();

  if (params.incluirInactivos) query.append('incluirInactivos', '1');
  if (params.q) query.append('q', params.q);

  const qs = query.toString();
  const url = qs
    ? `/api/profesores/catalogo-magister?${qs}`
    : '/api/profesores/catalogo-magister';

  return await request(url, {}, 'Error al cargar catálogo de magíster');
}

async function createCatalogoMagister(data) {
  return await request(
    '/api/profesores/catalogo-magister',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al crear magíster'
  );
}

async function updateCatalogoMagister(id, data) {
  return await request(
    `/api/profesores/catalogo-magister/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    },
    'Error al actualizar magíster'
  );
}

async function deleteCatalogoMagister(id) {
  return await request(
    `/api/profesores/catalogo-magister/${id}`,
    {
      method: 'DELETE'
    },
    'Error al eliminar magíster'
  );
}

/* =========================================================
   CARGA MASIVA CSV
========================================================= */

async function importarProfesoresCSV(file) {
  const formData = new FormData();
  formData.append('archivo', file);

  return await request(
    '/api/profesores/carga-masiva',
    {
      method: 'POST',
      body: formData
    },
    'Error al importar CSV'
  );
}