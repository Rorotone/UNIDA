/* Refactor exacto basado en profesores.ui(7).js */
let profesoresCache = [];
let catalogoTalleresCache = [];
let catalogoFormacionesCache = [];
let catalogoPostgradoCache = [];
let catalogoSedesCache = [];

export function normalizeProfesor(p) {
  return {
    ...p,
    sede: p.Sede ?? p.sede ?? p.sedes_resumen ?? '',
    sedes_resumen: p.sedes_resumen ?? p.Sede ?? p.sede ?? '',
    cantidad_talleres: Number(p.cantidad_talleres ?? 0),
    cantidad_formaciones: Number(p.cantidad_formaciones ?? 0),
    cantidad_postgrados: Number(p.cantidad_postgrados ?? 0),
    formacion_docente_resumen: p.formacion_docente_resumen ?? 'Sin registros',
    talleres_catalogo: Array.isArray(p.talleres_catalogo) ? p.talleres_catalogo : [],
    taller_ids: Array.isArray(p.taller_ids) ? p.taller_ids.map((id) => Number(id)) : [],
    formacion_ids: Array.isArray(p.formacion_ids) ? p.formacion_ids.map((id) => Number(id)) : [],
    sedes: Array.isArray(p.sedes) ? p.sedes : [],
    sede_ids: Array.isArray(p.sede_ids) ? p.sede_ids.map((id) => Number(id)) : [],
    formaciones_docentes: Array.isArray(p.formaciones_docentes) ? p.formaciones_docentes : [],
    postgrados: Array.isArray(p.postgrados) ? p.postgrados : [],
    estado_I: Number(p.estado_I ?? p.Estado_I ?? 0),
    otro_i: p.otro_i ?? p.Otro_i ?? ''
  };
}

export function setProfesoresCache(data) {
  profesoresCache = (data || []).map(normalizeProfesor);
}

export function getProfesoresCache() {
  return profesoresCache;
}

export function setCatalogoTalleresCache(data) {
  catalogoTalleresCache = Array.isArray(data) ? data : [];
}

export function getCatalogoTalleresCache() {
  return catalogoTalleresCache;
}

export function setCatalogoFormacionesCache(data) {
  catalogoFormacionesCache = Array.isArray(data) ? data : [];
}

export function getCatalogoFormacionesCache() {
  return catalogoFormacionesCache;
}

export function setCatalogoPostgradoCache(data) {
  catalogoPostgradoCache = Array.isArray(data) ? data : [];
}

export function getCatalogoPostgradoCache() {
  return catalogoPostgradoCache;
}

export function setCatalogoSedesCache(data) {
  catalogoSedesCache = Array.isArray(data) ? data : [];
}

export function getCatalogoSedesCache() {
  return catalogoSedesCache;
}