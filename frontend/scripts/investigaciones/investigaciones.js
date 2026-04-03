
document.addEventListener("DOMContentLoaded", () => {
  initInvestigaciones();
});

let investigacionesCache = [];
let investigacionEditandoId = null;

async function initInvestigaciones() {
  bindEventos();
  await cargarSelects();
  await cargarInvestigaciones();
}

function bindEventos() {
  document
    .getElementById("crear-investigacion-form")
    ?.addEventListener("submit", handleSubmitInvestigacion);

  document
    .getElementById("aplicar-filtros")
    ?.addEventListener("click", renderFiltradas);

  document
    .getElementById("limpiar-filtros")
    ?.addEventListener("click", () => {
      InvestigacionesUI.limpiarFiltros();
      InvestigacionesUI.renderTabla(investigacionesCache);
    });

  document
    .getElementById("tabla-investigaciones")
    ?.addEventListener("click", handleClickTabla);
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

    // Mentor = users(id, username)
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

async function cargarInvestigaciones() {
  try {
    const data = await InvestigacionesAPI.obtenerInvestigaciones();
    investigacionesCache = Array.isArray(data) ? data : [];
    InvestigacionesUI.renderTabla(investigacionesCache);
  } catch (error) {
    console.error("Error al cargar investigaciones:", error);
    alert(error.message || "No se pudieron cargar las investigaciones.");
  }
}

function renderFiltradas() {
  const filtradas = InvestigacionesUI.aplicarFiltros(investigacionesCache);
  InvestigacionesUI.renderTabla(filtradas);
}

async function handleSubmitInvestigacion(e) {
  e.preventDefault();

  try {
    const formData = InvestigacionesUI.obtenerFormData();
    if (!formData) return;

    if (investigacionEditandoId) {
      await InvestigacionesAPI.actualizarInvestigacion(investigacionEditandoId, formData);
      alert("Investigación actualizada exitosamente.");
    } else {
      await InvestigacionesAPI.crearInvestigacion(formData);
      alert("Investigación creada exitosamente.");
    }

    investigacionEditandoId = null;
    InvestigacionesUI.limpiarFormulario();
    await cargarInvestigaciones();
  } catch (error) {
    console.error("Error al guardar investigación:", error);
    alert(error.message || "No se pudo guardar la investigación.");
  }
}

async function handleClickTabla(e) {
  const btnEliminar = e.target.closest(".btn-eliminar");
  const btnEditar = e.target.closest(".btn-editar");

  if (btnEliminar) {
    const id = btnEliminar.dataset.id;
    if (!id) return;

    const confirmar = confirm("¿Deseas eliminar esta investigación?");
    if (!confirmar) return;

    try {
      await InvestigacionesAPI.eliminarInvestigacion(id);
      await cargarInvestigaciones();
    } catch (error) {
      console.error("Error al eliminar investigación:", error);
      alert(error.message || "No se pudo eliminar la investigación.");
    }
    return;
  }

  if (btnEditar) {
    const id = btnEditar.dataset.id;
    if (!id) return;

    try {
      const data = await InvestigacionesAPI.obtenerInvestigacionPorId(id);
      investigacionEditandoId = id;
      InvestigacionesUI.llenarFormulario(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error al cargar investigación para edición:", error);
      alert(error.message || "No se pudo cargar la investigación.");
    }
  }
}
