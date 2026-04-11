import db from '../config/database.js';

const SEDES_VALIDAS = [
    'Casona Las Condes',
    'Los Leones',
    'Antonio Varas',
    'Campus Creativo',
    'Bellavista',
    'Republica',
    'República',
    'Concepción',
    'Viña del Mar'
];

const REQUIRED_HEADERS = ['nombre', 'departamento'];
const OPTIONAL_HEADERS = ['sede', 'sede_actual', 'talleres', 'formacion', 'estado_i', 'magister', 'otro_i'];
const MAX_ROWS_PER_UPLOAD = 1000;
const MAX_LENGTHS = {
    nombre: 120,
    departamento: 120,
    sede: 80,
    sede_actual: 80,
    talleres: 150,
    otro_i: 255,
};

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

const normalizeHeader = (header) =>
    String(header ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const normalizeSede = (value) => {
    const raw = normalizeText(value);
    if (!raw) return '';

    const normalized = raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const map = {
        'casona las condes': 'Casona Las Condes',
        'los leones': 'Los Leones',
        'antonio varas': 'Antonio Varas',
        'campus creativo': 'Campus Creativo',
        'bellavista': 'Bellavista',
        'republica': 'República',
        'republica ': 'República',
        'concepcion': 'Concepción',
        'vina del mar': 'Viña del Mar',
    };

    return map[normalized] ?? raw;
};

const parseBooleanLike = (value) => {
    const normalized = normalizeText(value).toLowerCase();

    if (['1', 'true', 'si', 'sí', 'yes', 'x'].includes(normalized)) return 1;
    if (['0', 'false', 'no', '', 'null', 'n/a'].includes(normalized)) return 0;

    return null;
};

const normalizeProfesorRow = (row) => ({
    id_profesor: row.id_profesor,
    nombre: row.nombre,
    departamento: row.departamento,
    sede: row.Sede ?? row.sede ?? '',
    sede_actual: row.Sede_actual ?? row.sede_actual ?? '',
    talleres: row.Talleres ?? row.talleres ?? '',
    formacion: Number(row.Formacion ?? row.formacion ?? 0),
    estado_I: Number(row.Estado_I ?? row.estado_I ?? 0),
    magister: Number(row.Magister ?? row.magister ?? 0),
    otro_i: row.Otro_I ?? row.Otro_i ?? row.otro_i ?? '',
});

const validateHeaders = (headers) => {
    const normalizedHeaders = headers.map(normalizeHeader).filter(Boolean);
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !normalizedHeaders.includes(header));

    return {
        valid: missingHeaders.length === 0,
        missingHeaders,
        normalizedHeaders,
    };
};

const validateLength = (field, value) => !value || value.length <= MAX_LENGTHS[field];

const hasLetters = (value) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value);

const makeDuplicateKey = ({ nombre, departamento, sede_actual }) =>
    [nombre.toLowerCase(), departamento.toLowerCase(), (sede_actual || '').toLowerCase()].join('|');

const mapCsvRow = (row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
        normalizedRow[normalizeHeader(key)] = value;
    }

    return {
        nombre: normalizeText(normalizedRow.nombre),
        departamento: normalizeText(normalizedRow.departamento),
        sede: normalizeSede(normalizedRow.sede),
        sede_actual: normalizeSede(normalizedRow.sede_actual),
        talleres: normalizeText(normalizedRow.talleres),
        formacion: parseBooleanLike(normalizedRow.formacion),
        estado_I: parseBooleanLike(normalizedRow.estado_i),
        magister: parseBooleanLike(normalizedRow.magister),
        otro_i: normalizeText(normalizedRow.otro_i),
    };
};

const validateProfesorRecord = (record, rowNumber) => {
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

    if (record.sede) {
        if (!SEDES_VALIDAS.includes(record.sede)) {
            errors.push({ fila: rowNumber, campo: 'Sede', error: 'Sede no válida.' });
        }
        if (!validateLength('sede', record.sede)) {
            errors.push({ fila: rowNumber, campo: 'Sede', error: `Máximo ${MAX_LENGTHS.sede} caracteres.` });
        }
    }

    if (record.sede_actual) {
        if (!SEDES_VALIDAS.includes(record.sede_actual)) {
            errors.push({ fila: rowNumber, campo: 'Sede_actual', error: 'Sede actual no válida.' });
        }
        if (!validateLength('sede_actual', record.sede_actual)) {
            errors.push({ fila: rowNumber, campo: 'Sede_actual', error: `Máximo ${MAX_LENGTHS.sede_actual} caracteres.` });
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

    if (record.magister === null) {
        errors.push({ fila: rowNumber, campo: 'Magister', error: 'Valor inválido. Usa 0/1, sí/no, true/false.' });
    }

    return errors;
};

// Crear un nuevo profesor
export const createProfesor = async (req, res) => {
    try {
        const {
            nombre,
            departamento,
            Sede,
            sede,
            Sede_actual,
            sede_actual,
            Talleres,
            talleres,
            Formacion,
            formacion,
            Estado_I,
            estado_I,
            Magister,
            magister,
            Otro_I,
            otro_i,
        } = req.body;

        const sedeValue = Sede ?? sede ?? null;
        const sedeActualValue = Sede_actual ?? sede_actual ?? null;
        const talleresValue = Talleres ?? talleres ?? null;
        const formacionValue = Formacion ?? formacion ?? 0;
        const estadoIValue = Estado_I ?? estado_I ?? 0;
        const magisterValue = Magister ?? magister ?? 0;
        const otroIValue = Otro_I ?? otro_i ?? '';

        const query = `
            INSERT INTO profesores 
            (nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            nombre,
            departamento,
            sedeValue,
            sedeActualValue,
            talleresValue,
            formacionValue,
            estadoIValue,
            magisterValue,
            otroIValue
        ]);

        res.status(201).json({
            message: 'Profesor creado exitosamente.',
            id_profesor: result.insertId
        });
    } catch (error) {
        console.error('Error al crear profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getProfesores = async (req, res) => {
    try {
        const { nombre, departamento, sede, sede_actual, talleres, otro_i } = req.query;
        let query = `SELECT * FROM profesores WHERE deleted_at IS NULL`;
        const queryParams = [];

        if (nombre || departamento || sede || sede_actual || talleres || otro_i) {
            const conditions = [];

            if (nombre) {
                conditions.push('nombre LIKE ?');
                queryParams.push(`%${nombre}%`);
            }

            if (departamento) {
                conditions.push('departamento LIKE ?');
                queryParams.push(`%${departamento}%`);
            }

            if (sede) {
                conditions.push('Sede LIKE ?');
                queryParams.push(`%${sede}%`);
            }

            if (sede_actual) {
                conditions.push('Sede_actual LIKE ?');
                queryParams.push(`%${sede_actual}%`);
            }

            if (talleres) {
                conditions.push('Talleres LIKE ?');
                queryParams.push(`%${talleres}%`);
            }

            if (otro_i) {
                conditions.push('Otro_I LIKE ?');
                queryParams.push(`%${otro_i}%`);
            }

            query += ' AND ' + conditions.join(' AND ');
        }

        query += ' ORDER BY nombre ASC';

        const [rows] = await db.execute(query, queryParams);
        res.status(200).json(rows.map(normalizeProfesorRow));
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getProfesorById = async (req, res) => {
    try {
        const { id_profesor } = req.params;
        const [rows] = await db.execute(
            'SELECT * FROM profesores WHERE id_profesor = ? AND deleted_at IS NULL',
            [id_profesor]
        );

        if (rows.length > 0) {
            res.status(200).json(normalizeProfesorRow(rows[0]));
        } else {
            res.status(404).json({ message: 'Profesor no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const updateProfesor = async (req, res) => {
    try {
        const { id_profesor } = req.params;
        const {
            nombre,
            departamento,
            Sede,
            sede,
            Sede_actual,
            sede_actual,
            Talleres,
            talleres,
            Formacion,
            formacion,
            Estado_I,
            estado_I,
            Magister,
            magister,
            Otro_I,
            otro_i,
        } = req.body;

        const sedeValue = Sede ?? sede ?? null;
        const sedeActualValue = Sede_actual ?? sede_actual ?? null;
        const talleresValue = Talleres ?? talleres ?? null;
        const formacionValue = Formacion ?? formacion ?? 0;
        const estadoIValue = Estado_I ?? estado_I ?? 0;
        const magisterValue = Magister ?? magister ?? 0;
        const otroIValue = Otro_I ?? otro_i ?? '';

        const query = `
            UPDATE profesores 
            SET nombre = ?, departamento = ?, Sede = ?, Sede_actual = ?, Talleres = ?, Formacion = ?, Estado_I = ?, Magister = ?, Otro_I = ?
            WHERE id_profesor = ? AND deleted_at IS NULL
        `;
        const [result] = await db.execute(query, [
            nombre,
            departamento,
            sedeValue,
            sedeActualValue,
            talleresValue,
            formacionValue,
            estadoIValue,
            magisterValue,
            otroIValue,
            id_profesor
        ]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Profesor actualizado exitosamente.' });
        } else {
            res.status(404).json({ message: 'Profesor no encontrado.' });
        }
    } catch (error) {
        console.error('Error al actualizar profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const deleteProfesor = async (req, res) => {
    try {
        const { id_profesor } = req.params;
        const query = 'UPDATE profesores SET deleted_at = NOW() WHERE id_profesor = ? AND deleted_at IS NULL';
        const [result] = await db.execute(query, [id_profesor]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Profesor eliminado exitosamente.' });
        } else {
            res.status(404).json({ message: 'Profesor no encontrado.' });
        }
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const uploadProfesoresCSV = async (req, res) => {
    const fs = req.app.locals.fs;
    const csvParser = req.app.locals.csvParser;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se envió ningún archivo CSV.' });
        }

        const filePath = req.file.path;
        const parsedRows = [];
        let detectedHeaders = [];
        let totalRowsRead = 0;

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
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({
                message: 'El CSV no contiene los encabezados obligatorios.',
                missing_headers: headerValidation.missingHeaders,
                expected_required_headers: REQUIRED_HEADERS,
                expected_optional_headers: OPTIONAL_HEADERS,
            });
        }

        if (totalRowsRead === 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'El archivo CSV está vacío.' });
        }

        if (totalRowsRead > MAX_ROWS_PER_UPLOAD) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({
                message: `El archivo supera el máximo permitido de ${MAX_ROWS_PER_UPLOAD} filas.`,
                total_filas: totalRowsRead,
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
            const uniqueCombos = validCandidates.map(({ data }) => [
                data.nombre,
                data.departamento,
                data.sede_actual || ''
            ]);

            const duplicateQuery = `
                SELECT nombre, departamento, COALESCE(Sede_actual, '') AS sede_actual
                FROM profesores
                WHERE deleted_at IS NULL
                AND (nombre, departamento, COALESCE(Sede_actual, '')) IN (${uniqueCombos.map(() => '(?, ?, ?)').join(', ')})
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
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(200).json(summary);
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const insertData = rowsToInsert.map(({ data }) => [
                data.nombre,
                data.departamento,
                data.sede || null,
                data.sede_actual || null,
                data.talleres || null,
                data.formacion ?? 0,
                data.estado_I ?? 0,
                data.magister ?? 0,
                data.otro_i || '',
            ]);

            const insertQuery = `
                INSERT INTO profesores
                (nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I)
                VALUES ?
            `;

            const [result] = await connection.query(insertQuery, [insertData]);
            await connection.commit();
            summary.insertados = result.affectedRows;
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(200).json(summary);
    } catch (error) {
        console.error('Error en carga masiva de profesores:', error);

        try {
            if (req.file?.path && req.app.locals.fs.existsSync(req.file.path)) {
                req.app.locals.fs.unlinkSync(req.file.path);
            }
        } catch (cleanupError) {
            console.error('Error al eliminar archivo temporal:', cleanupError);
        }

        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};