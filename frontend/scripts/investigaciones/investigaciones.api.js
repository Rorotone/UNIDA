
const InvestigacionesAPI = (() => {
  const BASE_URL = "/api/investigaciones";
  const PROFESORES_URL = "/api/profesores";
  const MENTORES_URL = "/api/mentores";

  function getAuthHeaders(extraHeaders = {}) {
    const token = localStorage.getItem("token");
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders
    };
  }

  function manejarNoAutorizado() {
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: getAuthHeaders(options.headers || {})
    });

    if (response.status === 401) {
      manejarNoAutorizado();
      throw new Error("No autorizado");
    }

    if (!response.ok) {
      let message = "Error en la solicitud";
      try {
        const data = await response.json();
        message = data.message || message;
      } catch (_) {}
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response;
  }

  async function obtenerInvestigaciones() {
    return request(BASE_URL);
  }

  async function obtenerInvestigacionPorId(id) {
    return request(`${BASE_URL}/${id}`);
  }

  async function crearInvestigacion(formData) {
    return request(BASE_URL, {
      method: "POST",
      body: formData
    });
  }

  async function actualizarInvestigacion(id, formData) {
    return request(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: formData
    });
  }

  async function eliminarInvestigacion(id) {
    return request(`${BASE_URL}/${id}`, {
      method: "DELETE"
    });
  }

  async function obtenerProfesores() {
    return request(PROFESORES_URL);
  }

  async function obtenerMentores() {
    return request(MENTORES_URL);
  }

  return {
    obtenerInvestigaciones,
    obtenerInvestigacionPorId,
    crearInvestigacion,
    actualizarInvestigacion,
    eliminarInvestigacion,
    obtenerProfesores,
    obtenerMentores
  };
})();
