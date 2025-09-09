// mentoriasController.js
import db from '../config/database.js';

export const crearMentoria = async (req, res) => {
  try {
    const { titulo, id_mentor, id_profesor } = req.body;
    const query = 'INSERT INTO mentorias (titulo, id_mentor, id_profesor) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [titulo, id_mentor, id_profesor]);
    res.status(201).json({ message: 'Mentoría creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear mentoría:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const obtenerMentorias = async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.titulo, u.username as mentor, p.nombre as profesor
      FROM mentorias m
      JOIN users u ON m.id_mentor = u.id
      JOIN profesores p ON m.id_profesor = p.id_profesor
    `;
    const [rows] = await db.execute(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener mentorías:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const crearTarea = async (req, res) => {
  try {
    const { id_mentoria, titulo, descripcion } = req.body;
    const query = 'INSERT INTO tareas (id_mentoria, titulo, descripcion) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [id_mentoria, titulo, descripcion]);
    res.status(201).json({ message: 'Tarea creada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const obtenerTareas = async (req, res) => {
  try {
    const { id_mentoria } = req.params;
    const query = 'SELECT * FROM tareas WHERE id_mentoria = ?';
    const [rows] = await db.execute(query, [id_mentoria]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const completarMentoria = async (req, res) => {
  try {
    const { id_mentoria } = req.params;
    const query = 'UPDATE mentorias SET completada = TRUE WHERE id = ?';
    const [result] = await db.execute(query, [id_mentoria]);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Mentoría completada exitosamente' });
    } else {
      res.status(404).json({ message: 'Mentoría no encontrada' });
    }
  } catch (error) {
    console.error('Error al completar mentoría:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const eliminarMentoria = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id_mentoria } = req.params;

    // First, delete all associated tasks
    const deleteTasksQuery = 'DELETE FROM tareas WHERE id_mentoria = ?';
    await connection.execute(deleteTasksQuery, [id_mentoria]);

    // Then, delete the mentorship
    const deleteMentoriaQuery = 'DELETE FROM mentorias WHERE id = ?';
    const [result] = await connection.execute(deleteMentoriaQuery, [id_mentoria]);

    if (result.affectedRows > 0) {
      await connection.commit();
      res.status(200).json({ message: 'Mentoría y tareas asociadas eliminadas exitosamente' });
    } else {
      await connection.rollback();
      res.status(404).json({ message: 'Mentoría no encontrada' });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar mentoría:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
};

export const eliminarTarea = async (req, res) => {
  const connection = await db.getConnection();
  try {
      await connection.beginTransaction();
      
      const { id_mentoria, id_tarea } = req.params;
      
      // First verify the task belongs to the mentorship
      const verifyQuery = 'SELECT id FROM tareas WHERE id = ? AND id_mentoria = ?';
      const [tasks] = await connection.execute(verifyQuery, [id_tarea, id_mentoria]);
      
      if (tasks.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'Tarea no encontrada o no pertenece a esta mentoría' });
      }

      // Then delete the task
      const deleteQuery = 'DELETE FROM tareas WHERE id = ? AND id_mentoria = ?';
      const [result] = await connection.execute(deleteQuery, [id_tarea, id_mentoria]);

      if (result.affectedRows > 0) {
          await connection.commit();
          res.status(200).json({ message: 'Tarea eliminada exitosamente' });
      } else {
          await connection.rollback();
          res.status(404).json({ message: 'Tarea no encontrada' });
      }
  } catch (error) {
      await connection.rollback();
      console.error('Error al eliminar tarea:', error);
      res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
      connection.release();
  }
};

export const actualizarTarea = async (req, res) => {
  const connection = await db.getConnection();
  try {
      await connection.beginTransaction();
      
      const { id_mentoria, id_tarea } = req.params;
      const { completada } = req.body;
      
      // First verify the task belongs to the mentorship
      const verifyQuery = 'SELECT id FROM tareas WHERE id = ? AND id_mentoria = ?';
      const [tasks] = await connection.execute(verifyQuery, [id_tarea, id_mentoria]);
      
      if (tasks.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'Tarea no encontrada o no pertenece a esta mentoría' });
      }

      // Then update the task
      const updateQuery = 'UPDATE tareas SET completada = ? WHERE id = ? AND id_mentoria = ?';
      const [result] = await connection.execute(updateQuery, [completada, id_tarea, id_mentoria]);

      if (result.affectedRows > 0) {
          await connection.commit();
          res.status(200).json({ message: 'Tarea actualizada exitosamente' });
      } else {
          await connection.rollback();
          res.status(404).json({ message: 'Tarea no encontrada' });
      }
  } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar tarea:', error);
      res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
      connection.release();
  }
};
