document.addEventListener("DOMContentLoaded", () => {
  initInvestigaciones();
});

let investigacionesCache = [];
let investigacionEditandoId = null;

async function initInvestigaciones() {
  bindEventos();
  InvestigacionesUI.renderArchivosSeleccionados();
  await cargarSelects();
  await cargarInvestigaciones();
}

function bindEventos() {
  document.getElementById("btn-nueva-investigacion")?.addEventListener("click", () => {
    investigacionEditandoId = null;
    InvestigacionesUI.limpiarFormulario();
    InvestigacionesUI.abrirModal();
  });

  document.getElementById("cerrar-modal-investigacion")?.addEventListener("click", InvestigacionesUI.cerrarModal);
  document.getElementById("btn-cancelar-modal-investigacion")?.addEventListener("click", InvestigacionesUI.cerrarModal);

  document.getElementById("modal-investigacion")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-investigacion") {
      InvestigacionesUI.cerrarModal();
    }
  });

  document.getElementById("cerrar-modal-archivos")?.addEventListener("click", InvestigacionesUI.cerrarModalArchivos);
  document.getElementById("modal-archivos-investigacion")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-archivos-investigacion") {
      InvestigacionesUI.cerrarModalArchivos();
    }
  });

  document.getElementById("btn-seleccionar-archivos")?.addEventListener("click", () => {
    document.getElementById("archivos")?.click();
  });

  document.getElementById("archivos")?.addEventListener("change", (e) => {
    InvestigacionesUI.agregarArchivosSeleccionados(e.target.files);
    e.target.value = "";
  });

  document.getElementById("lista-archivos-seleccionados")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove-file");
    if (!btn) return;
    InvestigacionesUI.eliminarArchivoTemporal(Number(btn.dataset.index));
  });

  document.getElementById("crear-investigacion-form")?.addEventListener("submit", handleSubmitInvestigacion);
  document.getElementById("aplicar-filtros")?.addEventListener("click", renderFiltradas);
  document.getElementById("limpiar-filtros")?.addEventListener("click", () => {
    InvestigacionesUI.limpiarFiltros();
    InvestigacionesUI.renderTabla(investigacionesCache);
  });

  document.getElementById("tabla-investigaciones")?.addEventListener("click", handleClickTabla);
  document.getElementById("lista-archivos-investigacion")?.addEventListener("click", handleClickModalArchivos);
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
      "nombre",
      "Seleccione un mentor"
    );
  } catch (error) {
    console.error("Error al cargar profesores/mentores:", error);
    showAppAlert(error.message || "No se pudieron cargar profesores y mentores.", "error", {
      title: "Error de carga"
    });
  }
}

async function cargarInvestigaciones() {
  try {
    const data = await InvestigacionesAPI.obtenerInvestigaciones();
    investigacionesCache = Array.isArray(data) ? data : [];
    InvestigacionesUI.renderTabla(investigacionesCache);
  } catch (error) {
    console.error("Error al cargar investigaciones:", error);
    showAppAlert(error.message || "No se pudieron cargar las investigaciones.", "error", {
      title: "Error de carga"
    });
  }
}

function renderFiltradas() {
  const filtradas = InvestigacionesUI.aplicarFiltros(investigacionesCache);
  InvestigacionesUI.renderTabla(filtradas);
}

async function handleSubmitInvestigacion(e) {
  e.preventDefault();

  try {
    const formData = InvestigacionesUI.construirFormData();
    if (!formData) return;

    if (investigacionEditandoId) {
      await InvestigacionesAPI.actualizarInvestigacion(investigacionEditandoId, formData);
      showAppAlert("Investigación actualizada exitosamente.", "success", {
        title: "Cambios guardados"
      });
    } else {
      await InvestigacionesAPI.crearInvestigacion(formData);
      showAppAlert("Investigación creada exitosamente.", "success", {
        title: "Registro creado"
      });
    }

    investigacionEditandoId = null;
    InvestigacionesUI.limpiarFormulario();
    InvestigacionesUI.cerrarModal();
    await cargarInvestigaciones();
  } catch (error) {
    console.error("Error al guardar investigación:", error);
    showAppAlert(error.message || "No se pudo guardar la investigación.", "error", {
      title: "Error al guardar"
    });
  }
}

async function handleClickTabla(e) {
  const btnEliminar = e.target.closest(".btn-eliminar");
  const btnEditar = e.target.closest(".btn-editar");
  const btnVerArchivos = e.target.closest(".btn-ver-archivos");

  if (btnVerArchivos) {
    const id = btnVerArchivos.dataset.id;
    const investigacion = investigacionesCache.find((item) => String(item.id) === String(id));
    if (!investigacion) return;

    InvestigacionesUI.renderModalArchivos(investigacion);
    InvestigacionesUI.abrirModalArchivos();
    return;
  }

  if (btnEliminar) {
    const id = btnEliminar.dataset.id;
    if (!id) return;

    const confirmar = await showAppConfirm({
  title: "Eliminar investigación",
  message: "¿Deseas eliminar esta investigación? Esta acción no se puede deshacer.",
  confirmText: "Eliminar",
  cancelText: "Cancelar",
  danger: true
});
if (!confirmar) return;
    try {
      await InvestigacionesAPI.eliminarInvestigacion(id);
      showAppAlert("Investigación eliminada correctamente.", "success", {
        title: "Registro eliminado"
      });
      await cargarInvestigaciones();
    } catch (error) {
      console.error("Error al eliminar investigación:", error);
      showAppAlert(error.message || "No se pudo eliminar la investigación.", "error", {
        title: "Error al eliminar"
      });
    }
    return;
  }

  if (btnEditar) {
    const id = btnEditar.dataset.id;
    if (!id) return;

    try {
      const data = await InvestigacionesAPI.obtenerInvestigacionPorId(id);
      investigacionEditandoId = id;
      InvestigacionesUI.limpiarFormulario();
      InvestigacionesUI.llenarFormulario(data);
      InvestigacionesUI.mostrarModoEdicion(id);
      InvestigacionesUI.abrirModal();
    } catch (error) {
      console.error("Error al cargar investigación para edición:", error);
      showAppAlert(error.message || "No se pudo cargar la investigación.", "error", {
        title: "Error al editar"
      });
    }
  }
}

async function handleClickModalArchivos(e) {
  const btnEliminarArchivo = e.target.closest(".btn-eliminar-archivo-modal");
  if (!btnEliminarArchivo) return;

  const idArchivo = btnEliminarArchivo.dataset.id;
  if (!idArchivo) return;

const confirmar = await showAppConfirm({
  title: "Eliminar archivo",
  message: "¿Deseas eliminar este archivo de la investigación? Esta acción no se puede deshacer.",
  confirmText: "Eliminar",
  cancelText: "Cancelar",
  danger: true
});
if (!confirmar) return;

  try {
    await InvestigacionesAPI.eliminarArchivoInvestigacion(idArchivo);
    showAppAlert("Archivo eliminado correctamente.", "success", {
      title: "Archivo eliminado"
    });
    await cargarInvestigaciones();
    InvestigacionesUI.cerrarModalArchivos();
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    showAppAlert(error.message || "No se pudo eliminar el archivo.", "error", {
      title: "Error al eliminar"
    });
  }
}