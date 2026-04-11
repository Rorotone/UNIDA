import db from '../config/database.js';

const normalizeProfesorRow = (row) => ({
    id_profesor: row.id_profesor,
    nombre: row.nombre,
    departamento: row.departamento,
    sede: row.Sede ?? row.sede ?? '',
    sede_actual: row.Sede_actual ?? row.sede_actual ?? '',
    talleres: row.Talleres ?? row.talleres ?? '',
    formacion: row.Formacion ?? row.formacion ?? 0,
    estado_I: row.Estado_I ?? row.estado_I ?? 0,
    magister: row.Magister ?? row.magister ?? 0,
    otro_i: row.Otro_I ?? row.Otro_i ?? row.otro_i ?? '',
});

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
        const [result] = await db.execute(query, [nombre, departamento, sedeValue, sedeActualValue, talleresValue, formacionValue, estadoIValue, magisterValue, otroIValue]);
        res.status(201).json({ message: 'Profesor creado exitosamente.', id_profesor: result.insertId });
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
                conditions.push('Otro_i LIKE ?');
                queryParams.push(`%${otro_i}%`)
            }

            query += ' AND ' + conditions.join(' AND ');
        }

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
        const [rows] = await db.execute('SELECT * FROM profesores WHERE id_profesor = ?', [id_profesor]);
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
            WHERE id_profesor = ?
        `;
        const [result] = await db.execute(query, [nombre, departamento, sedeValue, sedeActualValue, talleresValue, formacionValue, estadoIValue, magisterValue, otroIValue, id_profesor]);

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
        const query = 'UPDATE profesores SET deleted_at = NOW() WHERE id_profesor = ?';
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
    const csv = req.app.locals.csvParser;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se envió ningún archivo CSV.' });
        }

        const filePath = req.file.path;
        const profesores = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    const nombre = (row.nombre ?? row.Nombre ?? '').toString().trim();
                    const departamento = (row.departamento ?? row.Departamento ?? '').toString().trim();
                    const sede = (row.Sede ?? row.sede ?? '').toString().trim();
                    const sedeActual = (row.Sede_actual ?? row.sede_actual ?? '').toString().trim();
                    const talleres = (row.Talleres ?? row.talleres ?? '').toString().trim();
                    const formacion = row.Formacion ?? row.formacion ?? 0;
                    const estadoI = row.Estado_I ?? row.estado_I ?? 0;
                    const magister = row.Magister ?? row.magister ?? 0;
                    const otroI = (row.Otro_I ?? row.otro_i ?? row.Otro_i ?? '').toString().trim();

                    if (!nombre || !departamento) {
                        return;
                    }

                    profesores.push([
                        nombre,
                        departamento,
                        sede,
                        sedeActual,
                        talleres,
                        formacion === '' ? 0 : formacion,
                        estadoI === '' ? 0 : estadoI,
                        magister === '' ? 0 : magister,
                        otroI
                    ]);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (profesores.length === 0) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return res.status(400).json({
                message: 'El archivo CSV no contiene registros válidos.'
            });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const insertQuery = `
                INSERT INTO profesores
                (nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I)
                VALUES ?
            `;

            const [result] = await connection.query(insertQuery, [profesores]);

            await connection.commit();

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return res.status(201).json({
                message: 'Carga masiva de profesores realizada exitosamente.',
                registros_insertados: result.affectedRows
            });
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error en carga masiva de profesores:', error);

        try {
            if (req.file?.path && req.app.locals.fs.existsSync(req.file.path)) {
                req.app.locals.fs.unlinkSync(req.file.path);
            }
        } catch (cleanupError) {
            console.error('Error al eliminar archivo temporal:', cleanupError);
        }

        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};