document.addEventListener("DOMContentLoaded", () => {
  initInvestigaciones();
});

let investigacionesCache = [];

async function initInvestigaciones() {
  bindEventosBase();
  await cargarSelects();
  await recargarInvestigaciones();
}

function bindEventosBase() {
  document.getElementById("btn-abrir-modal-investigacion")?.addEventListener("click", () => {
    InvestigacionesUI.resetFormulario();
    InvestigacionesUI.abrirModal();
  });

  document.getElementById("cerrar-modal-investigacion")?.addEventListener("click", InvestigacionesUI.cerrarModal);
  document.getElementById("btn-cancelar-modal-investigacion")?.addEventListener("click", InvestigacionesUI.cerrarModal);

  document.getElementById("modal-investigacion")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-investigacion") {
      InvestigacionesUI.cerrarModal();
    }
  });

  document.getElementById("crear-investigacion-form")?.addEventListener("submit", handleSubmitInvestigacion);
  document.getElementById("aplicar-filtros")?.addEventListener("click", aplicarFiltros);
  document.getElementById("limpiar-filtros")?.addEventListener("click", () => {
    InvestigacionesUI.limpiarFiltros();
    InvestigacionesUI.renderTabla(investigacionesCache, editarInvestigacion, eliminarInvestigacion);
  });
}

async function cargarSelects() {
  try {
    const [profesores, mentores] = await Promise.all([
      InvestigacionesAPI.obtenerProfesores(),
      InvestigacionesAPI.obtenerMentores()
    ]);

    InvestigacionesUI.poblarSelect(
      "profesor-select",
      Array.isArray(profesores) ? profesores : [],
      "id_profesor",
      "nombre",
      "Seleccione un profesor"
    );

    InvestigacionesUI.poblarSelect(
      "mentor-select",
      Array.isArray(mentores) ? mentores : [],
      "id",
      "username",
      "Seleccione un mentor"
    );
  } catch (error) {
    console.error("Error al cargar profesores/mentores:", error);
    alert(error.message || "No se pudieron cargar profesores y mentores.");
  }
}

async function recargarInvestigaciones() {
  try {
    const data = await InvestigacionesAPI.obtenerInvestigaciones();
    investigacionesCache = normalizarInvestigaciones(Array.isArray(data) ? data : []);
    InvestigacionesUI.renderTabla(investigacionesCache, editarInvestigacion, eliminarInvestigacion);
  } catch (error) {
    console.error("Error al cargar investigaciones:", error);
    alert(error.message || "No se pudieron cargar las investigaciones.");
  }
}

function normalizarInvestigaciones(data) {
  return data.map((item) => ({
    ...item,
    archivo_url: resolverUrlArchivo(item)
  }));
}

function resolverUrlArchivo(item) {
  // La tabla SQL usa archivo_ruta y archivo_nombre. Si archivo_ruta viene como /uploads/archivo.pdf,
  // esto debe abrirse sin autorización SOLO si Express expone /uploads como estático público.
  if (item.archivo_ruta) return item.archivo_ruta;
  if (item.archivo) return item.archivo;
  return "";
}

function aplicarFiltros() {
  const filtros = InvestigacionesUI.obtenerFiltros();

  const filtradas = investigacionesCache.filter((item) => {
    const titulo = String(item.titulo || "").toLowerCase();
    const area = String(item.area || "").toLowerCase();
    const profesor = String(item.profesor || item.profesor_nombre || "").toLowerCase();
    const mentor = String(item.mentor || item.username || item.mentor_nombre || "").toLowerCase();

    return (
      titulo.includes(filtros.titulo) &&
      area.includes(filtros.area) &&
      profesor.includes(filtros.profesor) &&
      mentor.includes(filtros.mentor)
    );
  });

  InvestigacionesUI.renderTabla(filtradas, editarInvestigacion, eliminarInvestigacion);
}

async function handleSubmitInvestigacion(e) {
  e.preventDefault();

  const id = document.getElementById("investigacion-id")?.value || "";
  const formData = InvestigacionesUI.obtenerFormData();
  if (!formData) return;

  try {
    if (id) {
      await InvestigacionesAPI.actualizarInvestigacion(id, formData);
      alert("Investigación actualizada correctamente.");
    } else {
      await InvestigacionesAPI.crearInvestigacion(formData);
      alert("Investigación creada correctamente.");
    }

    InvestigacionesUI.resetFormulario();
    InvestigacionesUI.cerrarModal();
    await recargarInvestigaciones();
  } catch (error) {
    console.error("Error al guardar investigación:", error);
    alert(error.message || "No se pudo guardar la investigación.");
  }
}

function editarInvestigacion(item) {
  InvestigacionesUI.setModoEdicion(item);
  InvestigacionesUI.abrirModal();
}

async function eliminarInvestigacion(item) {
  const id = item.id || item.id_investigacion;
  if (!id) return;

  const confirmar = confirm(`¿Deseas eliminar la investigación "${item.titulo || ""}"?`);
  if (!confirmar) return;

  try {
    await InvestigacionesAPI.eliminarInvestigacion(id);
    await recargarInvestigaciones();
  } catch (error) {
    console.error("Error al eliminar investigación:", error);
    alert(error.message || "No se pudo eliminar la investigación.");
  }
}
