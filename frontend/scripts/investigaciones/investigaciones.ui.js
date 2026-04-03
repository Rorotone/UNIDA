const InvestigacionesUI = (() => {
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

  function abrirModal() {
    document.getElementById("modal-investigacion")?.classList.add("is-open");
  }

  function cerrarModal() {
    document.getElementById("modal-investigacion")?.classList.remove("is-open");
  }

  function resetFormulario() {
    document.getElementById("crear-investigacion-form")?.reset();
    const hiddenId = document.getElementById("investigacion-id");
    if (hiddenId) hiddenId.value = "";

    const submitBtn = document.querySelector("#crear-investigacion-form button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Guardar Investigación";

    const title = document.querySelector("#crear-investigacion-form h2");
    if (title) title.textContent = "Nueva Investigación";
  }

  function setModoEdicion(investigacion) {
    const hiddenId = document.getElementById("investigacion-id");
    if (hiddenId) hiddenId.value = investigacion.id ?? "";

    const title = document.querySelector("#crear-investigacion-form h2");
    if (title) title.textContent = "Editar Investigación";

    const submitBtn = document.querySelector("#crear-investigacion-form button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Actualizar Investigación";

    document.getElementById("titulo").value = investigacion.titulo || "";
    document.getElementById("area").value = investigacion.area || "";
    document.getElementById("fecha_inicio").value = normalizarFechaInput(investigacion.fecha_inicio);
    document.getElementById("fecha_fin").value = normalizarFechaInput(investigacion.fecha_fin);
    document.getElementById("profesor-select").value = investigacion.id_profesor || "";
    document.getElementById("mentor-select").value = investigacion.id_mentor || "";
  }

  function obtenerFormData() {
    const form = document.getElementById("crear-investigacion-form");
    return form ? new FormData(form) : null;
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

  function renderTabla(investigaciones, onEdit, onDelete) {
    const tbody = document.querySelector("#tabla-investigaciones tbody") || document.getElementById("investigaciones-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(investigaciones) || investigaciones.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="8" style="text-align:center;">No hay investigaciones registradas.</td>`;
      tbody.appendChild(row);
      return;
    }

    investigaciones.forEach((item) => {
      const row = document.createElement("tr");
      const archivoHtml = item.archivo_url
        ? `<a href="${item.archivo_url}" target="_blank" rel="noopener">Ver archivo</a>`
        : (item.archivo_ruta ? `<a href="${item.archivo_ruta}" target="_blank" rel="noopener">Ver archivo</a>` : "Sin archivo");

      row.innerHTML = `
        <td>${escapeHtml(item.titulo || "")}</td>
        <td>${escapeHtml(item.area || "")}</td>
        <td>${formatearFecha(item.fecha_inicio)}</td>
        <td>${formatearFecha(item.fecha_fin)}</td>
        <td>${escapeHtml(item.profesor || item.profesor_nombre || "")}</td>
        <td>${escapeHtml(item.mentor || item.username || item.mentor_nombre || "")}</td>
        <td>${archivoHtml}</td>
        <td>
          <div class="actions">
            <button type="button" class="btn-secondary btn-editar">Editar</button>
            <button type="button" class="btn-danger btn-eliminar">Eliminar</button>
          </div>
        </td>
      `;

      row.querySelector(".btn-editar")?.addEventListener("click", () => onEdit(item));
      row.querySelector(".btn-eliminar")?.addEventListener("click", () => onDelete(item));
      tbody.appendChild(row);
    });
  }

  function formatearFecha(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleDateString("es-CL");
  }

  function normalizarFechaInput(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return {
    poblarSelect,
    abrirModal,
    cerrarModal,
    resetFormulario,
    setModoEdicion,
    obtenerFormData,
    obtenerFiltros,
    limpiarFiltros,
    renderTabla
  };
})();
