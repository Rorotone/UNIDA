/**
 * profesores.sedes.js
 * 
 * La lógica de sedes fue migrada a profesores.catalogos.js
 * para centralizar todo en un único módulo de catálogos.
 * 
 * Este archivo re-exporta lo necesario para mantener compatibilidad
 * con los imports existentes en profesores.js.
 */

export {
  setSelectedSedes,
  getSelectedSedes,
  getSelectedSedeIds,
  hideSedesSuggestions,
  clearSedesSearch,
  bindSedesFieldEvents
} from './profesores.catalogos.js';
