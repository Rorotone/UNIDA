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
      card.dataset.completada = mentoria.completada ?? 0;

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

      const estadoMentoria = Number(mentoria.completada ?? 0);
      if (estadoMentoria === 1) {
        badge.textContent = "✓ Finalizada";
        badge.classList.add("finalizada");
        btnCompletar.classList.add("finalizada");
        btnCompletar.textContent = "✓ Finalizada";
      } else if (estadoMentoria === 2) {
        badge.textContent = "⏰ Vencida";
        badge.classList.add("vencida");
        btnCompletar.disabled = true;
        btnCompletar.textContent = "Vencida";
        btnCompletar.classList.add("vencida");

        const btnEliminar = clone.querySelector(".btn-eliminar");
        if (btnEliminar) {
          btnEliminar.disabled = true;
          btnEliminar.style.opacity = "0.4";
          btnEliminar.style.cursor = "not-allowed";
        }
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
      actualizarBotonesMarcar(card, []);
      return;
    }

    tareas.forEach((tarea) => {
      const idTarea = tarea.id_tarea || tarea.id || tarea.idTarea;
      const estado = Number(tarea.estado ?? 0);

      const estadoConfig = {
        0: { label: "Pendiente",   cls: "badge-pendiente"  },
        1: { label: "En progreso", cls: "badge-progreso"   },
        2: { label: "Finalizada",  cls: "badge-finalizada" },
        3: { label: "Vencida",     cls: "badge-vencida"    },
      };
      const { label, cls } = estadoConfig[estado] ?? estadoConfig[0];

      const li = document.createElement("li");
      li.className = `tarea-item${estado === 2 ? " tarea-finalizada" : ""}${estado === 3 ? " tarea-vencida" : ""}`;
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
            <select class="select-estado-tarea" data-tarea-id="${idTarea}" ${estado === 3 ? "disabled" : ""}>
              <option value="0" ${estado === 0 ? "selected" : ""}>Pendiente</option>
              <option value="1" ${estado === 1 ? "selected" : ""}>En progreso</option>
              <option value="2" ${estado === 2 ? "selected" : ""}>Finalizada</option>
              <option value="3" ${estado === 3 ? "selected" : ""}>Vencida</option>
            </select>
            <button type="button" class="btn-eliminar-tarea btn-danger">Eliminar</button>
          </div>
        </div>
      `;

      lista.appendChild(li);
    });

    // Deshabilitar botones marcar/desmarcar si no hay tareas modificables
    actualizarBotonesMarcar(card, tareas);
  }

  function actualizarBotonesMarcar(card, tareas) {
    const estadoMentoria = Number(card.dataset.completada ?? 0);
    const mentoriaInactiva = estadoMentoria === 1 || estadoMentoria === 2;

    const hayTareas = tareas.length > 0;
    const todasVencidas = hayTareas && tareas.every(t => Number(t.estado ?? 0) === 3);
    const deshabilitar = mentoriaInactiva || todasVencidas;

    const btnMarcar    = card.querySelector(".btn-marcar-todas");
    const btnDesmarcar = card.querySelector(".btn-desmarcar-todas");
    const btnAgregar   = card.querySelector(".btn-mostrar-form-tarea");

    [btnMarcar, btnDesmarcar, btnAgregar].forEach((btn) => {
      if (!btn) return;
      btn.disabled = deshabilitar;
      btn.style.opacity = deshabilitar ? "0.4" : "";
      btn.style.cursor  = deshabilitar ? "not-allowed" : "";
    });
  }

  function toggleFormularioTarea(card, visible) {
    const form = card.querySelector(".form-nueva-tarea");
    if (!form) return;
    form.classList.toggle("hidden-block", !visible);

    if (visible) {
      const inputFecha = form.querySelector('[name="fecha"]');
      if (inputFecha) {
        inputFecha.min = card.dataset.fechaInicio || "";
        inputFecha.max = card.dataset.fechaTermino || "";
      }
    }
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

    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate()).getTime();
    }

    const soloFecha = String(valor).slice(0, 10);
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

  function poblarSelectBusqueda(selectId, items, valueKey, textKey) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">Todos</option>` +
      items.map(i => `<option value="${escapeHTML(i[textKey])}">${escapeHTML(i[textKey])}</option>`).join("");
  }

  function renderResultadosBusqueda(mentorias) {
    const contenedor = document.getElementById("resultados-busqueda-mentorias");
    if (!contenedor) return;

    if (mentorias.length === 0) {
      contenedor.innerHTML = `<p style="color:var(--text-soft);font-size:0.88rem;text-align:center;padding:20px 0;">No se encontraron mentorías.</p>`;
      return;
    }

    contenedor.innerHTML = mentorias.map(m => {
      const estado = Number(m.completada ?? 0);
      const badgeLabel = estado === 1 ? "✓ Finalizada" : estado === 2 ? "⏰ Vencida" : "Activa";
      const badgeStyle = estado === 2
        ? "background:#fee2e2;color:#991b1b;"
        : estado === 1 ? "background:#d1fae5;color:#065f46;"
        : "background:#eef0ff;color:#5a4bf6;";
      const borderColor = estado === 2 ? "#ef4444" : estado === 1 ? "#22c55e" : "var(--primary)";
      const inicio  = m.fecha_inicio  ? String(m.fecha_inicio).slice(0, 10)  : "-";
      const termino = m.fecha_termino ? String(m.fecha_termino).slice(0, 10) : "-";
      const idMentoria = m.id_mentoria || m.id;

      return `
        <div style="padding:12px 14px;background:var(--surface-muted);border-radius:var(--radius-sm);
          border-left:3px solid ${borderColor};display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:600;font-size:0.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHTML(m.titulo || "Sin título")}
            </div>
            <div style="font-size:0.78rem;color:var(--text-soft);margin-top:2px;">
              👤 ${escapeHTML(m.mentor || "-")} &nbsp;·&nbsp; 🎓 ${escapeHTML(m.profesor || "-")}
            </div>
            <div style="font-size:0.75rem;color:var(--text-soft);margin-top:2px;">📅 ${inicio} → ${termino}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
            <span style="font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:999px;${badgeStyle}">${badgeLabel}</span>
            <button type="button" style="font-size:0.78rem;min-height:28px;padding:0 10px;"
              onclick="abrirModalDetalle(${idMentoria})">Ver tareas</button>
          </div>
        </div>`;
    }).join("");
  }

  async function abrirModalDetalle(idMentoria, cache) {
    const mentoria = cache.find(m => (m.id_mentoria || m.id) === idMentoria);
    if (!mentoria) return;

    const estado = Number(mentoria.completada ?? 0);
    const badgeLabel = estado === 1 ? "✓ Finalizada" : estado === 2 ? "⏰ Vencida" : "Activa";
    const badgeStyle = estado === 2
      ? "background:#fee2e2;color:#991b1b;"
      : estado === 1 ? "background:#d1fae5;color:#065f46;"
      : "background:#eef0ff;color:#5a4bf6;";

    document.getElementById("detalle-titulo").textContent   = mentoria.titulo || "Sin título";
    document.getElementById("detalle-mentor").textContent   = mentoria.mentor || "-";
    document.getElementById("detalle-profesor").textContent = mentoria.profesor || "-";
    document.getElementById("detalle-periodo").textContent  =
      `${String(mentoria.fecha_inicio || "").slice(0,10)} → ${String(mentoria.fecha_termino || "").slice(0,10)}`;

    const badge = document.getElementById("detalle-badge");
    badge.textContent = badgeLabel;
    badge.setAttribute("style", `font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:999px;${badgeStyle}`);

    document.getElementById("modal-detalle-mentoria")?.classList.add("is-open");

    const contenedor = document.getElementById("detalle-tareas-lista");
    contenedor.innerHTML = `<p style="color:var(--text-soft);font-size:0.88rem;text-align:center;padding:16px 0;">Cargando tareas...</p>`;

    try {
      const tareas = await MentoriasAPI.obtenerTareas(idMentoria);
      renderDetalleTareas(contenedor, tareas);
    } catch (_) {
      contenedor.innerHTML = `<p style="color:var(--text-soft);font-size:0.88rem;text-align:center;padding:16px 0;">No se pudieron cargar las tareas.</p>`;
    }
  }

  function renderDetalleTareas(contenedor, tareas) {
    if (!Array.isArray(tareas) || tareas.length === 0) {
      contenedor.innerHTML = `<p style="color:var(--text-soft);font-size:0.88rem;text-align:center;padding:16px 0;">No hay tareas registradas.</p>`;
      return;
    }

    const estadoConfig = {
      0: { label: "Pendiente",   color: "#92400e", bg: "#fef3c7", border: "#fde68a" },
      1: { label: "En progreso", color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
      2: { label: "Finalizada",  color: "#065f46", bg: "#d1fae5", border: "#a7f3d0" },
      3: { label: "Vencida",     color: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
    };

    contenedor.innerHTML = tareas.map(t => {
      const est = estadoConfig[Number(t.estado ?? 0)] ?? estadoConfig[0];
      const fecha = t.fecha
        ? `<div style="font-size:0.75rem;color:var(--text-soft);margin-top:2px;">📅 ${String(t.fecha).slice(0,10)}</div>`
        : "";
      return `
        <div style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);
          border-radius:var(--radius-sm);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:600;font-size:0.88rem;">${escapeHTML(t.titulo || "Sin título")}</div>
            <div style="font-size:0.82rem;color:var(--text-soft);margin-top:2px;">${escapeHTML(t.descripcion || "")}</div>
            ${fecha}
          </div>
          <span style="flex-shrink:0;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:999px;
            border:1px solid ${est.border};background:${est.bg};color:${est.color};">${est.label}</span>
        </div>`;
    }).join("");
  }

  function cerrarModalDetalle() {
    document.getElementById("modal-detalle-mentoria")?.classList.remove("is-open");
  }

  function toggleBtnVerTodas(mostrandoTodas) {
    const btn = document.getElementById("btn-ver-todas");
    if (!btn) return;
    if (mostrandoTodas) {
      btn.textContent = "Ocultar todas las mentorías";
      btn.classList.add("btn-active");
    } else {
      btn.textContent = "Ver todas las mentorías";
      btn.classList.remove("btn-active");
    }
  }

  return {
    abrirModal,
    cerrarModal,
    limpiarFormularioMentoria,
    obtenerDatosMentoria,
    poblarSelect,
    poblarSelectBusqueda,
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
    formatearFechaTexto,
    renderResultadosBusqueda,
    abrirModalDetalle,
    cerrarModalDetalle,
    toggleBtnVerTodas,
  };
})();