document.addEventListener("DOMContentLoaded", () => {
  initMentorias();
});

let mentoriasCache = [];

async function initMentorias() {
  bindEventosBase();
  MentoriasUI.renderCalendarioSemanal(aplicarFiltroCalendario);
  await cargarSelects();
  await recargarMentorias();
}

function bindEventosBase() {
let mostrandoTodas = false;

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
      "username",
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
  }
}

async function recargarMentorias() {
  try {
    // Guardar qué mentorías tienen las tareas abiertas antes de recargar
    const tareasAbiertas = new Map();
    document.querySelectorAll(".mentoria-card").forEach((card) => {
      if (MentoriasUI.estaTareasVisible(card)) {
        tareasAbiertas.set(card.dataset.mentoriaId, true);
      }
    });

    const mentorias = await MentoriasAPI.obtenerMentorias();
    mentoriasCache = Array.isArray(mentorias) ? mentorias : [];
    aplicarFiltroCalendario(MentoriasUI.obtenerFechaSeleccionada());

    // Reabrir las tareas que estaban abiertas y recargarlas
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
    alert(error.message || "No se pudieron cargar las mentorías.");
  }
}

function aplicarFiltroCalendario(fechaSeleccionada) {
  mostrandoTodas = false;
  MentoriasUI.toggleBtnVerTodas(false);
  const filtradas = MentoriasUI.filtrarTareasPorFecha(mentoriasCache, fechaSeleccionada);
  MentoriasUI.renderMentorias(filtradas);
}

async function recargarTareas(card, idMentoria) {
  try {
    const tareas = await MentoriasAPI.obtenerTareas(idMentoria);
    MentoriasUI.renderTareas(card, Array.isArray(tareas) ? tareas : []);
    MentoriasUI.toggleTareas(card, true);
  } catch (error) {
    console.error("Error al cargar tareas:", error);
    alert(error.message || "No se pudieron cargar las tareas.");
  }
}

async function handleCrearMentoria(e) {
  e.preventDefault();

  const data = MentoriasUI.obtenerDatosMentoria();

  if (!data.titulo || !data.id_mentor || !data.id_profesor || !data.fecha_inicio || !data.fecha_termino) {
    alert("Completa todos los campos de la mentoría.");
    return;
  }

  if (data.fecha_termino <= data.fecha_inicio) {
    alert("La fecha de término debe ser posterior a la fecha de inicio.");
    return;
  }

  try {
    await MentoriasAPI.crearMentoria(data);
    MentoriasUI.limpiarFormularioMentoria();
    MentoriasUI.cerrarModal();
    await recargarMentorias();
  } catch (error) {
    console.error("Error al crear mentoría:", error);
    alert(error.message || "No se pudo crear la mentoría.");
  }
}

async function handleClickListaMentorias(e) {
  const card = e.target.closest(".mentoria-card");
  if (!card) return;

  const idMentoria = card.dataset.mentoriaId;
  if (!idMentoria) return;

  if (e.target.closest(".btn-eliminar")) {
    const confirmar = confirm("¿Deseas eliminar esta mentoría?");
    if (!confirmar) return;

    try {
      await MentoriasAPI.eliminarMentoria(idMentoria);
      await recargarMentorias();
    } catch (error) {
      console.error("Error al eliminar mentoría:", error);
      alert(error.message || "No se pudo eliminar la mentoría.");
    }
    return;
  }

  if (e.target.closest(".btn-completar")) {
    try {
      await MentoriasAPI.completarMentoria(idMentoria);
      await recargarMentorias();
    } catch (error) {
      console.error("Error al completar mentoría:", error);
      alert(error.message || "No se pudo completar la mentoría.");
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
    } catch (error) {
      console.error("Error al marcar todas las tareas:", error);
      alert(error.message || "No se pudieron marcar todas las tareas.");
    }
    return;
  }

  if (e.target.closest(".btn-desmarcar-todas")) {
    try {
      await MentoriasAPI.marcarTodasTareas(idMentoria, 0);
      await recargarMentorias();
    } catch (error) {
      console.error("Error al desmarcar todas las tareas:", error);
      alert(error.message || "No se pudieron desmarcar todas las tareas.");
    }
    return;
  }

  if (e.target.closest(".btn-eliminar-tarea")) {
    const tareaItem = e.target.closest(".tarea-item");
    const idTarea = tareaItem?.dataset.tareaId;
    if (!idTarea) return;

    const confirmar = confirm("¿Deseas eliminar esta tarea?");
    if (!confirmar) return;

    try {
      await MentoriasAPI.eliminarTarea(idMentoria, idTarea);
      await recargarTareas(card, idMentoria);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      alert(error.message || "No se pudo eliminar la tarea.");
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
    alert("Completa al menos título y descripción de la tarea.");
    return;
  }

  // Validar que la fecha esté dentro del período de la mentoría
  if (data.fecha) {
    const fechaTarea = MentoriasUI.parsearFechaMs(data.fecha);
    const inicio = MentoriasUI.parsearFechaMs(card.dataset.fechaInicio);
    const termino = MentoriasUI.parsearFechaMs(card.dataset.fechaTermino);
 
    console.log('fechaTarea exacto:', fechaTarea)
    console.log('inicio exacto:', inicio)
    console.log('son iguales:', fechaTarea === inicio)

    if (inicio && termino && (fechaTarea < inicio || fechaTarea > termino)) {
      const inicioStr = card.dataset.fechaInicio.slice(0, 10);
      const terminoStr = card.dataset.fechaTermino.slice(0, 10);
      alert(`La fecha debe estar dentro del período de la mentoría (${inicioStr} → ${terminoStr}).`);
      return;
    }
  }

  try {
    await MentoriasAPI.crearTarea(idMentoria, data);
    MentoriasUI.limpiarFormularioTarea(form);
    MentoriasUI.toggleFormularioTarea(card, false);
    await recargarTareas(card, idMentoria);
  } catch (error) {
    console.error("Error al crear tarea:", error);
    alert(error.message || "No se pudo crear la tarea.");
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

  if (!idMentoria || !idTarea) return;

  try {
    await MentoriasAPI.actualizarEstadoTarea(idMentoria, idTarea, nuevoEstado);
    await recargarMentorias();
  } catch (error) {
    console.error("Error al actualizar estado de tarea:", error);
    alert(error.message || "No se pudo actualizar la tarea.");
  }
}