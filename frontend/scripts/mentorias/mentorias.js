document.addEventListener("DOMContentLoaded", () => {
  initMentorias();
});

let mentoriasCache = [];
let mostrandoTodas = false;

async function initMentorias() {
  bindEventosBase();
  MentoriasUI.renderCalendarioSemanal(aplicarFiltroCalendario);
  await cargarSelects();
  await recargarMentorias();
}

function bindEventosBase() {
  document
    .getElementById("btn-ver-todas")
    ?.addEventListener("click", () => {
      mostrandoTodas = !mostrandoTodas;
      MentoriasUI.toggleBtnVerTodas(mostrandoTodas);

      if (mostrandoTodas) {
        MentoriasUI.renderMentorias(mentoriasCache);
      } else {
        aplicarFiltroCalendario(MentoriasUI.obtenerFechaSeleccionada());
      }
    });

  document
    .getElementById("btn-abrir-modal-mentoria")
    ?.addEventListener("click", MentoriasUI.abrirModal);

  document
    .getElementById("cerrar-modal-mentoria")
    ?.addEventListener("click", MentoriasUI.cerrarModal);

  document
    .getElementById("btn-cancelar-modal-mentoria")
    ?.addEventListener("click", MentoriasUI.cerrarModal);

  document
    .getElementById("modal-mentoria")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "modal-mentoria") {
        MentoriasUI.cerrarModal();
      }
    });

  document
    .getElementById("crear-mentoria-form")
    ?.addEventListener("submit", handleCrearMentoria);

  document
    .getElementById("lista-mentorias")
    ?.addEventListener("click", handleClickListaMentorias);

  document
    .getElementById("lista-mentorias")
    ?.addEventListener("submit", handleSubmitTarea);

  document
    .getElementById("lista-mentorias")
    ?.addEventListener("change", handleChangeListaMentorias);
}

async function cargarSelects() {
  try {
    const [mentores, profesores] = await Promise.all([
      MentoriasAPI.obtenerMentores(),
      MentoriasAPI.obtenerProfesores()
    ]);

    MentoriasUI.poblarSelect(
      "mentor-select",
      Array.isArray(mentores) ? mentores : [],
      "id",
      "nombre",
      "Seleccione un mentor"
    );

    MentoriasUI.poblarSelect(
      "profesor-select",
      Array.isArray(profesores) ? profesores : [],
      "id_profesor",
      "nombre",
      "Seleccione un profesor"
    );
  } catch (error) {
    console.error("Error al cargar mentores/profesores:", error);
    showAppAlert(error.message || "No se pudieron cargar mentores y profesores.", "error", {
      title: "Error de carga"
    });
  }
}

async function recargarMentorias() {
  try {
    const tareasAbiertas = new Map();

    document.querySelectorAll(".mentoria-card").forEach((card) => {
      if (MentoriasUI.estaTareasVisible(card)) {
        tareasAbiertas.set(card.dataset.mentoriaId, true);
      }
    });

    const mentorias = await MentoriasAPI.obtenerMentorias();
    mentoriasCache = Array.isArray(mentorias) ? mentorias : [];
    aplicarFiltroCalendario(MentoriasUI.obtenerFechaSeleccionada());

    if (tareasAbiertas.size > 0) {
      const promesas = [];

      document.querySelectorAll(".mentoria-card").forEach((card) => {
        const idMentoria = card.dataset.mentoriaId;
        if (tareasAbiertas.has(idMentoria)) {
          promesas.push(recargarTareas(card, idMentoria));
        }
      });

      await Promise.all(promesas);
    }
  } catch (error) {
    console.error("Error al cargar mentorías:", error);
    showAppAlert(error.message || "No se pudieron cargar las mentorías.", "error", {
      title: "Error de carga"
    });
  }
}

function aplicarFiltroCalendario(fechaSeleccionada) {
  mostrandoTodas = false;
  MentoriasUI.toggleBtnVerTodas(false);

  const filtradas = MentoriasUI.filtrarTareasPorFecha(
    mentoriasCache,
    fechaSeleccionada
  );

  MentoriasUI.renderMentorias(filtradas);
}

async function recargarTareas(card, idMentoria) {
  try {
    const tareas = await MentoriasAPI.obtenerTareas(idMentoria);
    MentoriasUI.renderTareas(card, Array.isArray(tareas) ? tareas : []);
    MentoriasUI.toggleTareas(card, true);
  } catch (error) {
    console.error("Error al cargar tareas:", error);
    showAppAlert(error.message || "No se pudieron cargar las tareas.", "error", {
      title: "Error de carga"
    });
  }
}

async function handleCrearMentoria(e) {
  e.preventDefault();

  const data = MentoriasUI.obtenerDatosMentoria();

  if (
    !data.titulo ||
    !data.id_mentor ||
    !data.id_profesor ||
    !data.fecha_inicio ||
    !data.fecha_termino
  ) {
    showAppAlert("Completa todos los campos de la mentoría.", "warning", {
      title: "Formulario incompleto"
    });
    return;
  }

  if (data.fecha_termino <= data.fecha_inicio) {
    showAppAlert("La fecha de término debe ser posterior a la fecha de inicio.", "warning", {
      title: "Validación de fechas"
    });
    return;
  }

  try {
    await MentoriasAPI.crearMentoria(data);
    MentoriasUI.limpiarFormularioMentoria();
    MentoriasUI.cerrarModal();
    await recargarMentorias();

    showAppAlert("Mentoría creada correctamente.", "success", {
      title: "Registro creado"
    });
  } catch (error) {
    console.error("Error al crear mentoría:", error);
    showAppAlert(error.message || "No se pudo crear la mentoría.", "error", {
      title: "Error al crear"
    });
  }
}

async function handleClickListaMentorias(e) {
  const card = e.target.closest(".mentoria-card");
  if (!card) return;

  const idMentoria = card.dataset.mentoriaId;
  if (!idMentoria) return;

  if (e.target.closest(".btn-eliminar")) {
    const confirmar = await showAppConfirm({
      title: "Eliminar mentoría",
      message: "¿Deseas eliminar esta mentoría? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      danger: true
    });

    if (!confirmar) return;

    try {
      await MentoriasAPI.eliminarMentoria(idMentoria);
      await recargarMentorias();

      showAppAlert("Mentoría eliminada correctamente.", "success", {
        title: "Registro eliminado"
      });
    } catch (error) {
      console.error("Error al eliminar mentoría:", error);
      showAppAlert(error.message || "No se pudo eliminar la mentoría.", "error", {
        title: "Error al eliminar"
      });
    }
    return;
  }

  if (e.target.closest(".btn-completar")) {
    const confirmar = await showAppConfirm({
      title: "Completar mentoría",
      message: "¿Deseas marcar esta mentoría como completada?",
      confirmText: "Completar",
      cancelText: "Cancelar"
    });

    if (!confirmar) return;

    try {
      await MentoriasAPI.completarMentoria(idMentoria);
      await recargarMentorias();

      showAppAlert("Mentoría completada correctamente.", "success", {
        title: "Estado actualizado"
      });
    } catch (error) {
      console.error("Error al completar mentoría:", error);
      showAppAlert(error.message || "No se pudo completar la mentoría.", "error", {
        title: "Error al completar"
      });
    }
    return;
  }

  if (e.target.closest(".btn-ver-tareas")) {
    const visible = MentoriasUI.estaTareasVisible(card);

    if (visible) {
      MentoriasUI.toggleTareas(card, false);
    } else {
      await recargarTareas(card, idMentoria);
    }
    return;
  }

  if (e.target.closest(".btn-mostrar-form-tarea")) {
    const visible = MentoriasUI.estaFormularioTareaVisible(card);
    MentoriasUI.toggleFormularioTarea(card, !visible);
    return;
  }

  if (e.target.closest(".btn-marcar-todas")) {
    try {
      await MentoriasAPI.marcarTodasTareas(idMentoria, 2);
      await recargarMentorias();

      showAppAlert("Todas las tareas se marcaron como finalizadas.", "success", {
        title: "Tareas actualizadas"
      });
    } catch (error) {
      console.error("Error al marcar todas las tareas:", error);
      showAppAlert(error.message || "No se pudieron marcar todas las tareas.", "error", {
        title: "Error al actualizar"
      });
    }
    return;
  }

  if (e.target.closest(".btn-desmarcar-todas")) {
    try {
      await MentoriasAPI.marcarTodasTareas(idMentoria, 0);
      await recargarMentorias();

      showAppAlert("Las tareas volvieron a estado pendiente.", "success", {
        title: "Tareas actualizadas"
      });
    } catch (error) {
      console.error("Error al desmarcar todas las tareas:", error);
      showAppAlert(error.message || "No se pudieron desmarcar todas las tareas.", "error", {
        title: "Error al actualizar"
      });
    }
    return;
  }



  if (e.target.closest(".btn-ver-historial")) {
    await handleHistorialTarea(e.target.closest(".btn-ver-historial"));
    return;
  }

  if (e.target.closest(".btn-eliminar-tarea")) {
    const tareaItem = e.target.closest(".tarea-item");
    const idTarea = tareaItem?.dataset.tareaId;
    if (!idTarea) return;

    const confirmar = await showAppConfirm({
      title: "Eliminar tarea",
      message: "¿Deseas eliminar esta tarea? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      danger: true
    });

    if (!confirmar) return;

    try {
      await MentoriasAPI.eliminarTarea(idMentoria, idTarea);
      await recargarTareas(card, idMentoria);

      showAppAlert("Tarea eliminada correctamente.", "success", {
        title: "Tarea eliminada"
      });
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      showAppAlert(error.message || "No se pudo eliminar la tarea.", "error", {
        title: "Error al eliminar"
      });
    }
  }
}

async function handleSubmitTarea(e) {
  const form = e.target.closest(".form-nueva-tarea");
  if (!form) return;

  e.preventDefault();

  const card = form.closest(".mentoria-card");
  const idMentoria = card?.dataset.mentoriaId;
  if (!idMentoria) return;

  const data = MentoriasUI.obtenerDatosTarea(form);

  if (!data.titulo || !data.descripcion) {
    showAppAlert("Completa al menos título y descripción de la tarea.", "warning", {
      title: "Formulario incompleto"
    });
    return;
  }

  if (data.fecha) {
    const fechaTarea = MentoriasUI.parsearFechaMs(data.fecha);
    const inicio = MentoriasUI.parsearFechaMs(card.dataset.fechaInicio);
    const termino = MentoriasUI.parsearFechaMs(card.dataset.fechaTermino);

    if (inicio && termino && (fechaTarea < inicio || fechaTarea > termino)) {
      const inicioStr = card.dataset.fechaInicio.slice(0, 10);
      const terminoStr = card.dataset.fechaTermino.slice(0, 10);

      showAppAlert(
        `La fecha debe estar dentro del período de la mentoría (${inicioStr} → ${terminoStr}).`,
        "warning",
        { title: "Fecha inválida" }
      );
      return;
    }
  }

  try {
    await MentoriasAPI.crearTarea(idMentoria, data);
    MentoriasUI.limpiarFormularioTarea(form);
    MentoriasUI.toggleFormularioTarea(card, false);
    await recargarTareas(card, idMentoria);

    showAppAlert("Tarea creada correctamente.", "success", {
      title: "Tarea creada"
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    showAppAlert(error.message || "No se pudo crear la tarea.", "error", {
      title: "Error al crear"
    });
  }
}

async function handleHistorialTarea(btnHistorial) {
  const tareaItem = btnHistorial.closest(".tarea-item");
  const card = btnHistorial.closest(".mentoria-card");
  const idMentoria = card?.dataset.mentoriaId;
  const idTarea = btnHistorial.dataset.tareaId;
  const tituloTarea = tareaItem?.querySelector("strong")?.textContent || "Tarea";
  const modal = document.getElementById("modal-historial");
  if (!modal) return;

  document.getElementById("modal-historial-titulo").textContent = "Historial de la tarea";
  document.getElementById("modal-historial-subtitulo").textContent = tituloTarea;
  document.getElementById("modal-historial-body").innerHTML = `<p class="historial-loading">Cargando...</p>`;
  modal.style.display = "flex";

  try {
    const historial = await MentoriasAPI.obtenerHistorialTarea(idMentoria, idTarea);
    MentoriasUI.renderHistorialTarea(historial, tituloTarea);
  } catch (_) {
    document.getElementById("modal-historial-body").innerHTML = `<p class="historial-empty">No se pudo cargar el historial.</p>`;
  }
}

async function handleChangeListaMentorias(e) {
  const select = e.target.closest(".select-estado-tarea");
  if (!select) return;

  const tareaItem = select.closest(".tarea-item");
  const card = select.closest(".mentoria-card");
  const idMentoria = card?.dataset.mentoriaId;
  const idTarea = tareaItem?.dataset.tareaId;
  const nuevoEstado = Number(select.value);
  const estadoActual = Number(select.dataset.estadoActual);

  if (!idMentoria || !idTarea || nuevoEstado === estadoActual) return;

  try {
    await MentoriasAPI.actualizarEstadoTarea(idMentoria, idTarea, nuevoEstado);
    await recargarMentorias();
    showAppAlert("Estado de tarea actualizado correctamente.", "success", { title: "Tarea actualizada" });
  } catch (error) {
    console.error("Error al actualizar estado de tarea:", error);
    showAppAlert(error.message || "No se pudo actualizar la tarea.", "error", { title: "Error al actualizar" });
  }
}