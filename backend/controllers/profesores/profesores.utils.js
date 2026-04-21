export const REQUIRED_HEADERS = ['nombre', 'departamento'];
export const OPTIONAL_HEADERS = ['talleres', 'formacion', 'estado_i', 'magister', 'otro_i'];
export const MAX_ROWS_PER_UPLOAD = 1000;
export const MAX_LENGTHS = {
    nombre: 30,
    departamento: 100,
    talleres: 200,
    otro_i: 500,
    flexibilidad_horaria: 255,
    nombre_taller: 150,
    tipo_formacion: 30,
    nombre_actividad: 150,
    institucion: 150,
    area_estudio: 150,
    nombre_magister: 180,
    descripcion_catalogo: 500,
};

export const VALID_MODALIDADES_CLASES = ['presencial', 'online', 'hibrido', 'hibrida'];
export const VALID_MODALIDADES_FORMACION = ['presencial', 'online', 'hibrido', 'hibrida'];
export const VALID_MODALIDADES_SCHEDULE = ['presencial', 'online', 'hibrida'];
export const VALID_TIPOS_FORMACION = ['VRA', 'curso', 'diplomado', 'certificacion', 'seminario', 'otro'];
export const VALID_ESTADOS_FORMACION = ['vigente', 'finalizado', 'en_proceso'];
export const VALID_MODALIDADES_MAGISTER = ['presencial', 'online', 'semipresencial', 'hibrido'];
export const VALID_ESTADOS_MAGISTER = ['cursando', 'finalizado', 'pausado'];

export const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

export const normalizeHeader = (header) =>
    String(header ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

export const parseBooleanLike = (value) => {
    const normalized = normalizeText(value).toLowerCase();

    if (['1', 'true', 'si', 'sí', 'yes', 'x'].includes(normalized)) return 1;
    if (['0', 'false', 'no', '', 'null', 'n/a'].includes(normalized)) return 0;

    return null;
};

export const safeNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

export const parseYear = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const year = Number(String(value).trim());
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
    return year;
};

export const hasMeaningfulValue = (value) => normalizeText(value) !== '';
export const validateLength = (field, value) => !value || String(value).length <= MAX_LENGTHS[field];
export const hasLetters = (value) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value);

export const formatSummary = (cantidadTalleres = 0, cantidadFormaciones = 0, cantidadMagister = 0) => {
    const parts = [];

    if (Number(cantidadTalleres) > 0) {
        parts.push(`${cantidadTalleres} taller${Number(cantidadTalleres) === 1 ? '' : 'es'}`);
    }

    if (Number(cantidadFormaciones) > 0) {
        parts.push(`${cantidadFormaciones} formación${Number(cantidadFormaciones) === 1 ? '' : 'es'}`);
    }

    if (Number(cantidadMagister) > 0) {
        parts.push(`${cantidadMagister} magíster`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'Sin registros';
};

export const mapProfesorListRow = (row) => ({
    id_profesor: row.id_profesor,
    nombre: row.nombre,
    departamento: row.departamento,
    sedes_resumen: row.sedes_resumen || '',
    cantidad_talleres: safeNumber(row.cantidad_talleres, 0),
    cantidad_formaciones: safeNumber(row.cantidad_formaciones, 0),
    cantidad_magister: safeNumber(row.cantidad_magister, 0),
    formacion_docente_resumen: formatSummary(row.cantidad_talleres, row.cantidad_formaciones, row.cantidad_magister),
});

export const normalizeProfesorBase = (row) => ({
    id_profesor: row.id_profesor,
    nombre: row.nombre,
    departamento: row.departamento,
    estado_I: safeNumber(row.Estado_I ?? row.estado_I ?? 0, 0),
    otro_i: row.Otro_I ?? row.Otro_i ?? row.otro_i ?? '',
});

export const makeDuplicateKey = ({ nombre, departamento }) =>
    [nombre.toLowerCase(), departamento.toLowerCase()].join('|');

export const mapCsvRow = (row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
        normalizedRow[normalizeHeader(key)] = value;
    }

    return {
        nombre: normalizeText(normalizedRow.nombre),
        departamento: normalizeText(normalizedRow.departamento),
        talleres: normalizeText(normalizedRow.talleres),
        formacion: parseBooleanLike(normalizedRow.formacion),
        estado_I: parseBooleanLike(normalizedRow.estado_i),
        magister: parseBooleanLike(normalizedRow.magister),
        otro_i: normalizeText(normalizedRow.otro_i),
    };
};

export const normalizeProfesorPayload = (body = {}) => ({
    nombre: normalizeText(body.nombre),
    departamento: normalizeText(body.departamento),
    estado_I: safeNumber(body.Estado_I ?? body.estado_I ?? 0, 0),
    otro_i: normalizeText(body.Otro_I ?? body.otro_i ?? ''),
});

export const normalizeModalidadValue = (value) => {
    const raw = normalizeText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (!raw) return '';
    if (raw === 'hibrido' || raw === 'hibrida') return 'hibrida';
    return raw;
};

export const normalizeTallerIds = (value) => {
    const raw = Array.isArray(value) ? value : [];
    const ids = raw
        .map((item) => Number(item?.id_taller ?? item))
        .filter((item) => Number.isInteger(item) && item > 0);

    return [...new Set(ids)];
};

export const normalizeProfesorSedes = (value) => {
    const raw = Array.isArray(value) ? value : [];
    const unique = new Map();

    raw.forEach((item) => {
        const idSede = Number(item?.id_sede ?? item);
        if (!Number.isInteger(idSede) || idSede <= 0) return;

        unique.set(idSede, {
            id_sede: idSede,
            tipo_sede: normalizeText(item?.tipo_sede) || 'docencia',
            modalidad: normalizeModalidadValue(item?.modalidad),
            flexibilidad_horaria: normalizeText(item?.flexibilidad_horaria),
        });
    });

    return Array.from(unique.values());
};

export const normalizeFormaciones = (value) => {
    if (!Array.isArray(value)) return [];

    return value.map((item) => ({
        id_formacion: Number(item?.id_formacion) || null,
        id_catalogo_formacion: Number(item?.id_catalogo_formacion) || null,
        tipo_formacion: normalizeText(item?.tipo_formacion),
        nombre_actividad: normalizeText(item?.nombre_actividad),
        institucion: normalizeText(item?.institucion),
        anio: item?.anio ?? '',
        modalidad: normalizeText(item?.modalidad).toLowerCase(),
        descripcion: normalizeText(item?.descripcion),
        estado: normalizeText(item?.estado).toLowerCase(),
    }));
};

export const normalizeFormacionCatalogoIds = (value) => {
    const raw = Array.isArray(value) ? value : [];
    const ids = raw
        .map((item) => Number(item?.id_catalogo_formacion ?? item))
        .filter((item) => Number.isInteger(item) && item > 0);

    return [...new Set(ids)];
};

export const normalizeCatalogoMagisterId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

export const normalizeMagister = (value = {}) => ({
    id_catalogo_magister: Number(value?.id_catalogo_magister) || null,
    nombre_magister: normalizeText(value?.nombre_magister),
    institucion: normalizeText(value?.institucion),
    area_estudio: normalizeText(value?.area_estudio),
    anio_obtencion: value?.anio_obtencion ?? '',
    modalidad: normalizeText(value?.modalidad).toLowerCase(),
    estado: normalizeText(value?.estado).toLowerCase(),
    observaciones: normalizeText(value?.observaciones),
});

export const isFormacionMeaningful = (formacion) =>
    ['tipo_formacion', 'nombre_actividad', 'institucion', 'anio', 'modalidad', 'descripcion']
        .some((field) => hasMeaningfulValue(formacion?.[field]));

export const isMagisterMeaningful = (magister) =>
    ['institucion', 'area_estudio', 'anio_obtencion', 'modalidad', 'observaciones']
        .some((field) => hasMeaningfulValue(magister?.[field]));

export const createHttpError = (statusCode, message, extra = {}) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    Object.assign(error, extra);
    return error;
};
