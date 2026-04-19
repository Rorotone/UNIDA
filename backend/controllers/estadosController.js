import db from '../config/database.js';

// Obtener todos los estados
export const obtenerEstados = async (req, res) => {
  try {
    const [estados] = await db.execute(
      'SELECT id, nombre, es_final FROM estados_tarea ORDER BY id ASC'
    );
    res.status(200).json(estados);
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Obtener transiciones válidas desde un estado origen
export const obtenerTransiciones = async (req, res) => {
  try {
    const { id_estado } = req.params;

    const [transiciones] = await db.execute(
      `SELECT e.id, e.nombre, e.es_final
       FROM transiciones_estado t
       JOIN estados_tarea e ON t.estado_destino = e.id
       WHERE t.estado_origen = ?
       ORDER BY e.id ASC`,
      [id_estado]
    );

    res.status(200).json(transiciones);
  } catch (error) {
    console.error('Error al obtener transiciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Obtener historial de una tarea
export const obtenerHistorialTarea = async (req, res) => {
  try {
    const { id_tarea } = req.params;

    const [historial] = await db.execute(
      `SELECT h.id, h.fecha,
              ea.nombre AS estado_anterior,
              en.nombre AS estado_nuevo,
              u.nombre  AS usuario,
              u.username AS username
       FROM historial_tareas h
       LEFT JOIN estados_tarea ea ON h.estado_anterior = ea.id
       JOIN      estados_tarea en ON h.estado_nuevo    = en.id
       JOIN      users         u  ON h.id_usuario      = u.id
       WHERE h.id_tarea = ?
       ORDER BY h.fecha DESC`,
      [id_tarea]
    );

    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};