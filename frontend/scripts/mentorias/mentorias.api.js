const MentoriasAPI = (() => {
  const BASE_URL = "/api/mentorias";
  const MENTORES_URL = "/api/mentores";
  const PROFESORES_URL = "/api/profesores";

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options
    });

    if (response.status === 401) {
      alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
      window.location.href = "/login.html";
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

  async function obtenerMentorias() {
    return request(BASE_URL);
  }

  async function crearMentoria(data) {
    return request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  async function eliminarMentoria(idMentoria) {
    return request(`${BASE_URL}/${idMentoria}`, {
      method: "DELETE"
    });
  }

  async function completarMentoria(idMentoria) {
    return request(`${BASE_URL}/${idMentoria}/completar`, {
      method: "PATCH"
    });
  }

  async function obtenerTareas(idMentoria) {
    return request(`${BASE_URL}/${idMentoria}/tareas`);
  }

  async function crearTarea(idMentoria, data) {
    return request(`${BASE_URL}/${idMentoria}/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  async function actualizarEstadoTarea(idMentoria, idTarea, completada) {
    return request(`${BASE_URL}/${idMentoria}/tareas/${idTarea}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completada })
    });
  }

  async function eliminarTarea(idMentoria, idTarea) {
    return request(`${BASE_URL}/${idMentoria}/tareas/${idTarea}`, {
      method: "DELETE"
    });
  }

  async function marcarTodasTareas(idMentoria, completada) {
    return request(`${BASE_URL}/${idMentoria}/tareas/marcar-todas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completada })
    });
  }

  async function obtenerMentores() {
    return request(MENTORES_URL);
  }

  async function obtenerProfesores() {
    return request(PROFESORES_URL);
  }

  return {
    obtenerMentorias,
    crearMentoria,
    eliminarMentoria,
    completarMentoria,
    obtenerTareas,
    crearTarea,
    actualizarEstadoTarea,
    eliminarTarea,
    marcarTodasTareas,
    obtenerMentores,
    obtenerProfesores
  };
})();