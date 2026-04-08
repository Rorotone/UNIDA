const MentoriasUI = (() => {
  let fechaSeleccionada = new Date();
  let semanaOffset = 0;

  function escapeHTML(text) {
    return String(text ?? '')
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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
      id_profesor: document.getElementById("profesor-select")?.value || "",
      fecha_inicio: document.getElementById("fecha-mentoria-inicio")?.value || "",
      fecha_termino: document.getElementById("fecha-mentoria-termino")?.value || ""
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
      lista.innerHTML = `<p class="empty-state">No hay mentorías para la fecha seleccionada.</p>`;
      return;
    }

    mentorias.forEach((mentoria) => {
      const clone = template.content.cloneNode(true);
      const card = clone.querySelector(".mentoria-card");

      const idMentoria = mentoria.id_mentoria || mentoria.id || mentoria.idMentoria;
      card.dataset.mentoriaId = idMentoria;
      card.dataset.fechaInicio = mentoria.fecha_inicio || "";
      card.dataset.fechaTermino = mentoria.fecha_termino || "";

      clone.querySelector(".mentoria-titulo").textContent = mentoria.titulo || "Sin título";
      clone.querySelector(".mentor").textContent = mentoria.mentor || mentoria.nombre_mentor || "-";
      clone.querySelector(".profesor").textContent = mentoria.profesor || mentoria.nombre_profesor || "-";

      const fechasEl = clone.querySelector(".mentoria-fechas");
      if (fechasEl) {
        const inicio = mentoria.fecha_inicio ? normalizarFecha(mentoria.fecha_inicio) : "-";
        const termino = mentoria.fecha_termino ? normalizarFecha(mentoria.fecha_termino) : "-";
        fechasEl.textContent = `${inicio} → ${termino}`;
      }

      const badge = clone.querySelector(".mentoria-badge-estado");
      const btnCompletar = clone.querySelector(".btn-completar");
      if (mentoria.completada) {
        badge.textContent = "✓ Completada";
        badge.classList.add("completada");
        btnCompletar.classList.add("completada");
        btnCompletar.textContent = "✓ Completada";
      }

      lista.appendChild(clone);
    });
  }

  function toggleTareas(card, visible) {
    const container = card.querySelector(".tareas-container");
    if (!container) return;
    container.classList.toggle("hidden-block", !visible);
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
        const estado = Number(tarea.estado ?? 0);
  
        const estadoConfig = {
          0: { label: "Pendiente",   cls: "badge-pendiente"  },
          1: { label: "En progreso", cls: "badge-progreso"   },
          2: { label: "Completada",  cls: "badge-completada" },
        };
        const { label, cls } = estadoConfig[estado] ?? estadoConfig[0];
  
        const li = document.createElement("li");
        li.className = `tarea-item${estado === 2 ? " tarea-completada" : ""}`;
        li.dataset.tareaId = idTarea;
  
        li.innerHTML = `
          <div class="tarea-item-content">
            <div class="tarea-item-info">
              <div class="tarea-titulo-row">
                <strong>${escapeHTML(tarea.titulo || "Sin título")}</strong>
                <span class="tarea-badge ${cls}">${label}</span>
              </div>
              <div class="tarea-descripcion">${escapeHTML(tarea.descripcion || "")}</div>
              ${tarea.fecha ? `<small class="tarea-fecha">📅 ${formatearFechaTexto(tarea.fecha)}</small>` : ""}
            </div>
            <div class="tarea-item-actions">
              <select class="select-estado-tarea" data-tarea-id="${idTarea}">
                <option value="0" ${estado === 0 ? "selected" : ""}>Pendiente</option>
                <option value="1" ${estado === 1 ? "selected" : ""}>En progreso</option>
                <option value="2" ${estado === 2 ? "selected" : ""}>Completada</option>
              </select>
              <button type="button" class="btn-eliminar-tarea btn-danger">Eliminar</button>
            </div>
          </div>
        `;
  
        lista.appendChild(li);
      });
    }

  function toggleFormularioTarea(card, visible) {
    const form = card.querySelector(".form-nueva-tarea");
    if (!form) return;
    form.classList.toggle("hidden-block", !visible);
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
    return container && !container.classList.contains("hidden-block");
  }

  function estaFormularioTareaVisible(card) {
    const form = card.querySelector(".form-nueva-tarea");
    return form && !form.classList.contains("hidden-block");
  }

  function obtenerFechaSeleccionada() {
    return new Date(fechaSeleccionada);
  }

  function renderCalendarioSemanal(onSeleccionarFecha) {
    const calendario = document.getElementById("calendario-semanal");
    if (!calendario) return;

    calendario.innerHTML = "";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const base = new Date(hoy);
    base.setDate(base.getDate() + semanaOffset * 7);

    const diaSemana = base.getDay();
    const lunesOffset = diaSemana === 0 ? -6 : 1 - diaSemana;

    const inicioSemana = new Date(base);
    inicioSemana.setDate(base.getDate() + lunesOffset);

    const mesLabel = document.createElement("div");
    mesLabel.className = "mes-semana-label";
    mesLabel.textContent = inicioSemana.toLocaleDateString("es-CL", {
      month: "long",
      year: "numeric"
    });
    calendario.appendChild(mesLabel);

    const btnPrev = document.createElement("button");
    btnPrev.type = "button";
    btnPrev.className = "btn-semana-nav";
    btnPrev.textContent = "<";
    btnPrev.addEventListener("click", () => {
      semanaOffset--;
      renderCalendarioSemanal(onSeleccionarFecha);
    });
    calendario.appendChild(btnPrev);

    const nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      fecha.setHours(0, 0, 0, 0);

      const btnDia = document.createElement("button");
      btnDia.type = "button";
      btnDia.className = "btn-dia-semana";

      const mismoDia =
        fechaSeleccionada.getFullYear() === fecha.getFullYear() &&
        fechaSeleccionada.getMonth() === fecha.getMonth() &&
        fechaSeleccionada.getDate() === fecha.getDate();

      if (mismoDia) {
        btnDia.classList.add("seleccionado");
      }

      btnDia.innerHTML = `${nombres[i]}<br>${fecha.getDate()}`;

      btnDia.addEventListener("click", () => {
        fechaSeleccionada = new Date(fecha);
        renderCalendarioSemanal(onSeleccionarFecha);
        if (typeof onSeleccionarFecha === "function") {
          onSeleccionarFecha(new Date(fechaSeleccionada));
        }
      });

      calendario.appendChild(btnDia);
    }

    const btnNext = document.createElement("button");
    btnNext.type = "button";
    btnNext.className = "btn-semana-nav";
    btnNext.textContent = ">";
    btnNext.addEventListener("click", () => {
      semanaOffset++;
      renderCalendarioSemanal(onSeleccionarFecha);
    });
    calendario.appendChild(btnNext);
  }

  function filtrarTareasPorFecha(mentorias, fecha) {
    if (!Array.isArray(mentorias)) return [];

    const fechaMs = parsearFechaMs(fecha);
    if (fechaMs === null) return [];

    return mentorias.filter((mentoria) => {
      if (!mentoria.fecha_inicio || !mentoria.fecha_termino) return false;
      const inicio = parsearFechaMs(mentoria.fecha_inicio);
      const termino = parsearFechaMs(mentoria.fecha_termino);
      if (inicio === null || termino === null) return false;
      return fechaMs >= inicio && fechaMs <= termino;
    });
  }

  function parsearFechaMs(valor) {
    if (!valor) return null;
 
    // Si es objeto Date, extraer año/mes/día en hora local
    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate()).getTime();
    }
 
    // Si es string ISO "2026-03-31T00:48:45.000Z" o "2026-03-31 21:48:45"
    const soloFecha = String(valor).slice(0, 10); // "2026-03-31"
    const partes = soloFecha.split("-");
    if (partes.length !== 3) return null;
    const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  function normalizarFecha(valor) {
    if (!valor) return "";
    const soloFecha = String(valor).slice(0, 10);
    return soloFecha;
  }

  function formatearFechaTexto(valor) {
    if (!valor) return "";
    const soloFecha = String(valor).slice(0, 10);
    const [y, m, d] = soloFecha.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    if (isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleDateString("es-CL");
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
    estaFormularioTareaVisible,
    renderCalendarioSemanal,
    filtrarTareasPorFecha,
    obtenerFechaSeleccionada,
    parsearFechaMs,
    formatearFechaTexto
  };
})();