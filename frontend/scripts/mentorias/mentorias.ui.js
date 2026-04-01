const MentoriasUI = (() => {
  function abrirModal() {
    document.getElementById("modal-mentoria")?.classList.add("is-open");
  }

  function cerrarModal() {
    document.getElementById("modal-mentoria")?.classList.remove("is-open");
  }

  function limpiarFormularioMentoria() {
    document.getElementById("crear-mentoria-form")?.reset();
  }

  function obtenerDatosMentoria() {
    return {
      titulo: document.getElementById("titulo-mentoria")?.value.trim() || "",
      id_mentor: document.getElementById("mentor-select")?.value || "",
      id_profesor: document.getElementById("profesor-select")?.value || ""
    };
  }

  function poblarSelect(selectId, items, valueKey, textKey, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;

    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[textKey];
      select.appendChild(option);
    });
  }

  function renderMentorias(mentorias) {
    const lista = document.getElementById("lista-mentorias");
    const template = document.getElementById("mentoria-template");

    if (!lista || !template) return;
    lista.innerHTML = "";

    if (!Array.isArray(mentorias) || mentorias.length === 0) {
      lista.innerHTML = `<p>No hay mentorías registradas.</p>`;
      return;
    }

    mentorias.forEach((mentoria) => {
      const clone = template.content.cloneNode(true);
      const card = clone.querySelector(".mentoria-card");

      const idMentoria = mentoria.id_mentoria || mentoria.id || mentoria.idMentoria;
      card.dataset.mentoriaId = idMentoria;

      clone.querySelector("h3").textContent = mentoria.titulo || "Sin título";
      clone.querySelector(".mentor").textContent = `Mentor: ${mentoria.mentor || mentoria.nombre_mentor || "-"}`;
      clone.querySelector(".profesor").textContent = `Profesor: ${mentoria.profesor || mentoria.nombre_profesor || "-"}`;

      const btnCompletar = clone.querySelector(".btn-completar");
      if (mentoria.completada || mentoria.estado === "completada") {
        btnCompletar.classList.add("completada");
        btnCompletar.textContent = "Completada";
      }

      lista.appendChild(clone);
    });
  }

  function toggleTareas(card, visible) {
    const container = card.querySelector(".tareas-container");
    if (!container) return;
    container.style.display = visible ? "block" : "none";
  }

  function renderTareas(card, tareas) {
    const lista = card.querySelector(".lista-tareas");
    if (!lista) return;

    lista.innerHTML = "";

    if (!Array.isArray(tareas) || tareas.length === 0) {
      lista.innerHTML = `<li>No hay tareas registradas.</li>`;
      return;
    }

    tareas.forEach((tarea) => {
      const idTarea = tarea.id_tarea || tarea.id || tarea.idTarea;
      const completada = Boolean(tarea.completada || tarea.estado === "completada");

      const li = document.createElement("li");
      li.className = "tarea-item";
      li.dataset.tareaId = idTarea;

      li.innerHTML = `
        <div class="tarea-item-main">
          <label style="display:flex; gap:8px; align-items:flex-start;">
            <input type="checkbox" class="tarea-check" ${completada ? "checked" : ""}>
            <div>
              <strong>${tarea.titulo || "Sin título"}</strong>
              <div>${tarea.descripcion || ""}</div>
              ${tarea.fecha ? `<small>Fecha: ${tarea.fecha}</small>` : ""}
            </div>
          </label>
        </div>
        <div class="tarea-item-actions" style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-eliminar-tarea btn-danger">Eliminar</button>
        </div>
      `;

      lista.appendChild(li);
    });
  }

  function toggleFormularioTarea(card, visible) {
    const form = card.querySelector(".form-nueva-tarea");
    if (!form) return;
    form.style.display = visible ? "block" : "none";
  }

  function limpiarFormularioTarea(form) {
    form?.reset();
  }

  function obtenerDatosTarea(form) {
    return {
      titulo: form.querySelector('[name="titulo"]')?.value.trim() || "",
      descripcion: form.querySelector('[name="descripcion"]')?.value.trim() || "",
      fecha: form.querySelector('[name="fecha"]')?.value || ""
    };
  }

  function estaTareasVisible(card) {
    const container = card.querySelector(".tareas-container");
    return container?.style.display === "block";
  }

  function estaFormularioTareaVisible(card) {
    const form = card.querySelector(".form-nueva-tarea");
    return form?.style.display === "block";
  }

  return {
    abrirModal,
    cerrarModal,
    limpiarFormularioMentoria,
    obtenerDatosMentoria,
    poblarSelect,
    renderMentorias,
    toggleTareas,
    renderTareas,
    toggleFormularioTarea,
    limpiarFormularioTarea,
    obtenerDatosTarea,
    estaTareasVisible,
    estaFormularioTareaVisible
  };
})();