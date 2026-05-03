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

    // Detect whether profesor_postgrado has the optional FK column
    const [postgradoCols] = await connection.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'profesor_postgrado'
           AND COLUMN_NAME = 'id_catalogo_postgrado'`
    );

    const hasPostgradoFk = Array.isArray(postgradoCols) && postgradoCols.length > 0;

    const [sedes, talleres, formaciones, postgrados] = await Promise.all([
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
            hasPostgradoFk
                ? `SELECT
                    id_postgrado,
                    id_profesor,
                    id_catalogo_postgrado,
                    tipo_postgrado,
                    nombre_postgrado,
                    institucion,
                    area_estudio,
                    anio_obtencion,
                    modalidad,
                    estado,
                    observaciones
                 FROM profesor_postgrado
                 WHERE id_profesor = ?
                 ORDER BY created_at ASC, id_postgrado ASC`
                : `SELECT
                    id_postgrado,
                    id_profesor,
                    tipo_postgrado,
                    nombre_postgrado,
                    institucion,
                    area_estudio,
                    anio_obtencion,
                    modalidad,
                    estado,
                    observaciones
                 FROM profesor_postgrado
                 WHERE id_profesor = ?
                 ORDER BY created_at ASC, id_postgrado ASC`,
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
        postgrados: postgrados.map((item) => ({
            ...item,
            anio_obtencion: item.anio_obtencion ? Number(item.anio_obtencion) : null,
            id_catalogo_postgrado: item.id_catalogo_postgrado ? Number(item.id_catalogo_postgrado) : null,
        })),
        cantidad_talleres: talleres.length,
        cantidad_formaciones: formaciones.length,
        cantidad_postgrados: postgrados.length,
        formacion_docente_resumen: formatSummary(talleres.length, formaciones.length, postgrados.length),
    };
}

// ─── FORMACIÓN DOCENTE ───────────────────────────────────────────────────────

async function syncFormacionDocente(connection, idProfesor, formacionIds) {
    await connection.execute(
        'DELETE FROM profesor_formacion_docente WHERE id_profesor = ?',
        [idProfesor]
    );

    if (formacionIds.length === 0) return;

    const placeholders = formacionIds.map(() => '?').join(', ');
    const [catalogoRows] = await connection.execute(
        `SELECT id_catalogo_formacion, tipo_formacion, nombre_actividad, institucion, descripcion
         FROM catalogo_formaciones_docentes
         WHERE id_catalogo_formacion IN (${placeholders})`,
        formacionIds
    );

    if (catalogoRows.length === 0) {
        throw new Error('No se encontraron registros en el catálogo de formación docente');
    }

    const insertData = catalogoRows.map((row) => [
        idProfesor,
        row.id_catalogo_formacion,
        row.tipo_formacion,
        row.nombre_actividad,
        row.institucion,
        row.descripcion,
        'vigente'
    ]);

    await connection.query(
        `INSERT INTO profesor_formacion_docente 
            (id_profesor, id_catalogo_formacion, tipo_formacion, nombre_actividad, institucion, descripcion, estado)
         VALUES ?`,
        [insertData]
    );
}

// ─── POSTGRADOS ───────────────────────────────────────────────────────────────

function normalizePostgradoIds(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

async function syncPostgrados(connection, idProfesor, postgradoIds = []) {
    await connection.execute(
        'DELETE FROM profesor_postgrado WHERE id_profesor = ?',
        [idProfesor]
    );

    if (postgradoIds.length === 0) return;

    const placeholders = postgradoIds.map(() => '?').join(', ');
    const [catalogoRows] = await connection.execute(
        `SELECT id_catalogo_postgrado, nombre_postgrado, institucion, area_estudio, descripcion
         FROM catalogo_postgrados
         WHERE id_catalogo_postgrado IN (${placeholders})`,
        postgradoIds
    );

    if (catalogoRows.length === 0) return;

    // Detect whether the relational column `id_catalogo_postgrado` exists in `profesor_postgrado`.
    // Some deployments keep legacy schema without that FK column.
    const [cols] = await connection.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'profesor_postgrado'
           AND COLUMN_NAME = 'id_catalogo_postgrado'`
    );

    const hasCatalogoFk = Array.isArray(cols) && cols.length > 0;

    if (hasCatalogoFk) {
        const insertData = catalogoRows.map((row) => [
            idProfesor,
            row.id_catalogo_postgrado,
            row.nombre_postgrado,
            row.institucion,
            row.area_estudio || null,
            null, // anio_obtencion
            null, // modalidad
            'activo',
            null, // observaciones
        ]);

        await connection.query(
            `INSERT INTO profesor_postgrado 
                (id_profesor, id_catalogo_postgrado, nombre_postgrado, institucion, area_estudio, anio_obtencion, modalidad, estado, observaciones)
             VALUES ?`,
            [insertData]
        );
    } else {
        // Legacy schema: insert without the FK column
        const insertData = catalogoRows.map((row) => [
            idProfesor,
            row.nombre_postgrado,
            row.institucion,
            row.area_estudio || null,
            null, // anio_obtencion
            null, // modalidad
            'activo',
            null, // observaciones
        ]);

        await connection.query(
            `INSERT INTO profesor_postgrado 
                (id_profesor, nombre_postgrado, institucion, area_estudio, anio_obtencion, modalidad, estado, observaciones)
             VALUES ?`,
            [insertData]
        );
    }
}
// ─── RELACIONES GENERALES ─────────────────────────────────────────────────────

async function syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, postgradoIds) {
    await connection.execute(
        'DELETE FROM profesor_talleres WHERE id_profesor = ?',
        [idProfesor]
    );
    if (tallerIds.length > 0) {
        const insertData = tallerIds.map((idTaller) => [idProfesor, idTaller]);
        await connection.query(
            'INSERT INTO profesor_talleres (id_profesor, id_taller) VALUES ?',
            [insertData]
        );
    }

    await syncFormacionDocente(connection, idProfesor, formacionIds);
    await syncPostgrados(connection, idProfesor, postgradoIds);
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
    const postgradoIds = normalizePostgradoIds(body.postgrado_ids);
    return { profesor, sedes, tallerIds, formaciones, formacionIds, postgradoIds };
}

async function validateCatalogReferences(connection, { tallerIds, formacionIds, sedeIds }) {
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

    const sedesMap = await fetchCatalogoSedesMap(connection, sedeIds);
    if (sedeIds.length !== sedesMap.size) {
        throw createHttpError(400, 'Una o más sedes seleccionadas no existen.');
    }
}

export async function createProfesorService(body) {
    const connection = await db.getConnection();

    try {
        const { profesor, sedes, tallerIds, formaciones, formacionIds, postgradoIds } = parseProfesorInput(body);

        const payloadValidation = validateProfesorPayload({ profesor, sedes, tallerIds, formaciones });
        if (payloadValidation.errors.length > 0) {
            throw createHttpError(400, payloadValidation.errors[0], { errors: payloadValidation.errors });
        }

        await validateCatalogReferences(connection, {
            tallerIds,
            formacionIds,
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

        await syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, postgradoIds);
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
            (SELECT COUNT(*) FROM profesor_talleres pt WHERE pt.id_profesor = p.id_profesor) AS cantidad_talleres,
            (SELECT COUNT(*) FROM profesor_formacion_docente pfd WHERE pfd.id_profesor = p.id_profesor) AS cantidad_formaciones,
            (SELECT COUNT(*) FROM profesor_postgrado pp WHERE pp.id_profesor = p.id_profesor) AS cantidad_postgrados,
            COALESCE(
                (SELECT GROUP_CONCAT(DISTINCT cs.nombre_sede ORDER BY cs.nombre_sede ASC SEPARATOR ', ')
                FROM profesor_sedes ps
                JOIN catalogo_sedes cs ON cs.id_sede = ps.id_sede
                WHERE ps.id_profesor = p.id_profesor),
            '') AS sedes_resumen,
            COALESCE(
                (SELECT GROUP_CONCAT(DISTINCT ps.modalidad ORDER BY cs.nombre_sede ASC SEPARATOR ', ')
                FROM profesor_sedes ps
                JOIN catalogo_sedes cs ON cs.id_sede = ps.id_sede
                WHERE ps.id_profesor = p.id_profesor),
            '') AS sedes_modalidad
        FROM profesores p
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
        conditions.push(`EXISTS (
            SELECT 1 FROM profesor_sedes ps
            JOIN catalogo_sedes cs ON cs.id_sede = ps.id_sede
            WHERE ps.id_profesor = p.id_profesor AND cs.nombre_sede LIKE ?
        )`);
        queryParams.push(`%${sede}%`);
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.nombre ASC`;

    const [rows] = await db.execute(query, queryParams);
    return rows.map((row) => ({
        ...mapProfesorListRow(row),
        sedes_resumen: row.sedes_resumen || '',
        sedes_modalidad: row.sedes_modalidad || '',
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
                nombre_sede: s.nombre_sede,      
                codigo_sede: s.codigo_sede,      
                ciudad: s.ciudad,  
                modalidad: s.modalidad,
                flexibilidad_horaria: s.flexibilidad_horaria,
            })),
            taller_ids: profesor.taller_ids,
            talleres_catalogo: profesor.talleres_catalogo ?? [],
            formacion_ids: profesor.formaciones_docentes
                .filter((item) => item.id_catalogo_formacion)
                .map((item) => item.id_catalogo_formacion),
            formaciones_docentes: profesor.formaciones_docentes ?? [],
            postgrado_ids: (profesor.postgrados ?? []).map((p) => p.id_catalogo_postgrado).filter(Boolean),
            postgrados: profesor.postgrados ?? [],
        };
    } finally {
        connection.release();
    }
}

export async function updateProfesorService(idProfesor, body) {
    const connection = await db.getConnection();

    try {
        const { profesor, sedes, tallerIds, formaciones, formacionIds, postgradoIds } = parseProfesorInput(body);

        const payloadValidation = validateProfesorPayload({ profesor, sedes, tallerIds, formaciones });
        if (payloadValidation.errors.length > 0) {
            throw createHttpError(400, payloadValidation.errors[0], { errors: payloadValidation.errors });
        }

        await validateCatalogReferences(connection, {
            tallerIds,
            formacionIds,
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

        await syncProfesorRelations(connection, idProfesor, tallerIds, formacionIds, postgradoIds);
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
        SELECT
            cs.id_sede,
            cs.nombre_sede,
            cs.codigo_sede,
            cs.direccion,
            cs.ciudad,
            cs.estado,
            cs.created_at,
            cs.updated_at,
            COUNT(ps.id_profesor_sede) AS profesores_asociados
        FROM catalogo_sedes cs
        LEFT JOIN profesor_sedes ps ON ps.id_sede = cs.id_sede
        WHERE 1 = 1
    `;
    const params = [];

    if (q) {
        query += `
            AND (
                cs.nombre_sede LIKE ?
                OR COALESCE(cs.codigo_sede, '') LIKE ?
                OR COALESCE(cs.ciudad, '') LIKE ?
                OR COALESCE(cs.direccion, '') LIKE ?
                OR COALESCE(cs.estado, '') LIKE ?
            )
        `;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += `
        GROUP BY
            cs.id_sede,
            cs.nombre_sede,
            cs.codigo_sede,
            cs.direccion,
            cs.ciudad,
            cs.estado,
            cs.created_at,
            cs.updated_at
        ORDER BY cs.nombre_sede ASC
    `;

    const [rows] = await db.execute(query, params);
    return rows.map((row) => ({
        ...row,
        profesores_asociados: safeNumber(row.profesores_asociados, 0),
    }));
}

export async function createCatalogoSedeService(body) {
    const nombre_sede = normalizeText(body?.nombre_sede);
    const codigo_sede = normalizeText(body?.codigo_sede);
    const direccion = normalizeText(body?.direccion);
    const ciudad = normalizeText(body?.ciudad);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activa';

    if (!nombre_sede) {
        throw createHttpError(400, 'El nombre de la sede es obligatorio.');
    }

    if (!validateLength('nombre_sede', nombre_sede)) {
        throw createHttpError(400, 'El nombre de la sede no puede superar 150 caracteres.');
    }

    if (!['activa', 'inactiva'].includes(estado)) {
        throw createHttpError(400, 'El estado de la sede es inválido.');
    }

    const [existingRows] = await db.execute(
        'SELECT id_sede FROM catalogo_sedes WHERE LOWER(nombre_sede) = LOWER(?)',
        [nombre_sede]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe una sede con ese nombre.');
    }

    if (codigo_sede) {
        const [existingCodeRows] = await db.execute(
            'SELECT id_sede FROM catalogo_sedes WHERE LOWER(codigo_sede) = LOWER(?)',
            [codigo_sede]
        );

        if (existingCodeRows.length > 0) {
            throw createHttpError(400, 'Ya existe una sede con ese código.');
        }
    }

    const [result] = await db.execute(
        `INSERT INTO catalogo_sedes
            (nombre_sede, codigo_sede, direccion, ciudad, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre_sede, codigo_sede || null, direccion || null, ciudad || null, estado]
    );

    return { message: 'Sede creada correctamente.', id_sede: result.insertId };
}

export async function updateCatalogoSedeService(idSede, body) {
    const nombre_sede = normalizeText(body?.nombre_sede);
    const codigo_sede = normalizeText(body?.codigo_sede);
    const direccion = normalizeText(body?.direccion);
    const ciudad = normalizeText(body?.ciudad);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activa';

    if (!nombre_sede) {
        throw createHttpError(400, 'El nombre de la sede es obligatorio.');
    }

    if (!validateLength('nombre_sede', nombre_sede)) {
        throw createHttpError(400, 'El nombre de la sede no puede superar 150 caracteres.');
    }

    if (!['activa', 'inactiva'].includes(estado)) {
        throw createHttpError(400, 'El estado de la sede es inválido.');
    }

    const [existingRows] = await db.execute(
        'SELECT id_sede FROM catalogo_sedes WHERE LOWER(nombre_sede) = LOWER(?) AND id_sede <> ?',
        [nombre_sede, idSede]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe una sede con ese nombre.');
    }

    if (codigo_sede) {
        const [existingCodeRows] = await db.execute(
            'SELECT id_sede FROM catalogo_sedes WHERE LOWER(codigo_sede) = LOWER(?) AND id_sede <> ?',
            [codigo_sede, idSede]
        );

        if (existingCodeRows.length > 0) {
            throw createHttpError(400, 'Ya existe una sede con ese código.');
        }
    }

    const [result] = await db.execute(
        `UPDATE catalogo_sedes
         SET
            nombre_sede = ?,
            codigo_sede = ?,
            direccion = ?,
            ciudad = ?,
            estado = ?,
            updated_at = CURRENT_TIMESTAMP
         WHERE id_sede = ?`,
        [nombre_sede, codigo_sede || null, direccion || null, ciudad || null, estado, idSede]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Sede no encontrada.');
    }

    return { message: 'Sede actualizada correctamente.' };
}

export async function deleteCatalogoSedeService(idSede) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [activeRelations] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM profesor_sedes ps
             INNER JOIN profesores p 
                ON p.id_profesor = ps.id_profesor
             WHERE ps.id_sede = ?
               AND p.deleted_at IS NULL`,
            [idSede]
        );

        if (safeNumber(activeRelations[0]?.total, 0) > 0) {
            throw createHttpError(
                400,
                'No se puede eliminar la sede porque está asociada a uno o más profesores activos.'
            );
        }

        await connection.execute(
            'DELETE FROM profesor_sedes WHERE id_sede = ?',
            [idSede]
        );

        const [result] = await connection.execute(
            'DELETE FROM catalogo_sedes WHERE id_sede = ?',
            [idSede]
        );

        if (result.affectedRows === 0) {
            throw createHttpError(404, 'Sede no encontrada.');
        }

        await connection.commit();

        return { message: 'Sede eliminada correctamente.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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

export async function getCatalogoPostgradosService() {
    // Some deployments may not have a foreign key column linking profesor_postgrado -> catalogo_postgrados
    // (id_catalogo_postgrado). Detect the presence of that column and adapt the JOIN accordingly.
    const [cols] = await db.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'profesor_postgrado'
           AND COLUMN_NAME = 'id_catalogo_postgrado'`
    );

    const hasCatalogoFk = Array.isArray(cols) && cols.length > 0;

    const joinClause = hasCatalogoFk
        ? `LEFT JOIN profesor_postgrado pp ON pp.id_catalogo_postgrado = cp.id_catalogo_postgrado`
        : `LEFT JOIN profesor_postgrado pp ON pp.nombre_postgrado = cp.nombre_postgrado AND COALESCE(pp.institucion, '') = COALESCE(cp.institucion, '')`;

    const [rows] = await db.execute(
        `SELECT
            cp.id_catalogo_postgrado,
            cp.nombre_postgrado,
            cp.institucion,
            cp.area_estudio,
            cp.descripcion,
            cp.estado,
            COUNT(DISTINCT pp.id_profesor) AS profesores_asociados
         FROM catalogo_postgrados cp
         ${joinClause}
         GROUP BY
            cp.id_catalogo_postgrado,
            cp.nombre_postgrado,
            cp.institucion,
            cp.area_estudio,
            cp.descripcion,
            cp.estado
         ORDER BY cp.nombre_postgrado ASC`
    );

    return rows.map((row) => ({
        ...row,
        profesores_asociados: safeNumber(row.profesores_asociados, 0),
    }));
}

export async function createCatalogoPostgradoService(body) {
    const nombre_postgrado = normalizeText(body?.nombre_postgrado);
    const institucion = normalizeText(body?.institucion);
    const area_estudio = normalizeText(body?.area_estudio);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_postgrado) {
        throw createHttpError(400, 'El nombre del postgrado es obligatorio.');
    }

    if (!institucion) {
        throw createHttpError(400, 'La institución es obligatoria.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_postgrado
         FROM catalogo_postgrados
         WHERE LOWER(nombre_postgrado) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))`,
        [nombre_postgrado, institucion || null]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un postgrado con ese nombre e institución.');
    }

    const [result] = await db.execute(
        `INSERT INTO catalogo_postgrados
         (nombre_postgrado, institucion, area_estudio, descripcion, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre_postgrado, institucion || null, area_estudio || null, descripcion || null, estado]
    );

    return {
        message: 'Postgrado creado correctamente.',
        id_catalogo_postgrado: result.insertId,
    };
}

export async function updateCatalogoPostgradoService(idCatalogoPostgrado, body) {
    const nombre_postgrado = normalizeText(body?.nombre_postgrado);
    const institucion = normalizeText(body?.institucion);
    const area_estudio = normalizeText(body?.area_estudio);
    const descripcion = normalizeText(body?.descripcion);
    const estado = normalizeText(body?.estado).toLowerCase() || 'activo';

    if (!nombre_postgrado) {
        throw createHttpError(400, 'El nombre del postgrado es obligatorio.');
    }

    const [existingRows] = await db.execute(
        `SELECT id_catalogo_postgrado
         FROM catalogo_postgrados
         WHERE LOWER(nombre_postgrado) = LOWER(?)
           AND LOWER(COALESCE(institucion, '')) = LOWER(COALESCE(?, ''))
           AND id_catalogo_postgrado <> ?`,
        [nombre_postgrado, institucion || null, idCatalogoPostgrado]
    );

    if (existingRows.length > 0) {
        throw createHttpError(400, 'Ya existe un postgrado con ese nombre e institución.');
    }

    const [result] = await db.execute(
        `UPDATE catalogo_postgrados
         SET nombre_postgrado = ?, institucion = ?, area_estudio = ?, descripcion = ?, estado = ?
         WHERE id_catalogo_postgrado = ?`,
        [nombre_postgrado, institucion || null, area_estudio || null, descripcion || null, estado, idCatalogoPostgrado]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Postgrado no encontrado.');
    }

    return { message: 'Postgrado actualizado correctamente.' };
}

export async function deleteCatalogoPostgradoService(idCatalogoPostgrado) {
    const [result] = await db.execute(
        'DELETE FROM catalogo_postgrados WHERE id_catalogo_postgrado = ?',
        [idCatalogoPostgrado]
    );

    if (result.affectedRows === 0) {
        throw createHttpError(404, 'Postgrado no encontrado.');
    }

    return { message: 'Postgrado eliminado correctamente.' };
}

// ─── DEPRECADO: Compatibilidad con rutas antiguas ─────────────────────────────
// Funciones legacy de magister redirigidas a postgrados
export async function getCatalogoMagisterService() {
    return getCatalogoPostgradosService();
}

export async function createCatalogoMagisterService(body) {
    return createCatalogoPostgradoService(body);
}

export async function updateCatalogoMagisterService(idCatalogoMagister, body) {
    return updateCatalogoPostgradoService(idCatalogoMagister, body);
}

export async function deleteCatalogoMagisterService(idCatalogoMagister) {
    return deleteCatalogoPostgradoService(idCatalogoMagister);
}