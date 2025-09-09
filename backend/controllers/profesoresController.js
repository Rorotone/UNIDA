import db from '../config/database.js';

// Crear un nuevo profesor
export const createProfesor = async (req, res) => {
    try {
        const { nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I } = req.body;
        const query = `
            INSERT INTO profesores 
            (nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I]);
        res.status(201).json({ message: 'Profesor creado exitosamente.', id_profesor: result.insertId });
    } catch (error) {
        console.error('Error al crear profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getProfesores = async (req, res) => {
    try {
        const { nombre, departamento, sede, sede_actual, talleres, otro_i } = req.query;
        let query = `SELECT * FROM profesores`;
        const queryParams = [];

        if (nombre || departamento || sede || sede_actual || talleres || otro_i) {
            query += ' WHERE';
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

            query += ' ' + conditions.join(' AND ');
        }

        const [rows] = await db.execute(query, queryParams);
        res.status(200).json(rows);
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
            res.status(200).json(rows[0]);
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
        const { nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I } = req.body;
        const query = `
            UPDATE profesores 
            SET nombre = ?, departamento = ?, Sede = ?, Sede_actual = ?, Talleres = ?, Formacion = ?, Estado_I = ?, Magister = ?, Otro_I = ?
            WHERE id_profesor = ?
        `;
        const [result] = await db.execute(query, [nombre, departamento, Sede, Sede_actual, Talleres, Formacion, Estado_I, Magister, Otro_I, id_profesor]);

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
        const query = 'DELETE FROM profesores WHERE id_profesor = ?';
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

