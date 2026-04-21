import { importarProfesoresCSV } from './profesores.api.js';

export function bindCSVImportEvents(onImportSuccess) {
  const selectBtn = document.getElementById('select-csv-btn');
  const input = document.getElementById('csv-file-input');
  const importBtn = document.getElementById('import-csv-btn');

  if (selectBtn && input) {
    selectBtn.addEventListener('click', () => input.click());
  }

  input?.addEventListener('change', () => {
    const file = input.files?.[0] || null;
    updateSelectedCSVName(file);
    clearImportSummary();
  });

  importBtn?.addEventListener('click', () => handleImportCSV(onImportSuccess));
  resetImportUI();
}

export async function handleImportCSV(onImportSuccess) {
  const input = document.getElementById('csv-file-input');
  const file = input?.files?.[0];

  if (!file) {
    showAppAlert('Selecciona un archivo CSV.', 'warning', {
      title: 'Archivo requerido'
    });
    return;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'csv') {
    showAppAlert('Debes seleccionar un archivo con extensión .csv.', 'warning', {
      title: 'Formato inválido'
    });
    return;
  }

  try {
    setImportLoading(true);
    clearImportSummary();

    const result = await importarProfesoresCSV(file);
    if (!result) return;

    renderImportSummary(result);

    if (Number(result.insertados || 0) > 0) {
      if (typeof onImportSuccess === 'function') {
        await onImportSuccess();
      }
    }

    const fileName = document.getElementById('csv-file-name');
    const importBtn = document.getElementById('import-csv-btn');
    const csvInput = document.getElementById('csv-file-input');

    if (csvInput) csvInput.value = '';
    if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
    if (importBtn) importBtn.disabled = true;

    const errores = Array.isArray(result.detalle_errores) ? result.detalle_errores.length : 0;

    showAppAlert(
      `Insertados: ${Number(result.insertados || 0)} · Duplicados archivo: ${Number(result.duplicados_archivo || 0)} · Duplicados BD: ${Number(result.duplicados_bd || 0)} · Errores: ${errores}`,
      errores > 0 ? 'warning' : 'success',
      {
        title: result.message || 'Carga masiva procesada.',
        duration: 5500
      }
    );
  } catch (error) {
    console.error('Error al importar CSV:', error);
    showAppAlert(error.message || 'Error al importar el archivo CSV.', 'error', {
      title: 'Error de importación'
    });
  } finally {
    setImportLoading(false);
  }
}

export function resetImportUI() {
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');
  const input = document.getElementById('csv-file-input');

  if (input) input.value = '';
  if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
  if (importBtn) importBtn.disabled = true;

  clearImportSummary();
}

export function updateSelectedCSVName(file) {
  const fileName = document.getElementById('csv-file-name');
  const importBtn = document.getElementById('import-csv-btn');

  if (file) {
    if (fileName) fileName.textContent = file.name;
    if (importBtn) importBtn.disabled = false;
  } else {
    if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
    if (importBtn) importBtn.disabled = true;
  }
}

export function setImportLoading(isLoading) {
  const importBtn = document.getElementById('import-csv-btn');

  if (!importBtn) return;

  importBtn.disabled = isLoading;
  importBtn.textContent = isLoading ? 'Importando...' : 'Importar CSV';
}

export function clearImportSummary() {
  const container = document.getElementById('csv-import-summary');
  if (container) container.innerHTML = '';
}

function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCSVError(errorItem, index = 0) {
  if (typeof errorItem === 'string') {
    return errorItem;
  }

  if (!errorItem || typeof errorItem !== 'object') {
    return `Error ${index + 1}: formato no reconocido`;
  }

  const fila =
    errorItem.fila ??
    errorItem.row ??
    errorItem.linea ??
    errorItem.line ??
    errorItem.index ??
    null;

  const mensaje =
    errorItem.error ??
    errorItem.message ??
    errorItem.mensaje ??
    errorItem.detalle ??
    errorItem.descripcion ??
    'Error no especificado';

  const campo =
    errorItem.campo ??
    errorItem.field ??
    errorItem.columna ??
    null;

  if (fila && campo) {
    return `Fila ${fila} · Campo "${campo}": ${mensaje}`;
  }

  if (fila) {
    return `Fila ${fila}: ${mensaje}`;
  }

  if (campo) {
    return `Campo "${campo}": ${mensaje}`;
  }

  return mensaje;
}

export function renderImportSummary(result) {
  const container = document.getElementById('csv-import-summary');
  if (!container) return;

  const errores = Array.isArray(result?.detalle_errores) ? result.detalle_errores : [];

  container.innerHTML = `
    <div class="csv-summary-card">
      <div class="csv-summary-grid">
        <div><strong>Insertados:</strong> ${Number(result?.insertados || 0)}</div>
        <div><strong>Duplicados archivo:</strong> ${Number(result?.duplicados_archivo || 0)}</div>
        <div><strong>Duplicados BD:</strong> ${Number(result?.duplicados_bd || 0)}</div>
        <div><strong>Errores:</strong> ${errores.length}</div>
      </div>

      ${
        errores.length
          ? `
        <div class="csv-error-list-wrap">
          <h4>Errores</h4>
          <div class="csv-error-list">
            ${errores
              .map((errorItem, index) => {
                const texto = formatCSVError(errorItem, index);
                return `<div class="csv-error-item">${escapeHTML(texto)}</div>`;
              })
              .join('')}
          </div>
        </div>
      `
          : `<div class="csv-success-note">Carga completada sin errores.</div>`
      }
    </div>
  `;
}