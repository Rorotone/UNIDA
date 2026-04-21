import db from '../../config/database.js';
import {
    REQUIRED_HEADERS,
    OPTIONAL_HEADERS,
    MAX_ROWS_PER_UPLOAD,
    VALID_TIPOS_FORMACION,
    normalizeText,
    safeNumber,
    formatSummary,
    mapProfesorListRow,
    normalizeProfesorBase,
    makeDuplicateKey,
    mapCsvRow,
    normalizeProfesorPayload,
    normalizeProfesorSedes,
    normalizeTallerIds,
    normalizeFormaciones,
    normalizeFormacionCatalogoIds,
    normalizeCatalogoMagisterId,
    normalizeMagister,
    createHttpError,
    validateLength,
} from '../profesores/profesores.utils.js';
import {
    validateHeaders,
    validateProfesorRecord,
    validateProfesorPayload,
} from '../profesores/profesores.validator.js';

async function fetchCatalogoTalleresMap(connection, ids) {
    if (!ids.length) return new Map();
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
        `SELECT id_taller, nombre_taller, estado
         FROM catalogo_talleres
         WHERE id_taller IN (${placeholders})`,
        ids
    );
    return new Map(rows.map((row) => [Number(row.id_taller), row]));
}

async function fetchCatalogoFormacionesMap(connection, ids) {
    if (!ids.length) return new Map();
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
        `SELECT
            id_catalogo_formacion,
            nombre_actividad,
            tipo_formacion,
            institucion,
            descripcion,
            estado
         FROM catalogo_formaciones_docentes
         WHERE id_catalogo_formacion IN (${placeholders})`,
        ids
    );
    return new Map(rows.map((row) => [Number(row.id_catalogo_formacion), row]));
}

async function fetchCatalogoMagisterMap(connection, ids) {
    if (!ids.length) return new Map();
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
        `SELECT
            id_catalogo_magister,
            nombre_magister,
            institucion,
            area_estudio,
            descripcion,
            estado
         FROM catalogo_magister
         WHERE id_catalogo_magister IN (${placeholders})`,
        ids
    );
    return new Map(rows.map((row) => [Number(row.id_catalogo_magister), row]));
}

async function fetchCatalogoSedesMap(connection, ids) {
    if (!ids.length) return new Map();
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
        `SELECT id_sede, nombre_sede, codigo_sede, direccion, ciudad, estado
         FROM catalogo_sedes
         WHERE id_sede IN (${placeholders})`,
        ids
    );
    return new Map(rows.map((row) => [Number(row.id_sede), row]));
}

async function fetchProfesorSedesRows(connection, idProfesor) {
    const [rows] = await connection.execute(
        `SELECT
            ps.id_profesor_sede,
            ps.id_profesor,
            ps.id_sede,
            ps.tipo_sede,
            ps.modalidad,
            ps.flexibilidad_horaria,
            cs.nombre_sede,
            cs.codigo_sede,
            cs.direccion,
            cs.ciudad,
            cs.estado
         FROM profesor_sedes ps
         JOIN catalogo_sedes cs ON cs.id_sede = ps.id_sede
         WHERE ps.id_profesor = ?
         ORDER BY
            CASE ps.tipo_sede
              WHEN 'principal' THEN 1
              WHEN 'actual' THEN 2
              ELSE 3
            END,
            cs.nombre_sede ASC`,
        [idProfesor]
    );
    return rows;
}

async function buildExpandedProfesor(connection, idProfesor) {
    const [rows] = await connection.execute(
        `SELECT *
         FROM profesores
         WHERE id_profesor = ? AND deleted_at IS NULL`,
        [idProfesor]
    );

    if (!rows.length) return null;

    const profesor = normalizeProfesorBase(rows[0]);

    const [sedes, talleres, formaciones, magisteres] = await Promise.all([
        fetchProfesorSedesRows(connection, idProfesor),
        connection.execute(
            `SELECT
                ct.id_taller,
                ct.nombre_taller,
                ct.descripcion,
                ct.estado,
                pt.fecha_asignacion
             FROM profesor_talleres pt
             JOIN catalogo_talleres ct ON ct.id_taller = pt.id_taller
             WHERE pt.id_profesor = ?
             ORDER BY ct.nombre_taller ASC`,
            [idProfesor]
        ).then(([result]) => result),
        connection.execute(
            `SELECT
                pfd.id_formacion,
                pfd.id_profesor,
                pfd.id_catalogo_formacion,
                COALESCE(cfd.tipo_formacion, pfd.tipo_formacion) AS tipo_formacion,
                COALESCE(cfd.nombre_actividad, pfd.nombre_actividad) AS nombre_actividad,
                COALESCE(cfd.institucion, pfd.institucion) AS institucion,
                pfd.anio,
                pfd.modalidad,
                COALESCE(pfd.descripcion, cfd.descripcion) AS descripcion,
                pfd.estado
            FROM profesor_formacion_docente pfd
            LEFT JOIN catalogo_formaciones_docentes cfd
              ON cfd.id_catalogo_formacion = pfd.id_catalogo_formacion
            WHERE pfd.id_profesor = ?
            ORDER BY pfd.created_at ASC, pfd.id_formacion ASC`,
            [idProfesor]
        ).then(([result]) => result),
        connection.execute(
            `SELECT
                pm.id_magister,
                pm.id_profesor,
                pm.id_catalogo_magister,
                COALESCE(pm.nombre_magister, cm.nombre_magister) AS nombre_magister,
                COALESCE(cm.institucion, pm.institucion) AS institucion,
                COALESCE(cm.area_estudio, pm.area_estudio) AS area_estudio,
                COALESCE(cm.descripcion, pm.observaciones) AS descripcion_catalogo,
                pm.anio_obtencion,
                pm.modalidad,
                pm.estado,
                pm.observaciones
            FROM profesor_magister pm
            LEFT JOIN catalogo_magister cm
              ON cm.id_catalogo_magister = pm.id_catalogo_magister
            WHERE pm.id_profesor = ?
            ORDER BY pm.updated_at DESC, pm.id_magister DESC`,
            [idProfesor]
        ).then(([result]) => result),
    ]);

    return {
        ...profesor,
        sedes,
        sede_ids: sedes.map((item) => item.id_sede),
        talleres_catalogo: talleres,
        taller_ids: talleres.map((item) => item.id_taller),
        formaciones_docentes: formaciones.map((item) => ({
            ...item,
            anio: item.anio ? Number(item.anio) : null,
        })),
        magister: magisteres[0]
            ? {
                ...magisteres[0],
                anio_obtencion: magisteres[0].anio_obtencion ? Number(magisteres[0].anio_obtencion) : null,
            }
            : null,
        cantidad_talleres: talleres.length,
        cantidad_formaciones: formaciones.length,
        cantidad_magister: magisteres.length,
        formacion_docente_resumen: formatSummary(talleres.length, formaciones.length, magisteres.length),
    };
}

async function syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, magisterId) {
    await connection.execute('DELETE FROM profesor_talleres WHERE id_profesor = ?', [idProfesor]);
    if (tallerIds.length > 0) {
        const insertData = tallerIds.map((idTaller) => [idProfesor, idTaller]);
        await connection.query(
            'INSERT INTO profesor_talleres (id_profesor, id_taller) VALUES ?',
            [insertData]
        );
    }

    await connection.execute('DELETE FROM profesor_formacion_docente WHERE id_profesor = ?', [idProfesor]);
    if (formacionIds.length > 0) {
        const insertData = formacionIds.map((idFormacion) => [idProfesor, idFormacion]);
        await connection.query(
            'INSERT INTO profesor_formacion_docente (id_profesor, id_catalogo_formacion) VALUES ?',
            [insertData]
        );
    }

    await connection.execute('DELETE FROM profesor_magister WHERE id_profesor = ?', [idProfesor]);
    if (magisterId) {
        await connection.execute(
            'INSERT INTO profesor_magister (id_profesor, id_catalogo_magister) VALUES (?, ?)',
            [idProfesor, magisterId]
        );
    }
}

async function replaceProfesorSedes(connection, idProfesor, sedes) {
    await connection.execute('DELETE FROM profesor_sedes WHERE id_profesor = ?', [idProfesor]);

    if (sedes.length > 0) {
        const insertData = sedes.map((item, index) => [
            idProfesor,
            item.id_sede,
            item.tipo_sede || (index === 0 ? 'principal' : 'docencia'),
            item.modalidad || null,
            item.flexibilidad_horaria || null,
        ]);

        await connection.query(
            'INSERT INTO profesor_sedes (id_profesor, id_sede, tipo_sede, modalidad, flexibilidad_horaria) VALUES ?',
            [insertData]
        );
    }
}

function parseProfesorInput(body = {}) {
    const profesor = normalizeProfesorPayload(body);
    const sedes = normalizeProfesorSedes(body.sedes ?? body.sede_ids ?? body.id_sedes);
    const tallerIds = normalizeTallerIds(body.taller_ids);
    const formaciones = normalizeFormaciones(body.formaciones ?? []);
    const formacionIds = normalizeFormacionCatalogoIds(body.formacion_ids);
    const magisterId = normalizeCatalogoMagisterId(body.magister_id);
    const magister = normalizeMagister(body.magister ?? {});
    return { profesor, sedes, tallerIds, formaciones, formacionIds, magisterId, magister };
}

async function validateCatalogReferences(connection, { tallerIds, formacionIds, magisterId, sedeIds }) {
    if (tallerIds.length > 0) {
        const talleresMap = await fetchCatalogoTalleresMap(connection, tallerIds);
        if (tallerIds.length !== talleresMap.size) {
            throw createHttpError(400, 'Uno o más talleres seleccionados no existen.');
        }
    }

    if (formacionIds.length > 0) {
        const formacionesMap = await fetchCatalogoFormacionesMap(connection, formacionIds);
        if (formacionIds.length !== formacionesMap.size) {
            throw createHttpError(400, 'Una o más formaciones seleccionadas no existen.');
        }
    }

    if (magisterId) {
        const magisterMap = await fetchCatalogoMagisterMap(connection, [magisterId]);
        if (magisterMap.size === 0) {
            throw createHttpError(400, 'El magíster seleccionado no existe.');
        }
    }

    const sedesMap = await fetchCatalogoSedesMap(connection, sedeIds);
    if (sedeIds.length !== sedesMap.size) {
        throw createHttpError(400, 'Una o más sedes seleccionadas no existen.');
    }
}

export async function createProfesorService(body) {
    const connection = await db.getConnection();

    try {
        const { profesor, sedes, tallerIds, formaciones, formacionIds, magisterId, magister } = parseProfesorInput(body);

        if (body.magister_id && !magisterId) {
            throw createHttpError(400, 'El magíster debe ser un ID válido.');
        }

        const payloadValidation = validateProfesorPayload({ profesor, sedes, tallerIds, formaciones, magister });
        if (payloadValidation.errors.length > 0) {
            throw createHttpError(400, payloadValidation.errors[0], { errors: payloadValidation.errors });
        }

        await validateCatalogReferences(connection, {
            tallerIds,
            formacionIds,
            magisterId,
            sedeIds: payloadValidation.sedeIds,
        });

        await connection.beginTransaction();

        const [result] = await connection.execute(
            `INSERT INTO profesores
             (nombre, departamento, Estado_I, Otro_I)
             VALUES (?, ?, ?, ?)`,
            [profesor.nombre, profesor.departamento, profesor.estado_I, profesor.otro_i]
        );

        const idProfesor = result.insertId;

        await syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, magisterId);
        await replaceProfesorSedes(connection, idProfesor, payloadValidation.sedes);

        await connection.commit();

        return {
            message: 'Profesor creado exitosamente.',
            id_profesor: idProfesor,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function getProfesoresService(filters = {}) {
    const { nombre, departamento, sede } = filters;
    let query = `
        SELECT
            p.id_profesor,
            p.nombre,
            p.departamento,
            COUNT(DISTINCT pt.id_taller) AS cantidad_talleres,
            COUNT(DISTINCT pf.id_formacion) AS cantidad_formaciones,
            COUNT(DISTINCT pm.id_magister) AS cantidad_magister,
            COALESCE(GROUP_CONCAT(DISTINCT cs.nombre_sede ORDER BY cs.nombre_sede ASC SEPARATOR ', '), '') AS sedes_resumen
        FROM profesores p
        LEFT JOIN profesor_talleres pt ON pt.id_profesor = p.id_profesor
        LEFT JOIN profesor_formacion_docente pf ON pf.id_profesor = p.id_profesor
        LEFT JOIN profesor_magister pm ON pm.id_profesor = p.id_profesor
        LEFT JOIN profesor_sedes ps ON ps.id_profesor = p.id_profesor
        LEFT JOIN catalogo_sedes cs ON cs.id_sede = ps.id_sede
        WHERE p.deleted_at IS NULL
    `;
    const queryParams = [];
    const conditions = [];

    if (nombre) {
        conditions.push('p.nombre LIKE ?');
        queryParams.push(`%${nombre}%`);
    }

    if (departamento) {
        conditions.push('p.departamento LIKE ?');
        queryParams.push(`%${departamento}%`);
    }

    if (sede) {
        conditions.push('cs.nombre_sede LIKE ?');
        queryParams.push(`%${sede}%`);
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    query += `
        GROUP BY p.id_profesor, p.nombre, p.departamento
        ORDER BY p.nombre ASC
    `;

    const [rows] = await db.execute(query, queryParams);
    return rows.map((row) => ({
        ...mapProfesorListRow(row),
        sedes_resumen: row.sedes_resumen || '',
    }));
}

export async function getProfesorByIdService(idProfesor) {
    const connection = await db.getConnection();
    try {
        const profesor = await buildExpandedProfesor(connection, idProfesor);
        if (!profesor) {
            throw createHttpError(404, 'Profesor no encontrado.');
        }

        return {
            id_profesor: profesor.id_profesor,
            nombre: profesor.nombre,
            departamento: profesor.departamento,
            estado_I: profesor.estado_I,
            otro_i: profesor.otro_i,
            sedes: profesor.sedes.map((s) => ({
                id_sede: s.id_sede,
                tipo_sede: s.tipo_sede,
                modalidad: s.modalidad,
                flexibilidad_horaria: s.flexibilidad_horaria,
            })),
            taller_ids: profesor.taller_ids,
            formacion_ids: profesor.formaciones_docentes
                .filter((item) => item.id_catalogo_formacion)
                .map((item) => item.id_catalogo_formacion),
            magister_id: profesor.magister?.id_catalogo_magister || null,
        };
    } finally {
        connection.release();
    }
}

export async function updateProfesorService(idProfesor, body) {
    const connection = await db.getConnection();

    try {
        const { profesor, sedes, tallerIds, formaciones, formacionIds, magisterId, magister } = parseProfesorInput(body);

        if (body.magister_id && !magisterId) {
            throw createHttpError(400, 'El magíster debe ser un ID válido.');
        }

        const payloadValidation = validateProfesorPayload({ profesor, sedes, tallerIds, formaciones, magister });
        if (payloadValidation.errors.length > 0) {
            throw createHttpError(400, payloadValidation.errors[0], { errors: payloadValidation.errors });
        }

        await validateCatalogReferences(connection, {
            tallerIds,
            formacionIds,
            magisterId,
            sedeIds: payloadValidation.sedeIds,
        });

        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE profesores
             SET nombre = ?, departamento = ?, Estado_I = ?, Otro_I = ?
             WHERE id_profesor = ? AND deleted_at IS NULL`,
            [profesor.nombre, profesor.departamento, profesor.estado_I, profesor.otro_i, idProfesor]
        );

        if (result.affectedRows === 0) {
            throw createHttpError(404, 'Profesor no encontrado.');
        }

        await syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, magisterId);
        await replaceProfesorSedes(connection, idProfesor, payloadValidation.sedes);

        await connection.commit();
        return { message: 'Profesor actualizado exitosamente.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteProfesorService(idProfesor) {
    const [result] = await db.execute(
        'UPDATE profesores SET deleted_at = NOW() WHERE id_profesor = ? AND deleted_at IS NULL',
        [idProfesor]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Profesor no encontrado.');
    }

    return { message: 'Profesor eliminado exitosamente.' };
}

export async function getCatalogoSedesService(queryObject = {}) {
    const q = normalizeText(queryObject?.q);
    let query = `
        SELECT id_sede, nombre_sede, codigo_sede, direccion, ciudad, estado
        FROM catalogo_sedes
        WHERE estado = 'activa'
    `;
    const params = [];

    if (q) {
        query += `
            AND (
                nombre_sede LIKE ?
                OR COALESCE(codigo_sede, '') LIKE ?
                OR COALESCE(ciudad, '') LIKE ?
            )
        `;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY nombre_sede ASC LIMIT 20';

    const [rows] = await db.execute(query, params);
    return rows;
}

export async function getProfesorSedesService(idProfesor) {
    const connection = await db.getConnection();
    try {
        const [profesores] = await connection.execute(
            'SELECT id_profesor FROM profesores WHERE id_profesor = ? AND deleted_at IS NULL',
            [idProfesor]
        );

        if (!profesores.length) {
            throw createHttpError(404, 'Profesor no encontrado.');
        }

        return await fetchProfesorSedesRows(connection, idProfesor);
    } finally {
        connection.release();
    }
}

export async function getCatalogoTalleresService() {
    const [rows] = await db.execute(
        `SELECT
            ct.id_taller,
            ct.nombre_taller,
            ct.descripcion,
            ct.estado,
            COUNT(pt.id_profesor) AS profesores_asociados
         FROM catalogo_talleres ct
         LEFT JOIN profesor_talleres pt ON pt.id_taller = ct.id_taller
         GROUP BY ct.id_taller, ct.nombre_taller, ct.descripcion, ct.estado
         ORDER BY ct.nombre_taller ASC`
    );

    return rows.map((row) => ({
        ...row,
        profesores_asociados: safeNumber(row.profesores_asociados, 0),
    }));
}

export async function createCatalogoTallerService(body) {
    const nombre_taller = normalizeText(body?.nombre_taller);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_taller) {
        throw createHttpError(400, 'El nombre del taller es obligatorio.');
    }

    if (!validateLength('nombre_taller', nombre_taller)) {
        throw createHttpError(400, 'El nombre del taller no puede superar 150 caracteres.');
    }

    if (!['activo', 'inactivo'].includes(estado)) {
        throw createHttpError(400, 'El estado del taller es inválido.');
    }

    const [existingRows] = await db.execute(
        'SELECT id_taller FROM catalogo_talleres WHERE LOWER(nombre_taller) = LOWER(?)',
        [nombre_taller]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un taller con ese nombre.');
    }

    const [result] = await db.execute(
        'INSERT INTO catalogo_talleres (nombre_taller, descripcion, estado) VALUES (?, ?, ?)',
        [nombre_taller, descripcion || null, estado]
    );

    return { message: 'Taller creado correctamente.', id_taller: result.insertId };
}

export async function updateCatalogoTallerService(idTaller, body) {
    const nombre_taller = normalizeText(body?.nombre_taller);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_taller) {
        throw createHttpError(400, 'El nombre del taller es obligatorio.');
    }

    if (!validateLength('nombre_taller', nombre_taller)) {
        throw createHttpError(400, 'El nombre del taller no puede superar 150 caracteres.');
    }

    if (!['activo', 'inactivo'].includes(estado)) {
        throw createHttpError(400, 'El estado del taller es inválido.');
    }

    const [existingRows] = await db.execute(
        'SELECT id_taller FROM catalogo_talleres WHERE LOWER(nombre_taller) = LOWER(?) AND id_taller <> ?',
        [nombre_taller, idTaller]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un taller con ese nombre.');
    }

    const [result] = await db.execute(
        `UPDATE catalogo_talleres
         SET nombre_taller = ?, descripcion = ?, estado = ?
         WHERE id_taller = ?`,
        [nombre_taller, descripcion || null, estado, idTaller]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Taller no encontrado.');
    }

    return { message: 'Taller actualizado correctamente.' };
}

export async function deleteCatalogoTallerService(idTaller) {
    const [relations] = await db.execute(
        'SELECT COUNT(*) AS total FROM profesor_talleres WHERE id_taller = ?',
        [idTaller]
    );

    if (safeNumber(relations[0]?.total, 0) > 0) {
        throw createHttpError(400, 'No se puede eliminar el taller porque está asociado a uno o más profesores.');
    }

    const [result] = await db.execute('DELETE FROM catalogo_talleres WHERE id_taller = ?', [idTaller]);
    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Taller no encontrado.');
    }

    return { message: 'Taller eliminado correctamente.' };
}

export async function uploadProfesoresCSVService(req) {
    const fs = req.app.locals.fs;
    const csvParser = req.app.locals.csvParser;

    if (!req.file) {
        throw createHttpError(400, 'No se envió ningún archivo CSV.');
    }

    const filePath = req.file.path;
    const parsedRows = [];
    let detectedHeaders = [];
    let totalRowsRead = 0;

    const cleanup = () => {
        try {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (cleanupError) {
            console.error('Error al eliminar archivo temporal:', cleanupError);
        }
    };

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('headers', (headers) => {
                    detectedHeaders = headers;
                })
                .on('data', (row) => {
                    totalRowsRead += 1;
                    parsedRows.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        const headerValidation = validateHeaders(detectedHeaders);

        if (!headerValidation.valid) {
            throw createHttpError(400, 'El CSV no contiene los encabezados obligatorios.', {
                extra: {
                    missing_headers: headerValidation.missingHeaders,
                    expected_required_headers: REQUIRED_HEADERS,
                    expected_optional_headers: OPTIONAL_HEADERS,
                },
            });
        }

        if (totalRowsRead === 0) {
            throw createHttpError(400, 'El archivo CSV está vacío.');
        }

        if (totalRowsRead > MAX_ROWS_PER_UPLOAD) {
            throw createHttpError(400, `El archivo supera el máximo permitido de ${MAX_ROWS_PER_UPLOAD} filas.`, {
                extra: { total_filas: totalRowsRead },
            });
        }

        const detailErrors = [];
        const duplicatesInFile = [];
        const validCandidates = [];
        const seenKeys = new Set();

        parsedRows.forEach((rawRow, index) => {
            const rowNumber = index + 2;
            const mapped = mapCsvRow(rawRow);
            const validationErrors = validateProfesorRecord(mapped, rowNumber);

            if (validationErrors.length > 0) {
                detailErrors.push(...validationErrors);
                return;
            }

            const duplicateKey = makeDuplicateKey(mapped);
            if (seenKeys.has(duplicateKey)) {
                duplicatesInFile.push({
                    fila: rowNumber,
                    campo: 'registro',
                    error: 'Registro duplicado dentro del mismo archivo.',
                    clave: duplicateKey,
                });
                return;
            }

            seenKeys.add(duplicateKey);
            validCandidates.push({ rowNumber, data: mapped, duplicateKey });
        });

        let existingDuplicates = [];
        let rowsToInsert = validCandidates;

        if (validCandidates.length > 0) {
            const uniqueCombos = validCandidates.map(({ data }) => [data.nombre, data.departamento]);

            const duplicateQuery = `
                SELECT nombre, departamento
                FROM profesores
                WHERE deleted_at IS NULL
                AND (nombre, departamento) IN (${uniqueCombos.map(() => '(?, ?)').join(', ')})
            `;

            const [existingRows] = await db.execute(duplicateQuery, uniqueCombos.flat());
            const existingSet = new Set(existingRows.map((row) => makeDuplicateKey(row)));

            existingDuplicates = validCandidates
                .filter(({ duplicateKey }) => existingSet.has(duplicateKey))
                .map(({ rowNumber, duplicateKey }) => ({
                    fila: rowNumber,
                    campo: 'registro',
                    error: 'El profesor ya existe en la base de datos.',
                    clave: duplicateKey,
                }));

            rowsToInsert = validCandidates.filter(({ duplicateKey }) => !existingSet.has(duplicateKey));
        }

        const summary = {
            message: 'Carga masiva procesada.',
            total_filas: totalRowsRead,
            filas_validas: validCandidates.length,
            insertados: 0,
            duplicados_archivo: duplicatesInFile.length,
            duplicados_bd: existingDuplicates.length,
            errores: detailErrors.length,
            detalle_errores: [...detailErrors, ...duplicatesInFile, ...existingDuplicates],
        };

        if (rowsToInsert.length === 0) {
            cleanup();
            return summary;
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const insertData = rowsToInsert.map(({ data }) => [
                data.nombre,
                data.departamento,
                data.estado_I ?? 0,
                data.otro_i || '',
            ]);

            const [result] = await connection.query(
                `INSERT INTO profesores
                 (nombre, departamento, Estado_I, Otro_I)
                 VALUES ?`,
                [insertData]
            );

            await connection.commit();
            summary.insertados = result.affectedRows;
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

        cleanup();
        return summary;
    } catch (error) {
        cleanup();
        throw error;
    }
}

export async function getCatalogoFormacionesService() {
    const [rows] = await db.execute(
        `SELECT
            cfd.id_catalogo_formacion,
            cfd.nombre_actividad,
            cfd.tipo_formacion,
            cfd.institucion,
            cfd.descripcion,
            cfd.estado,
            COUNT(pfd.id_formacion) AS profesores_asociados
         FROM catalogo_formaciones_docentes cfd
         LEFT JOIN profesor_formacion_docente pfd
           ON pfd.id_catalogo_formacion = cfd.id_catalogo_formacion
         GROUP BY
            cfd.id_catalogo_formacion,
            cfd.nombre_actividad,
            cfd.tipo_formacion,
            cfd.institucion,
            cfd.descripcion,
            cfd.estado
         ORDER BY cfd.nombre_actividad ASC`
    );

    return rows.map((row) => ({
        ...row,
        profesores_asociados: safeNumber(row.profesores_asociados, 0),
    }));
}

export async function createCatalogoFormacionService(body) {
    const nombre_actividad = normalizeText(body?.nombre_actividad);
    const tipo_formacion = normalizeText(body?.tipo_formacion);
    const institucion = normalizeText(body?.institucion);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_actividad) {
        throw createHttpError(400, 'El nombre de la actividad es obligatorio.');
    }

    if (!VALID_TIPOS_FORMACION.includes(tipo_formacion)) {
        throw createHttpError(400, 'El tipo de formación es inválido.');
    }

    if (!['activo', 'inactivo'].includes(estado)) {
        throw createHttpError(400, 'El estado es inválido.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_formacion
         FROM catalogo_formaciones_docentes
         WHERE LOWER(nombre_actividad) = LOWER(?)
           AND LOWER(tipo_formacion) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))`,
        [nombre_actividad, tipo_formacion, institucion || null]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe una formación con esos datos.');
    }

    const [result] = await db.execute(
        `INSERT INTO catalogo_formaciones_docentes
         (nombre_actividad, tipo_formacion, institucion, descripcion, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre_actividad, tipo_formacion, institucion || null, descripcion || null, estado]
    );

    return {
        message: 'Formación creada correctamente.',
        id_catalogo_formacion: result.insertId,
    };
}

export async function updateCatalogoFormacionService(idCatalogoFormacion, body) {
    const nombre_actividad = normalizeText(body?.nombre_actividad);
    const tipo_formacion = normalizeText(body?.tipo_formacion);
    const institucion = normalizeText(body?.institucion);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_actividad) {
        throw createHttpError(400, 'El nombre de la actividad es obligatorio.');
    }

    if (!VALID_TIPOS_FORMACION.includes(tipo_formacion)) {
        throw createHttpError(400, 'El tipo de formación es inválido.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_formacion
         FROM catalogo_formaciones_docentes
         WHERE LOWER(nombre_actividad) = LOWER(?)
           AND LOWER(tipo_formacion) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))
           AND id_catalogo_formacion <> ?`,
        [nombre_actividad, tipo_formacion, institucion || null, idCatalogoFormacion]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe una formación con esos datos.');
    }

    const [result] = await db.execute(
        `UPDATE catalogo_formaciones_docentes
         SET nombre_actividad = ?, tipo_formacion = ?, institucion = ?, descripcion = ?, estado = ?
         WHERE id_catalogo_formacion = ?`,
        [nombre_actividad, tipo_formacion, institucion || null, descripcion || null, estado, idCatalogoFormacion]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Formación no encontrada.');
    }

    return { message: 'Formación actualizada correctamente.' };
}

export async function deleteCatalogoFormacionService(idCatalogoFormacion) {
    const [relations] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM profesor_formacion_docente
         WHERE id_catalogo_formacion = ?`,
        [idCatalogoFormacion]
    );

    if (safeNumber(relations[0]?.total, 0) > 0) {
        throw createHttpError(400, 'No se puede eliminar la formación porque está asociada a uno o más profesores.');
    }

    const [result] = await db.execute(
        'DELETE FROM catalogo_formaciones_docentes WHERE id_catalogo_formacion = ?',
        [idCatalogoFormacion]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Formación no encontrada.');
    }

    return { message: 'Formación eliminada correctamente.' };
}

export async function getCatalogoMagisterService() {
    const [rows] = await db.execute(
        `SELECT
            cm.id_catalogo_magister,
            cm.nombre_magister,
            cm.institucion,
            cm.area_estudio,
            cm.descripcion,
            cm.estado,
            COUNT(pm.id_magister) AS profesores_asociados
         FROM catalogo_magister cm
         LEFT JOIN profesor_magister pm
           ON pm.id_catalogo_magister = cm.id_catalogo_magister
         GROUP BY
            cm.id_catalogo_magister,
            cm.nombre_magister,
            cm.institucion,
            cm.area_estudio,
            cm.descripcion,
            cm.estado
         ORDER BY cm.nombre_magister ASC`
    );

    return rows.map((row) => ({
        ...row,
        profesores_asociados: safeNumber(row.profesores_asociados, 0),
    }));
}

export async function createCatalogoMagisterService(body) {
    const nombre_magister = normalizeText(body?.nombre_magister);
    const institucion = normalizeText(body?.institucion);
    const area_estudio = normalizeText(body?.area_estudio);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_magister) {
        throw createHttpError(400, 'El nombre del magíster es obligatorio.');
    }

    if (!institucion) {
        throw createHttpError(400, 'La institución es obligatoria.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_magister
         FROM catalogo_magister
         WHERE LOWER(nombre_magister) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))`,
        [nombre_magister, institucion || null]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un magíster con ese nombre e institución.');
    }

    const [result] = await db.execute(
        `INSERT INTO catalogo_magister
         (nombre_magister, institucion, area_estudio, descripcion, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre_magister, institucion || null, area_estudio || null, descripcion || null, estado]
    );

    return {
        message: 'Magíster creado correctamente.',
        id_catalogo_magister: result.insertId,
    };
}

export async function updateCatalogoMagisterService(idCatalogoMagister, body) {
    const nombre_magister = normalizeText(body?.nombre_magister);
    const institucion = normalizeText(body?.institucion);
    const area_estudio = normalizeText(body?.area_estudio);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_magister) {
        throw createHttpError(400, 'El nombre del magíster es obligatorio.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_magister
         FROM catalogo_magister
         WHERE LOWER(nombre_magister) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))
           AND id_catalogo_magister <> ?`,
        [nombre_magister, institucion || null, idCatalogoMagister]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un magíster con ese nombre e institución.');
    }

    const [result] = await db.execute(
        `UPDATE catalogo_magister
         SET nombre_magister = ?, institucion = ?, area_estudio = ?, descripcion = ?, estado = ?
         WHERE id_catalogo_magister = ?`,
        [nombre_magister, institucion || null, area_estudio || null, descripcion || null, estado, idCatalogoMagister]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Magíster no encontrado.');
    }

    return { message: 'Magíster actualizado correctamente.' };
}

export async function deleteCatalogoMagisterService(idCatalogoMagister) {
    const [relations] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM profesor_magister
         WHERE id_catalogo_magister = ?`,
        [idCatalogoMagister]
    );

    if (safeNumber(relations[0]?.total, 0) > 0) {
        throw createHttpError(400, 'No se puede eliminar el magíster porque está asociado a uno o más profesores.');
    }

    const [result] = await db.execute(
        'DELETE FROM catalogo_magister WHERE id_catalogo_magister = ?',
        [idCatalogoMagister]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Magíster no encontrado.');
    }

    return { message: 'Magíster eliminado correctamente.' };
}
