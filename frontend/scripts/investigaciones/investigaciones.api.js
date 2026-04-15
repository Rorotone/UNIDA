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
    if (typeof showAppAlert === "function") {
      showAppAlert("Sesión expirada. Por favor, inicia sesión nuevamente.", "warning", {
        title: "Sesión finalizada",
        duration: 1800
      });
    }

    localStorage.removeItem("token");

    window.setTimeout(() => {
      window.location.href = "/login.html";
    }, 900);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: getAuthHeaders(options.headers || {})
    });

    if (response.status === 401 || response.status === 403) {
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

  async function eliminarArchivoInvestigacion(idArchivo) {
    return request(`${BASE_URL}/archivos/${idArchivo}`, {
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
    eliminarArchivoInvestigacion,
    obtenerProfesores,
    obtenerMentores
  };
})();