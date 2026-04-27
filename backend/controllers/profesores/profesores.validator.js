import {
    REQUIRED_HEADERS,
    MAX_LENGTHS,
    VALID_MODALIDADES_SCHEDULE,
    VALID_TIPOS_FORMACION,
    VALID_MODALIDADES_FORMACION,
    VALID_ESTADOS_FORMACION,
    VALID_MODALIDADES_POSTGRADOS,
    VALID_ESTADOS_POSTGRADOS,
    normalizeHeader,
    hasLetters,
    validateLength,
    parseYear,
    hasMeaningfulValue,
    isFormacionMeaningful,
    isPostgradoMeaningful,
} from '../profesores/profesores.utils.js';

export const validateHeaders = (headers) => {
    const normalizedHeaders = headers.map(normalizeHeader).filter(Boolean);
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !normalizedHeaders.includes(header));

    return {
        valid: missingHeaders.length === 0,
        missingHeaders,
        normalizedHeaders,
    };
};

export const validateProfesorRecord = (record, rowNumber) => {
    const errors = [];

    if (!record.nombre) {
        errors.push({ fila: rowNumber, campo: 'nombre', error: 'Campo obligatorio vacío.' });
    } else {
        if (!hasLetters(record.nombre)) {
            errors.push({ fila: rowNumber, campo: 'nombre', error: 'Debe contener letras válidas.' });
        }
        if (!validateLength('nombre', record.nombre)) {
            errors.push({ fila: rowNumber, campo: 'nombre', error: `Máximo ${MAX_LENGTHS.nombre} caracteres.` });
        }
    }

    if (!record.departamento) {
        errors.push({ fila: rowNumber, campo: 'departamento', error: 'Campo obligatorio vacío.' });
    } else {
        if (!hasLetters(record.departamento)) {
            errors.push({ fila: rowNumber, campo: 'departamento', error: 'Debe contener letras válidas.' });
        }
        if (!validateLength('departamento', record.departamento)) {
            errors.push({ fila: rowNumber, campo: 'departamento', error: `Máximo ${MAX_LENGTHS.departamento} caracteres.` });
        }
    }

    if (record.talleres && !validateLength('talleres', record.talleres)) {
        errors.push({ fila: rowNumber, campo: 'Talleres', error: `Máximo ${MAX_LENGTHS.talleres} caracteres.` });
    }

    if (record.otro_i && !validateLength('otro_i', record.otro_i)) {
        errors.push({ fila: rowNumber, campo: 'Otro_I', error: `Máximo ${MAX_LENGTHS.otro_i} caracteres.` });
    }

    if (record.formacion === null) {
        errors.push({ fila: rowNumber, campo: 'Formacion', error: 'Valor inválido. Usa 0/1, sí/no, true/false.' });
    }

    if (record.estado_I === null) {
        errors.push({ fila: rowNumber, campo: 'Estado_I', error: 'Valor inválido. Usa 0/1, sí/no, true/false.' });
    }

    if (record.postgrado === null) {
        errors.push({ fila: rowNumber, campo: 'Postgrado', error: 'Valor inválido. Usa 0/1, sí/no, true/false.' });
    }

    return errors;
};

export const validateProfesorSedes = (sedes) => {
    const errors = [];
    const normalizedSedes = [];
    const seenIds = new Set();

    sedes.forEach((item, index) => {
        const idSede = Number(item?.id_sede);
        const label = item?.nombre_sede || item?.id_sede || `posición ${index + 1}`;
        const modalidad = item?.modalidad;
        const flexibilidad = item?.flexibilidad_horaria || '';
        const tipoSede = item?.tipo_sede || 'docencia';

        if (!Number.isInteger(idSede) || idSede <= 0) {
            errors.push(`La sede en ${label} no es válida.`);
            return;
        }

        if (seenIds.has(idSede)) {
            errors.push(`La sede ${label} está duplicada.`);
            return;
        }

        seenIds.add(idSede);

        if (!modalidad) {
            errors.push(`La modalidad es obligatoria para la sede ${label}.`);
        } else if (!VALID_MODALIDADES_SCHEDULE.includes(modalidad)) {
            errors.push(`La modalidad de la sede ${label} debe ser presencial, online o hibrida.`);
        }

        if (!validateLength('flexibilidad_horaria', flexibilidad)) {
            errors.push(`La flexibilidad horaria para la sede ${label} no puede superar ${MAX_LENGTHS.flexibilidad_horaria} caracteres.`);
        }

        normalizedSedes.push({
            id_sede: idSede,
            tipo_sede: tipoSede,
            modalidad,
            flexibilidad_horaria: flexibilidad || null,
        });
    });

    return {
        errors,
        normalizedSedes,
        sedeIds: Array.from(seenIds),
    };
};

export const validateProfesorPayload = ({ profesor, sedes, tallerIds, formaciones, postgrado }) => {
    const errors = [];

    if (!profesor.nombre) errors.push('El nombre del profesor es obligatorio.');
    if (!profesor.departamento) errors.push('El departamento es obligatorio.');

    if (!validateLength('nombre', profesor.nombre)) {
        errors.push(`El nombre del profesor no puede superar ${MAX_LENGTHS.nombre} caracteres.`);
    }

    if (!validateLength('departamento', profesor.departamento)) {
        errors.push(`El departamento no puede superar ${MAX_LENGTHS.departamento} caracteres.`);
    }

    if (!validateLength('otro_i', profesor.otro_i)) {
        errors.push(`La información adicional no puede superar ${MAX_LENGTHS.otro_i} caracteres.`);
    }

    const sedeValidation = validateProfesorSedes(sedes || []);
    const validSedes = sedeValidation.normalizedSedes;
    const sedeIds = sedeValidation.sedeIds;
    errors.push(...sedeValidation.errors);

    const validFormaciones = [];
    const formacionCatalogoIds = [];

    formaciones.forEach((formacion, index) => {
        if (!isFormacionMeaningful(formacion) && !formacion.id_catalogo_formacion) return;

        if (formacion.id_catalogo_formacion) {
            formacionCatalogoIds.push(Number(formacion.id_catalogo_formacion));
        }

        if (!formacion.id_catalogo_formacion) {
            if (!formacion.tipo_formacion || !VALID_TIPOS_FORMACION.includes(formacion.tipo_formacion)) {
                errors.push(`La formación docente #${index + 1} debe tener un tipo válido.`);
            }

            if (!formacion.nombre_actividad) {
                errors.push(`La formación docente #${index + 1} debe tener nombre de actividad.`);
            }
        }

        if (formacion.modalidad && !VALID_MODALIDADES_FORMACION.includes(formacion.modalidad)) {
            errors.push(`La formación docente #${index + 1} tiene una modalidad inválida.`);
        }

        if (formacion.estado && !VALID_ESTADOS_FORMACION.includes(formacion.estado)) {
            errors.push(`La formación docente #${index + 1} tiene un estado inválido.`);
        }

        const year = parseYear(formacion.anio);
        if (hasMeaningfulValue(formacion.anio) && year === null) {
            errors.push(`La formación docente #${index + 1} tiene un año inválido.`);
        }

        if (formacion.nombre_actividad && !validateLength('nombre_actividad', formacion.nombre_actividad)) {
            errors.push(`La formación docente #${index + 1} supera el largo permitido en nombre de actividad.`);
        }

        if (formacion.institucion && !validateLength('institucion', formacion.institucion)) {
            errors.push(`La formación docente #${index + 1} supera el largo permitido en institución.`);
        }

        validFormaciones.push({
            ...formacion,
            anio: year,
            estado: formacion.estado || 'vigente',
        });
    });

    let normalizedPostgrado = null;
    const postgradoCatalogoIds = [];

    if (postgrado && (postgrado.id_catalogo_postgrado || isPostgradoMeaningful(postgrado))) {
        const anio = parseYear(postgrado.anio_obtencion);

        if (postgrado.id_catalogo_postgrado) {
            postgradoCatalogoIds.push(Number(postgrado.id_catalogo_postgrado));
        } else {
            if (!postgrado.nombre_postgrado) {
                errors.push('El bloque de postgrado requiere nombre del postgrado.');
            }

            if (!postgrado.institucion || !postgrado.area_estudio || !postgrado.modalidad) {
                errors.push('El bloque de postgrado requiere institución, área de estudio y modalidad.');
            }
        }

        if (hasMeaningfulValue(postgrado.anio_obtencion) && anio === null) {
            errors.push('El año de obtención del postgrado es inválido.');
        }

        if (postgrado.nombre_postgrado && !validateLength('nombre_postgrado', postgrado.nombre_postgrado)) {
            errors.push(`El nombre del postgrado no puede superar ${MAX_LENGTHS.nombre_postgrado} caracteres.`);
        }

        if (postgrado.modalidad && !VALID_MODALIDADES_POSTGRADOS.includes(postgrado.modalidad)) {
            errors.push('La modalidad del postgrado es inválida.');
        }

        if (postgrado.estado && !VALID_ESTADOS_POSTGRADOS.includes(postgrado.estado)) {
            errors.push('El estado del postgrado es inválido.');
        }

        normalizedPostgrado = {
            ...postgrado,
            anio_obtencion: anio,
            estado: postgrado.estado || 'finalizado',
        };
    }

    return {
        errors,
        validFormaciones,
        normalizedPostgrado,
        sedes: validSedes,
        sedeIds,
        tallerIds: [...new Set(tallerIds)],
        formacionCatalogoIds: [...new Set(formacionCatalogoIds)],
        postgradoCatalogoIds: [...new Set(postgradoCatalogoIds)],
    };
};
