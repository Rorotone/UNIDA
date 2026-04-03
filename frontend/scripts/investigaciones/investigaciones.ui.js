const InvestigacionesUI = (() => {
  let archivosTemporales = [];
  let investigacionArchivosActual = null;

  function abrirModal() {
    document.getElementById("modal-investigacion")?.classList.add("is-open");
  }

  function cerrarModal() {
    document.getElementById("modal-investigacion")?.classList.remove("is-open");
  }

  function abrirModalArchivos() {
    document.getElementById("modal-archivos-investigacion")?.classList.add("is-open");
  }

  function cerrarModalArchivos() {
    document.getElementById("modal-archivos-investigacion")?.classList.remove("is-open");
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

  function obtenerFiltros() {
    return {
      titulo: (document.getElementById("filtro-titulo")?.value || "").trim().toLowerCase(),
      area: (document.getElementById("filtro-area")?.value || "").trim().toLowerCase(),
      profesor: (document.getElementById("filtro-profesor")?.value || "").trim().toLowerCase(),
      mentor: (document.getElementById("filtro-mentor")?.value || "").trim().toLowerCase()
    };
  }

  function limpiarFiltros() {
    ["filtro-titulo", "filtro-area", "filtro-profesor", "filtro-mentor"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  function agregarArchivosSeleccionados(fileList) {
    const nuevos = Array.from(fileList || []);
    archivosTemporales.push(...nuevos);
    renderArchivosSeleccionados();
  }

  function limpiarArchivosSeleccionados() {
    archivosTemporales = [];
    const input = document.getElementById("archivos");
    if (input) input.value = "";
    renderArchivosSeleccionados();
  }

  function eliminarArchivoTemporal(index) {
    archivosTemporales.splice(index, 1);
    renderArchivosSeleccionados();
  }

  function renderArchivosSeleccionados() {
    const contenedor = document.getElementById("lista-archivos-seleccionados");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!archivosTemporales.length) {
      contenedor.innerHTML = `<span class="inline-note">No hay archivos seleccionados.</span>`;
      return;
    }

    archivosTemporales.forEach((file, index) => {
      const chip = document.createElement("div");
      chip.className = "archivo-chip";
      chip.innerHTML = `
        <span>${escapeHTML(file.name)}</span>
        <button type="button" data-index="${index}" class="btn-remove-file">Quitar</button>
      `;
      contenedor.appendChild(chip);
    });
  }

  function construirFormData() {
    const formData = new FormData();
    formData.append("titulo", document.getElementById("titulo")?.value || "");
    formData.append("area", document.getElementById("area")?.value || "");
    formData.append("fecha_inicio", document.getElementById("fecha_inicio")?.value || "");
    formData.append("fecha_fin", document.getElementById("fecha_fin")?.value || "");
    formData.append("id_profesor", document.getElementById("profesor-select")?.value || "");
    formData.append("id_mentor", document.getElementById("mentor-select")?.value || "");

    archivosTemporales.forEach((file) => {
      formData.append("archivos", file);
    });

    return formData;
  }

  function limpiarFormulario() {
    document.getElementById("crear-investigacion-form")?.reset();
    const ayuda = document.getElementById("investigacion-editando-label");
    if (ayuda) ayuda.textContent = "";
    const titulo = document.getElementById("titulo-modal-investigacion");
    if (titulo) titulo.textContent = "Nueva investigación";
    limpiarArchivosSeleccionados();
  }

  function mostrarModoEdicion(id) {
    const ayuda = document.getElementById("investigacion-editando-label");
    if (ayuda) ayuda.textContent = `Editando investigación #${id}. Puedes agregar archivos nuevos.`;
    const titulo = document.getElementById("titulo-modal-investigacion");
    if (titulo) titulo.textContent = "Editar investigación";
  }

  function actualizarResumen(total) {
    const el = document.getElementById("investigaciones-resumen");
    if (el) {
      el.textContent = `${total} investigaci${total === 1 ? "ón" : "ones"}`;
    }
  }

  function renderResumenArchivos(archivos, investigacionId) {
    const data = Array.isArray(archivos) ? archivos : [];

    if (!data.length) {
      return `
        <div class="archivos-resumen">
          <span class="inline-note">Sin archivos</span>
        </div>
      `;
    }

    const preview = data.slice(0, 2).map((a) => `
      <span class="archivo-preview">${escapeHTML(a.archivo_nombre)}</span>
    `).join("");

    const restante = data.length > 2
      ? `<span class="archivo-preview-more">+${data.length - 2} más</span>`
      : "";

    return `
      <div class="archivos-resumen">
        <div class="archivos-resumen-main">
          <strong>${data.length} archivo${data.length === 1 ? "" : "s"}</strong>
        </div>
        <div class="archivos-resumen-main">
          ${preview}
          ${restante}
        </div>
        <div>
          <button type="button" class="btn-ver-archivos btn-secondary btn-sm" data-id="${investigacionId}">
            Gestionar
          </button>
        </div>
      </div>
    `;
  }

  function renderTabla(investigaciones) {
    const tbody = document.getElementById("investigaciones-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    const data = Array.isArray(investigaciones) ? investigaciones : [];
    actualizarResumen(data.length);

    if (!data.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="7">No hay investigaciones para mostrar.</td>`;
      tbody.appendChild(row);
      return;
    }

    data.forEach((inv) => {
      const tr = document.createElement("tr");
      const archivos = Array.isArray(inv.archivos) ? inv.archivos : [];

      tr.innerHTML = `
        <td>${escapeHTML(inv.titulo || "")}</td>
        <td>${escapeHTML(inv.area || "")}</td>
        <td class="cell-fechas">
          <div><strong>Inicio:</strong> ${formatearFecha(inv.fecha_inicio)}</div>
          <div><strong>Fin:</strong> ${formatearFecha(inv.fecha_fin)}</div>
        </td>
        <td>${escapeHTML(inv.profesor || "")}</td>
        <td>${escapeHTML(inv.mentor || "")}</td>
        <td>${renderResumenArchivos(archivos, inv.id)}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-editar btn-sm" data-id="${inv.id}">Editar</button>
            <button type="button" class="btn-eliminar btn-danger btn-sm" data-id="${inv.id}">Eliminar</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderModalArchivos(investigacion) {
    investigacionArchivosActual = investigacion;
    const subtitle = document.getElementById("archivos-investigacion-subtitle");
    const lista = document.getElementById("lista-archivos-investigacion");

    if (subtitle) {
      subtitle.textContent = investigacion?.titulo
        ? `Investigación: ${investigacion.titulo}`
        : "";
    }

    if (!lista) return;
    const archivos = Array.isArray(investigacion?.archivos) ? investigacion.archivos : [];

    if (!archivos.length) {
      lista.innerHTML = `<div class="empty-archivos">Esta investigación no tiene archivos adjuntos.</div>`;
      return;
    }

    lista.innerHTML = archivos.map((archivo) => `
      <div class="archivo-card" data-archivo-id="${archivo.id}">
        <div class="archivo-card-info">
          <a href="${archivo.archivo_ruta}" target="_blank" rel="noopener">${escapeHTML(archivo.archivo_nombre)}</a>
          <span class="inline-note">${archivo.archivo_ruta}</span>
        </div>

        <div class="archivo-card-actions">
          <a href="${archivo.archivo_ruta}" target="_blank" rel="noopener" class="btn-secondary btn-sm">Abrir</a>
          <button type="button" class="btn-eliminar-archivo-modal btn-danger btn-sm" data-id="${archivo.id}">
            Eliminar
          </button>
        </div>
      </div>
    `).join("");
  }

  function aplicarFiltros(data) {
    const filtros = obtenerFiltros();
    return (Array.isArray(data) ? data : []).filter((inv) => {
      const titulo = String(inv.titulo || "").toLowerCase();
      const area = String(inv.area || "").toLowerCase();
      const profesor = String(inv.profesor || "").toLowerCase();
      const mentor = String(inv.mentor || "").toLowerCase();

      return (
        titulo.includes(filtros.titulo) &&
        area.includes(filtros.area) &&
        profesor.includes(filtros.profesor) &&
        mentor.includes(filtros.mentor)
      );
    });
  }

  function llenarFormulario(inv) {
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? "";
    };

    setValue("titulo", inv.titulo);
    setValue("area", inv.area);
    setValue("fecha_inicio", inv.fecha_inicio ? normalizarFechaInput(inv.fecha_inicio) : "");
    setValue("fecha_fin", inv.fecha_fin ? normalizarFechaInput(inv.fecha_fin) : "");
    setValue("profesor-select", inv.id_profesor);
    setValue("mentor-select", inv.id_mentor);
  }

  function formatearFecha(valor) {
    if (!valor) return "";
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleDateString("es-CL");
  }

  function normalizarFechaInput(valor) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return {
    abrirModal,
    cerrarModal,
    abrirModalArchivos,
    cerrarModalArchivos,
    poblarSelect,
    obtenerFiltros,
    limpiarFiltros,
    agregarArchivosSeleccionados,
    limpiarArchivosSeleccionados,
    eliminarArchivoTemporal,
    renderArchivosSeleccionados,
    construirFormData,
    limpiarFormulario,
    mostrarModoEdicion,
    renderTabla,
    renderModalArchivos,
    aplicarFiltros,
    llenarFormulario
  };
})();