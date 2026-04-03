
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

  function obtenerFormData() {
    const form = document.getElementById("crear-investigacion-form");
    return form ? new FormData(form) : null;
  }

  function limpiarFormulario() {
    document.getElementById("crear-investigacion-form")?.reset();
  }

  function renderTabla(investigaciones) {
    const tbody = document.getElementById("investigaciones-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(investigaciones) || investigaciones.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="8">No hay investigaciones para mostrar.</td>`;
      tbody.appendChild(row);
      return;
    }

    investigaciones.forEach((inv) => {
      const tr = document.createElement("tr");

      const archivoHTML = inv.archivo_ruta
        ? `<a href="${inv.archivo_ruta}" target="_blank" rel="noopener">Ver archivo</a>`
        : "Sin archivo";

      tr.innerHTML = `
        <td>${escapeHTML(inv.titulo || "")}</td>
        <td>${escapeHTML(inv.area || "")}</td>
        <td>${formatearFecha(inv.fecha_inicio)}</td>
        <td>${formatearFecha(inv.fecha_fin)}</td>
        <td>${escapeHTML(inv.profesor || "")}</td>
        <td>${escapeHTML(inv.mentor || "")}</td>
        <td>${archivoHTML}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-editar" data-id="${inv.id}">Editar</button>
            <button type="button" class="btn-eliminar btn-danger" data-id="${inv.id}">Eliminar</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
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
    poblarSelect,
    obtenerFiltros,
    limpiarFiltros,
    obtenerFormData,
    limpiarFormulario,
    renderTabla,
    aplicarFiltros,
    llenarFormulario
  };
})();
