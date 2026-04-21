/* Refactor exacto basado en profesores.ui(7).js + profesores(8).js */
import { fetchCatalogoSedes } from './profesores.api.js';
import { getCatalogoSedesCache, setCatalogoSedesCache } from './profesores.state.js';

let selectedSedesCache = [];
let sedesSearchTimer = null;

function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function setSelectedSedes(data) {
  const normalized = Array.isArray(data) ? data : [];
  const unique = new Map();

  normalized.forEach((item) => {
    const id = Number(item?.id_sede ?? item);
    if (!Number.isInteger(id) || id <= 0) return;

    unique.set(id, {
      id_sede: id,
      nombre_sede: item?.nombre_sede ?? item?.label ?? String(id),
      codigo_sede: item?.codigo_sede ?? null,
      ciudad: item?.ciudad ?? null,
      tipo_sede: item?.tipo_sede ?? 'docencia',
      modalidad: item?.modalidad ?? item?.modalidad_clases ?? '',
      flexibilidad_horaria: item?.flexibilidad_horaria ?? ''
    });
  });

  selectedSedesCache = Array.from(unique.values());
  renderSelectedSedes();
}

export function getSelectedSedes() {
  return selectedSedesCache;
}

export function getSelectedSedeIds() {
  return selectedSedesCache.map((item) => Number(item.id_sede));
}

export function updateSelectedSedeField(idSede, field, value) {
  selectedSedesCache = selectedSedesCache.map((item) => {
    if (Number(item.id_sede) !== Number(idSede)) return item;
    return {
      ...item,
      [field]: String(value ?? '').trim(),
    };
  });

  renderSelectedSedes();
}

export function renderSelectedSedes() {
  const container = document.getElementById('sedes-selected');
  if (!container) return;

  if (!selectedSedesCache.length) {
    container.innerHTML = `<span class="inline-note">No hay sedes seleccionadas.</span>`;
    return;
  }

  container.innerHTML = selectedSedesCache.map((sede) => `
    <div class="sede-card">
      <div class="sede-card-header">
        <strong>${escapeHTML(sede.nombre_sede)}</strong>
        <button type="button" class="sede-chip-remove" data-id="${sede.id_sede}" aria-label="Quitar sede">&times;</button>
      </div>

      <div class="sede-card-grid">
        <label>
          Modalidad
          <select data-action="sede-field" data-field="modalidad" data-id="${sede.id_sede}">
            <option value="">Seleccionar modalidad</option>
            <option value="presencial" ${sede.modalidad === 'presencial' ? 'selected' : ''}>Presencial</option>
            <option value="online" ${sede.modalidad === 'online' ? 'selected' : ''}>Online</option>
            <option value="hibrida" ${sede.modalidad === 'hibrida' ? 'selected' : ''}>Híbrida</option>
          </select>
        </label>

        <label>
          Flexibilidad horaria
          <input
            type="text"
            data-action="sede-field"
            data-field="flexibilidad_horaria"
            data-id="${sede.id_sede}"
            value="${escapeHTML(sede.flexibilidad_horaria)}"
            placeholder="Ej. alta, franjas AM/PM"
          >
        </label>
      </div>
    </div>
  `).join('');
}

export function hideSedesSuggestions() {
  const container = document.getElementById('sedes-suggestions');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

export function clearSedesSearch() {
  const input = document.getElementById('sedes-search-input');
  if (input) input.value = '';
  hideSedesSuggestions();
}

export function addSelectedSede(sede) {
  const idSede = Number(sede?.id_sede);
  if (!Number.isInteger(idSede) || idSede <= 0) return;
  if (selectedSedesCache.some((item) => Number(item.id_sede) === idSede)) return;

  selectedSedesCache.push({
    id_sede: idSede,
    nombre_sede: sede.nombre_sede,
    codigo_sede: sede.codigo_sede ?? null,
    ciudad: sede.ciudad ?? null,
    tipo_sede: sede.tipo_sede ?? 'docencia',
    modalidad: sede.modalidad ?? sede.modalidad_clases ?? '',
    flexibilidad_horaria: sede.flexibilidad_horaria ?? ''
  });

  renderSelectedSedes();
  clearSedesSearch();
  document.getElementById('sedes-search-input')?.focus();
}

export function removeSelectedSede(idSede) {
  selectedSedesCache = selectedSedesCache.filter((item) => Number(item.id_sede) !== Number(idSede));
  renderSelectedSedes();
}

export function renderSedesSuggestions(items) {
  const container = document.getElementById('sedes-suggestions');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="sedes-suggestion-empty">No hay coincidencias.</div>`;
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = items.map((sede) => `
    <button type="button" class="sede-suggestion-item" data-id="${sede.id_sede}">
      <strong>${escapeHTML(sede.nombre_sede)}</strong>
      <small>${escapeHTML([sede.ciudad, sede.codigo_sede].filter(Boolean).join(' · ') || 'Sede activa')}</small>
    </button>
  `).join('');

  container.classList.remove('hidden');
}

export function bindSedesFieldEvents() {
  const searchInput = document.getElementById('sedes-search-input');
  const selectedContainer = document.getElementById('sedes-selected');
  const suggestions = document.getElementById('sedes-suggestions');

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim();
    window.clearTimeout(sedesSearchTimer);

    sedesSearchTimer = window.setTimeout(async () => {
      try {
        const sedes = await fetchCatalogoSedes(query);
        if (!sedes) return;

        setCatalogoSedesCache(sedes);

        const selectedIds = new Set(getSelectedSedeIds());
        const visibles = sedes.filter((sede) => !selectedIds.has(Number(sede.id_sede)));
        renderSedesSuggestions(visibles);
      } catch (error) {
        console.error('Error al buscar sedes:', error);
        renderSedesSuggestions([]);
      }
    }, 150);
  });

  searchInput?.addEventListener('focus', async () => {
    try {
      const sedes = await fetchCatalogoSedes(searchInput.value.trim());
      if (!sedes) return;

      setCatalogoSedesCache(sedes);

      const selectedIds = new Set(getSelectedSedeIds());
      renderSedesSuggestions(
        sedes.filter((sede) => !selectedIds.has(Number(sede.id_sede)))
      );
    } catch (error) {
      console.error('Error al cargar sugerencias de sedes:', error);
      renderSedesSuggestions([]);
    }
  });

  suggestions?.addEventListener('click', (event) => {
    const button = event.target.closest('.sede-suggestion-item');
    if (!button) return;

    const id = Number(button.dataset.id);
    const sede = getCatalogoSedesCache().find((item) => Number(item.id_sede) === id);
    if (!sede) return;

    addSelectedSede(sede);
  });

  selectedContainer?.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.sede-chip-remove');
    if (!removeBtn) return;
    removeSelectedSede(Number(removeBtn.dataset.id));
  });

  const handleSelectedSedeField = (event) => {
    const target = event.target;
    if (!target?.dataset?.action || target.dataset.action !== 'sede-field') return;

    const id = Number(target.dataset.id);
    const field = target.dataset.field;
    if (!Number.isInteger(id) || !field) return;

    updateSelectedSedeField(id, field, target.value?.trim?.() ?? '');
  };

  selectedContainer?.addEventListener('change', handleSelectedSedeField);
}
