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
      } else if (estadoMentoria === 3) {
        badge.textContent = "🕐 Próxima";
        badge.classList.add("proxima");
        btnCompletar.disabled = true;
        btnCompletar.textContent = "Próxima";
        btnCompletar.classList.add("proxima");
      }

      lista.appendChild(clone);
    });
  }

  function toggleTareas(card, visible) {
    const container = card.querySelector(".tareas-container");
    if (!container) return;
    container.classList.toggle("hidden-block", !visible);
  }

  function renderTareas(card, tareas, transicionesPorEstado = {}) {
    const lista = card.querySelector(".lista-tareas");
    if (!lista) return;

    lista.innerHTML = "";

    if (!Array.isArray(tareas) || tareas.length === 0) {
      lista.innerHTML = `<li>No hay tareas registradas.</li>`;
      actualizarBotonesMarcar(card, []);
      return;
    }

    const estadoConfig = {
      1: { label: "Pendiente",    cls: "badge-pendiente"   },
      2: { label: "En progreso",  cls: "badge-progreso"    },
      3: { label: "En revisión",  cls: "badge-revision"    },
      4: { label: "Completada",   cls: "badge-finalizada"  },
      5: { label: "Bloqueada",    cls: "badge-bloqueada"   },
      6: { label: "Vencida",      cls: "badge-vencida"     },
    };

    tareas.forEach((tarea) => {
      const idTarea = tarea.id_tarea || tarea.id || tarea.idTarea;
      const estado = Number(tarea.estado ?? 1);
      const esFinal = estado === 4 || estado === 6;

      const { label, cls } = estadoConfig[estado] ?? estadoConfig[1];

      const li = document.createElement("li");
      li.className = `tarea-item${estado === 4 ? " tarea-finalizada" : ""}${estado === 6 ? " tarea-vencida" : ""}`;
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
            <select class="select-estado-tarea" data-tarea-id="${idTarea}" data-estado-actual="${estado}" ${esFinal ? "disabled" : ""}>
              <option value="${estado}" selected>${label}</option>
            </select>
            <button type="button" class="btn-ver-historial btn-secondary" data-tarea-id="${idTarea}" title="Ver historial">📋</button>
            <button type="button" class="btn-eliminar-tarea btn-danger">Eliminar</button>
          </div>
        </div>
        <div class="historial-tarea hidden-block" data-historial-tarea-id="${idTarea}"></div>
      `;

      lista.appendChild(li);
    });

    // Poblar opciones de transición usando el mapa pre-cargado desde mentorias.js
    tareas.forEach((tarea) => {
      const idTarea = tarea.id_tarea || tarea.id || tarea.idTarea;
      const estado = Number(tarea.estado ?? 1);
      const esFinal = estado === 4 || estado === 6;
      if (esFinal) return;

      const transiciones = transicionesPorEstado[estado] || [];
      const select = lista.querySelector(`.select-estado-tarea[data-tarea-id="${idTarea}"]`);
      if (!select) return;
      transiciones.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.nombre;
        select.appendChild(opt);
      });
    });

    // Deshabilitar botones marcar/desmarcar si no hay tareas modificables
    actualizarBotonesMarcar(card, tareas);
  }

  function actualizarBotonesMarcar(card, tareas) {
    const estadoMentoria = Number(card.dataset.completada ?? 0);
    const mentoriaInactiva = estadoMentoria === 1 || estadoMentoria === 2;
    const esProxima = estadoMentoria === 3;

    const hayTareas = tareas.length > 0;
    const todasVencidas = hayTareas && tareas.every(t => Number(t.estado ?? 1) === 6);

    const btnMarcar    = card.querySelector(".btn-marcar-todas");
    const btnDesmarcar = card.querySelector(".btn-desmarcar-todas");
    const btnAgregar   = card.querySelector(".btn-mostrar-form-tarea");

    // Marcar/desmarcar: bloqueado si inactiva, próxima o todas vencidas
    const deshabilitarMasivo = mentoriaInactiva || esProxima || todasVencidas;
    [btnMarcar, btnDesmarcar].forEach((btn) => {
      if (!btn) return;
      btn.disabled = deshabilitarMasivo;
      btn.style.opacity = deshabilitarMasivo ? "0.4" : "";
      btn.style.cursor  = deshabilitarMasivo ? "not-allowed" : "";
    });

    // Agregar tarea: bloqueado solo si inactiva o todas vencidas (NO si es próxima)
    const deshabilitarAgregar = mentoriaInactiva || todasVencidas;
    if (btnAgregar) {
      btnAgregar.disabled = deshabilitarAgregar;
      btnAgregar.style.opacity = deshabilitarAgregar ? "0.4" : "";
      btnAgregar.style.cursor  = deshabilitarAgregar ? "not-allowed" : "";
    }
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
      const badgeLabel = estado === 1 ? "✓ Finalizada" : estado === 2 ? "⏰ Vencida" : estado === 3 ? "🕐 Próxima" : "Activa";
      const badgeStyle = estado === 2
        ? "background:#fee2e2;color:#991b1b;"
        : estado === 1 ? "background:#d1fae5;color:#065f46;"
        : estado === 3 ? "background:#ede9fe;color:#5b21b6;"
        : "background:#eef0ff;color:#5a4bf6;";
      const borderColor = estado === 2 ? "#ef4444" : estado === 1 ? "#22c55e" : estado === 3 ? "#7c3aed" : "var(--primary)";
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
              data-abrir-detalle="${idMentoria}">Ver tareas</button>
          </div>
        </div>`;
    }).join("");
  }

  function abrirModalDetalle(mentoria, tareas) {
    if (!mentoria) return;

    const estado = Number(mentoria.completada ?? 0);
    const badgeLabel = estado === 1 ? "✓ Finalizada" : estado === 2 ? "⏰ Vencida" : estado === 3 ? "🕐 Próxima" : "Activa";
    const badgeStyle = estado === 2
      ? "background:#fee2e2;color:#991b1b;"
      : estado === 1 ? "background:#d1fae5;color:#065f46;"
      : estado === 3 ? "background:#ede9fe;color:#5b21b6;"
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
    renderDetalleTareas(contenedor, tareas);
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

  // Configuración visual de estados
  const ESTADOS = {
    1: { label: "Pendiente",   color: "#f59e0b", bg: "#fef3c7", text: "#92400e" },
    2: { label: "En progreso", color: "#3b82f6", bg: "#dbeafe", text: "#1e40af" },
    3: { label: "En revisión", color: "#8b5cf6", bg: "#ede9fe", text: "#5b21b6" },
    4: { label: "Completada",  color: "#10b981", bg: "#d1fae5", text: "#065f46" },
    5: { label: "Bloqueada",   color: "#ef4444", bg: "#fee2e2", text: "#991b1b" },
    6: { label: "Vencida",     color: "#6b7280", bg: "#f3f4f6", text: "#374151" },
  };

  // Nodos y conexiones del diagrama
  const NODOS = [
    { id: 1, x: 60,  y: 40  },
    { id: 2, x: 200, y: 40  },
    { id: 3, x: 340, y: 40  },
    { id: 4, x: 480, y: 40  },
    { id: 5, x: 200, y: 120 },
    { id: 6, x: 340, y: 120 },
  ];

  const CONEXIONES = [
    { from: 1, to: 2 }, { from: 1, to: 5 },
    { from: 2, to: 3 }, { from: 2, to: 5 }, { from: 2, to: 1 },
    { from: 3, to: 4 }, { from: 3, to: 2 }, { from: 3, to: 5 },
    { from: 5, to: 1 }, { from: 5, to: 2 },
  ];

  function generarDiagramaEstado(estadoActual, transicionesValidas) {
    const W = 560, H = 160;
    const R = 36; // radio nodo
    const estadoIds = transicionesValidas.map(t => t.id);

    // Flechas
    const flechas = CONEXIONES.map(c => {
      const from = NODOS.find(n => n.id === c.from);
      const to   = NODOS.find(n => n.id === c.to);
      if (!from || !to) return "";

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const ux = dx/dist, uy = dy/dist;

      const x1 = from.x + ux * R;
      const y1 = from.y + uy * R;
      const x2 = to.x   - ux * R;
      const y2 = to.y   - uy * R;

      const esValida = c.from === estadoActual && estadoIds.includes(c.to);
      const color = esValida ? "#5a4bf6" : "#d1d5db";
      const width = esValida ? 2 : 1;
      const opacity = esValida ? 1 : 0.4;

      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="${color}" stroke-width="${width}" opacity="${opacity}"
        marker-end="url(#arrow-${esValida ? 'active' : 'inactive'})"/>`;
    }).join("");

    // Nodos
    const nodos = NODOS.map(n => {
      const est = ESTADOS[n.id];
      if (!est) return "";
      const esActual   = n.id === estadoActual;
      const esDestino  = estadoIds.includes(n.id);
      const esFinal    = n.id === 4 || n.id === 6;

      let strokeColor = "#e5e7eb";
      let strokeWidth = 1.5;
      let bgColor     = "#f9fafb";
      let textColor   = "#9ca3af";
      let opacity     = 0.5;

      if (esActual) {
        strokeColor = est.color;
        strokeWidth = 3;
        bgColor     = est.bg;
        textColor   = est.text;
        opacity     = 1;
      } else if (esDestino) {
        strokeColor = est.color;
        strokeWidth = 1.5;
        bgColor     = "#fff";
        textColor   = est.text;
        opacity     = 0.85;
      }

      const label = est.label.length > 9 ? est.label.slice(0, 8) + "…" : est.label;

      return `
        <g class="${esDestino && !esActual ? 'nodo-destino' : ''}"
           data-estado-id="${n.id}"
           style="cursor:${esDestino && !esActual ? 'pointer' : 'default'};"
           opacity="${opacity}">
          <circle cx="${n.x}" cy="${n.y}" r="${R}"
            fill="${bgColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          ${esActual ? `<circle cx="${n.x}" cy="${n.y}" r="${R + 5}"
            fill="none" stroke="${est.color}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 2"/>` : ""}
          <text x="${n.x}" y="${n.y + 4}" text-anchor="middle"
            font-size="10" font-weight="${esActual ? '700' : '500'}"
            fill="${textColor}" font-family="inherit">${label}</text>
        </g>`;
    }).join("");

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;overflow:visible;"
           class="workflow-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#5a4bf6"/>
          </marker>
          <marker id="arrow-inactive" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#d1d5db"/>
          </marker>
        </defs>
        ${flechas}
        ${nodos}
      </svg>`;
  }

  // Colores de chips por nombre de estado
  const ESTADO_COLORES = {
    "Pendiente":    { bg: "#fef3c7", color: "#92400e", border: "#fde68a", dot: "#f59e0b" },
    "En progreso":  { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", dot: "#3b82f6" },
    "En revisión":  { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe", dot: "#8b5cf6" },
    "Completada":   { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0", dot: "#10b981" },
    "Bloqueada":    { bg: "#fee2e2", color: "#991b1b", border: "#fecaca", dot: "#ef4444" },
    "Vencida":      { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb", dot: "#6b7280" },
  };

  function chipEstado(nombre) {
    const c = ESTADO_COLORES[nombre] || { bg:"#f3f4f6", color:"#374151", border:"#e5e7eb" };
    return `<span class="historial-estado-chip" style="background:${c.bg};color:${c.color};border-color:${c.border};">${escapeHTML(nombre)}</span>`;
  }

  // Config del workflow interactivo
  const WORKFLOW_NODOS = [
    { id: 1, label: "Pendiente",   col: "#f59e0b", bg: "#fef3c7", text: "#92400e", x: 0,   y: 0   },
    { id: 2, label: "En progreso", col: "#3b82f6", bg: "#dbeafe", text: "#1e40af", x: 160, y: 0   },
    { id: 3, label: "En revisión", col: "#8b5cf6", bg: "#ede9fe", text: "#5b21b6", x: 320, y: 0   },
    { id: 4, label: "Completada",  col: "#10b981", bg: "#d1fae5", text: "#065f46", x: 320, y: 120 },
    { id: 5, label: "Bloqueada",   col: "#ef4444", bg: "#fee2e2", text: "#991b1b", x: 160, y: 120 },
    { id: 6, label: "Vencida",     col: "#6b7280", bg: "#f3f4f6", text: "#374151", x: 0,   y: 120 },
  ];

  const WORKFLOW_EDGES = [
    { from: 1, to: 2 }, { from: 1, to: 5 },
    { from: 2, to: 3 }, { from: 2, to: 5 }, { from: 2, to: 1 },
    { from: 3, to: 4 }, { from: 3, to: 2 }, { from: 3, to: 5 },
    { from: 5, to: 1 }, { from: 5, to: 2 },
  ];

  function montarWorkflowCanvas(canvasId, historial) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const body = canvas.parentElement;
    const W = body.clientWidth - 48 || 480;
    const H = 320;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    // Nodos
    // Nodo START especial
    const START = { x: 60, y: 10, r: 18 };

    const NODES = [
      { id:1, label:"Pendiente",   col:"#f59e0b", bg:"#fef3c7", txt:"#92400e", x:60,  y:60  },
      { id:2, label:"En progreso", col:"#3b82f6", bg:"#dbeafe", txt:"#1e40af", x:220, y:60  },
      { id:3, label:"En revisión", col:"#8b5cf6", bg:"#ede9fe", txt:"#5b21b6", x:380, y:60  },
      { id:4, label:"Completada",  col:"#10b981", bg:"#d1fae5", txt:"#065f46", x:380, y:200 },
      { id:5, label:"Bloqueada",   col:"#ef4444", bg:"#fee2e2", txt:"#991b1b", x:220, y:200 },
      { id:6, label:"Vencida",     col:"#6b7280", bg:"#f3f4f6", txt:"#374151", x:60,  y:200 },
    ];

    const EDGES = [
      {from:1,to:2,label:"Iniciar"},
      {from:1,to:5,label:"Bloquear"},
      {from:2,to:3,label:"Revisar"},
      {from:2,to:5,label:"Bloquear"},
      {from:2,to:1,label:"Revertir"},
      {from:3,to:4,label:"Aprobar"},
      {from:3,to:2,label:"Devolver"},
      {from:3,to:5,label:"Bloquear"},
      {from:5,to:1,label:"Desbloquear"},
      {from:5,to:2,label:"Retomar"},
    ];

    const NW = 110, NH = 40, R = 6;

    // Calcular nodos y edges visitados
    const visitedNodes = new Set();
    const visitedEdges = new Set();
    let estadoActual = historial.length > 0 ? historial[0].estado_nuevo : null;

    historial.forEach(h => {
      if (h.estado_nuevo)    visitedNodes.add(h.estado_nuevo);
      if (h.estado_anterior) visitedNodes.add(h.estado_anterior);
      if (h.estado_anterior && h.estado_nuevo) {
        visitedEdges.add(`${h.estado_anterior}→${h.estado_nuevo}`);
      }
    });

    // Estado pan/zoom
    let tx = 20, ty = 20, scale = 1;
    let dragging = false, lastX = 0, lastY = 0;

    function getNodeCenter(n) {
      return { x: n.x + NW/2, y: n.y + NH/2 };
    }

    function drawArrow(x1, y1, x2, y2, used, label) {
      const dx = x2-x1, dy = y2-y1;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const ux = dx/dist, uy = dy/dist;
      // Acortar para no solapar nodos
      const sx = x1 + ux*8, sy = y1 + uy*8;
      const ex = x2 - ux*10, ey = y2 - uy*10;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = used ? "#5a4bf6" : "#d1d5db";
      ctx.lineWidth   = used ? 2.5 : 1.5;
      ctx.setLineDash(used ? [] : [4,3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Punta de flecha
      const angle = Math.atan2(ey-sy, ex-sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 10*Math.cos(angle-0.4), ey - 10*Math.sin(angle-0.4));
      ctx.lineTo(ex - 10*Math.cos(angle+0.4), ey - 10*Math.sin(angle+0.4));
      ctx.closePath();
      ctx.fillStyle = used ? "#5a4bf6" : "#d1d5db";
      ctx.fill();

      // Etiqueta de transición
      if (used && label) {
        const mx = (sx+ex)/2, my = (sy+ey)/2;
        ctx.save();
        ctx.font = "10px system-ui";
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(mx - tw/2 - 4, my - 9, tw + 8, 16);
        ctx.fillStyle = "#5a4bf6";
        ctx.textAlign = "center";
        ctx.fillText(label, mx, my + 3);
        ctx.restore();
      }
    }

    function drawNode(n) {
      const visited  = visitedNodes.has(n.label);
      const isCurr   = n.label === estadoActual;
      const opacity  = visited ? 1 : 0.3;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Sombra si activo
      if (visited) {
        ctx.shadowColor = n.col + "44";
        ctx.shadowBlur  = isCurr ? 16 : 6;
      }

      // Fondo
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, NW, NH, R);
      ctx.fillStyle = visited ? n.bg : "#f9fafb";
      ctx.fill();
      ctx.strokeStyle = visited ? n.col : "#e5e7eb";
      ctx.lineWidth   = isCurr ? 3 : 1.5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Barra superior de color
      if (visited) {
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, NW, 5, [R, R, 0, 0]);
        ctx.fillStyle = n.col;
        ctx.fill();
      }

      // Texto
      ctx.font = `${isCurr ? 700 : 500} 12px system-ui`;
      ctx.fillStyle = visited ? n.txt : "#9ca3af";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x + NW/2, n.y + NH/2 + 3);

      // Badge "actual"
      if (isCurr) {
        ctx.font = "bold 9px system-ui";
        ctx.fillStyle = n.col;
        ctx.fillText("● ACTUAL", n.x + NW/2, n.y + NH - 6);
      }

      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo cuadriculado
      ctx.save();
      ctx.strokeStyle = "#f0f0f8";
      ctx.lineWidth = 1;
      const gridSize = 30;
      const offX = (tx % gridSize);
      const offY = (ty % gridSize);
      for (let x = offX; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      }
      for (let y = offY; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Edges
      EDGES.forEach(e => {
        const fn = NODES.find(n => n.id === e.from);
        const tn = NODES.find(n => n.id === e.to);
        if (!fn || !tn) return;
        const fc = getNodeCenter(fn), tc = getNodeCenter(tn);
        const used = visitedEdges.has(`${fn.label}→${tn.label}`);
        drawArrow(fc.x, fc.y, tc.x, tc.y, used, used ? e.label : "");
      });

      // Nodo START
      ctx.save();
      ctx.beginPath();
      ctx.arc(START.x + NW/2, START.y + START.r, START.r, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.font = "bold 9px system-ui";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("START", START.x + NW/2, START.y + START.r);
      ctx.restore();

      // Flecha START → Pendiente
      const startCx = START.x + NW/2;
      const startCy = START.y + START.r * 2;
      const node1   = NODES[0];
      const node1Cy = node1.y;
      ctx.beginPath();
      ctx.moveTo(startCx, startCy);
      ctx.lineTo(startCx, node1Cy - 4);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
      // Punta
      ctx.beginPath();
      ctx.moveTo(startCx, node1Cy);
      ctx.lineTo(startCx - 6, node1Cy - 10);
      ctx.lineTo(startCx + 6, node1Cy - 10);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      // Nodes
      NODES.forEach(n => drawNode(n));

      ctx.restore();
    }

    draw();

    // Pan
    canvas.addEventListener("mousedown", e => {
      dragging = true;
      lastX = e.offsetX; lastY = e.offsetY;
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("mousemove", e => {
      if (!dragging) return;
      tx += e.offsetX - lastX;
      ty += e.offsetY - lastY;
      lastX = e.offsetX; lastY = e.offsetY;
      draw();
    });
    canvas.addEventListener("mouseup",   () => { dragging = false; canvas.style.cursor = "grab"; });
    canvas.addEventListener("mouseleave",() => { dragging = false; canvas.style.cursor = "grab"; });

    // Zoom
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scale = Math.min(2.5, Math.max(0.4, scale * delta));
      draw();
    }, { passive: false });
  }

  function renderModalHistorial(historial, mostrarTarea) {
    // Timeline HTML
    let timelineHtml = "";
    if (!Array.isArray(historial) || historial.length === 0) {
      timelineHtml = `<p class="historial-empty">Sin historial de cambios.</p>`;
    } else {
      const entradas = historial.map(h => {
        const fecha   = h.fecha ? new Date(h.fecha).toLocaleString("es-CL") : "";
        const usuario = escapeHTML(h.usuario || h.username || "Sistema");
        const anterior = h.estado_anterior;
        const nuevo    = h.estado_nuevo;
        const dotColor = (ESTADO_COLORES[nuevo] || {}).dot || "#6b7280";
        const tarea = mostrarTarea && h.tarea
          ? `<div class="historial-tarea-nombre">📌 ${escapeHTML(h.tarea)}</div>` : "";
        const transicion = anterior
          ? `${chipEstado(anterior)} <span class="historial-arrow">→</span> ${chipEstado(nuevo)}`
          : chipEstado(nuevo);
        return `
          <div class="historial-entry">
            <div class="historial-dot" style="background:${dotColor};"></div>
            <div class="historial-entry-card">
              <div class="historial-entry-header">
                <span class="historial-usuario">${usuario}</span>
                <span class="historial-fecha">${fecha}</span>
              </div>
              ${tarea}
              <div class="historial-transicion">${transicion}</div>
            </div>
          </div>`;
      }).join("");
      timelineHtml = `<div class="historial-timeline">${entradas}</div>`;
    }

    return `
      <canvas id="workflow-canvas" class="workflow-canvas"></canvas>
      <div class="historial-diagrama-hint">🖱 Arrastra · Rueda para zoom</div>
      <div class="historial-divider"><span>Registro de cambios</span></div>
      ${timelineHtml}`;
  }

  function abrirModalHistorial(titulo, subtitulo, historial, mostrarTarea = false) {
    const modal = document.getElementById("modal-historial");
    if (!modal) return;
    document.getElementById("modal-historial-titulo").textContent = titulo;
    document.getElementById("modal-historial-subtitulo").textContent = subtitulo;
    document.getElementById("modal-historial-body").innerHTML = renderModalHistorial(historial, mostrarTarea);
    modal.style.display = "flex";

    requestAnimationFrame(() => {
      montarWorkflowCanvas("workflow-canvas", historial);
    });

    const btnCerrar = document.getElementById("btn-cerrar-historial");
    if (btnCerrar) btnCerrar.onclick = cerrarModalHistorial;
    modal.onclick = (e) => { if (e.target === modal) cerrarModalHistorial(); };
  }

  function cerrarModalHistorial() {
    const modal = document.getElementById("modal-historial");
    if (modal) modal.style.display = "none";
  }

  function renderHistorialTarea(historial, subtitulo) {
    abrirModalHistorial("Historial de la tarea", subtitulo, historial, false);
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
    renderHistorialTarea,
    cerrarModalHistorial,
    generarDiagramaEstado,
  };
})();