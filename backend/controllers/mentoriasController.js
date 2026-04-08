import db from "../config/database.js";

/**
 * =====================================================
 * TODOS LOS USERS SON MENTORES
 * =====================================================
 */
export const obtenerMentores = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, username
      FROM users
      ORDER BY username ASC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener mentores:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * MENTORÍAS
 * =====================================================
 */
export const crearMentoria = async (req, res) => {
  try {
    const { titulo, id_mentor, id_profesor, fecha_inicio, fecha_termino } = req.body;

    if (!titulo || !id_mentor || !id_profesor || !fecha_inicio || !fecha_termino) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios."
      });
    }

    const [result] = await db.execute(
      `INSERT INTO mentorias (titulo, id_mentor, id_profesor, fecha_inicio, fecha_termino)
       VALUES (?, ?, ?, ?, ?)`,
      [titulo, id_mentor, id_profesor, fecha_inicio, fecha_termino]
    );

    res.status(201).json({
      message: "Mentoría creada exitosamente",
      id: result.insertId
    });
  } catch (error) {
    console.error("Error al crear mentoría:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const obtenerMentorias = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        m.id,
        m.titulo,
        m.id_mentor,
        m.id_profesor,
        m.fecha_inicio,
        m.fecha_termino,
        m.completada,
        u.username AS mentor,
        p.nombre AS profesor
      FROM mentorias m
      JOIN users u ON m.id_mentor = u.id
      JOIN profesores p ON m.id_profesor = p.id_profesor
      ORDER BY m.id DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener mentorías:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * TAREAS
 * =====================================================
 */
export const crearTarea = async (req, res) => {
  try {
    const { id_mentoria } = req.params;
    const { titulo, descripcion, fecha } = req.body;
 
    if (!titulo || !descripcion) {
      return res.status(400).json({
        message: "Título y descripción son obligatorios."
      });
    }
 
    const [mentoria] = await db.execute(
      "SELECT id, fecha_inicio, fecha_termino FROM mentorias WHERE id = ?",
      [id_mentoria]
    );
 
    if (mentoria.length === 0) {
      return res.status(404).json({ message: "Mentoría no encontrada." });
    }
 
    // Validar que la fecha de la tarea esté dentro del período de la mentoría
    if (fecha) {
      const parsearFecha = (valor) => {
        const [y, m, d] = String(valor).slice(0, 10).split("-").map(Number);
        return new Date(y, m - 1, d).getTime();
      };

      const fechaTareaMs = parsearFecha(fecha);
      const inicioMs = parsearFecha(mentoria[0].fecha_inicio);
      const terminoMs = parsearFecha(mentoria[0].fecha_termino);

      if (fechaTareaMs < inicioMs || fechaTareaMs > terminoMs) {
        const inicioStr = String(mentoria[0].fecha_inicio).slice(0, 10);
        const terminoStr = String(mentoria[0].fecha_termino).slice(0, 10);
        return res.status(400).json({
          message: `La fecha de la tarea debe estar dentro del período de la mentoría (${inicioStr} → ${terminoStr}).`
        });
      }
    }
 
    const [result] = await db.execute(
      `INSERT INTO tareas (id_mentoria, titulo, descripcion, fecha)
       VALUES (?, ?, ?, ?)`,
      [id_mentoria, titulo, descripcion, fecha || null]
    );
 
    res.status(201).json({
      message: "Tarea creada exitosamente",
      id: result.insertId
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const obtenerTareas = async (req, res) => {
  try {
    const { id_mentoria } = req.params;

    const [rows] = await db.execute(
      `SELECT id, id_mentoria, titulo, descripcion, fecha, estado, archivo, created_at
       FROM tareas
       WHERE id_mentoria = ?
       ORDER BY created_at DESC, id DESC`,
      [id_mentoria]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * COMPLETAR MENTORÍA (marca todas las tareas)
 * =====================================================
 */
export const completarMentoria = async (req, res) => {
  try {
    const { id_mentoria } = req.params;

    const [mentoria] = await db.execute(
      "SELECT id FROM mentorias WHERE id = ?",
      [id_mentoria]
    );

    if (mentoria.length === 0) {
      return res.status(404).json({ message: "Mentoría no encontrada." });
    }

    await db.execute(
      "UPDATE tareas SET estado = 2 WHERE id_mentoria = ?",
      [id_mentoria]
    );

    await db.execute(
      "UPDATE mentorias SET completada = 1 WHERE id = ?",
      [id_mentoria]
    );

    res.status(200).json({
      message: "Mentoría completada (todas las tareas marcadas)."
    });
  } catch (error) {
    console.error("Error al completar mentoría:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * MARCAR TODAS LAS TAREAS
 * =====================================================
 */
export const marcarTodasTareas = async (req, res) => {
  try {
    const { id_mentoria } = req.params;
    const { completada } = req.body;

    const [mentoria] = await db.execute(
      "SELECT id FROM mentorias WHERE id = ?",
      [id_mentoria]
    );

    if (mentoria.length === 0) {
      return res.status(404).json({ message: "Mentoría no encontrada." });
    }

    await db.execute(
      "UPDATE tareas SET estado = ? WHERE id_mentoria = ?",
      [completada, id_mentoria]
    );

    // Actualizar estado de la mentoría según si todas las tareas quedan completadas
    const todasCompletadas = Number(completada) === 2;
    await db.execute(
      "UPDATE mentorias SET completada = ? WHERE id = ?",
      [todasCompletadas ? 1 : 0, id_mentoria]
    );

    res.status(200).json({
      message: "Tareas actualizadas correctamente."
    });
  } catch (error) {
    console.error("Error al marcar tareas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * ACTUALIZAR / ELIMINAR
 * =====================================================
 */
export const actualizarTarea = async (req, res) => {
  try {
    const { id_mentoria, id_tarea } = req.params;
    const { completada } = req.body;

    const [task] = await db.execute(
      "SELECT id FROM tareas WHERE id = ? AND id_mentoria = ?",
      [id_tarea, id_mentoria]
    );

    if (task.length === 0) {
      return res.status(404).json({
        message: "Tarea no encontrada."
      });
    }

    await db.execute(
      "UPDATE tareas SET estado = ? WHERE id = ? AND id_mentoria = ?",
      [Number(completada), id_tarea, id_mentoria]
    );

    // Verificar si todas las tareas de la mentoría están completadas (estado = 2)
    const [tareas] = await db.execute(
      "SELECT COUNT(*) as total, SUM(estado = 2) as completadas FROM tareas WHERE id_mentoria = ?",
      [id_mentoria]
    );

    const { total, completadas } = tareas[0];
    const todasCompletadas = total > 0 && Number(completadas) === Number(total);

    await db.execute(
      "UPDATE mentorias SET completada = ? WHERE id = ?",
      [todasCompletadas ? 1 : 0, id_mentoria]
    );

    res.status(200).json({ message: "Tarea actualizada.", mentoriaCompletada: todasCompletadas });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const eliminarTarea = async (req, res) => {
  try {
    const { id_mentoria, id_tarea } = req.params;

    await db.execute(
      "DELETE FROM tareas WHERE id = ? AND id_mentoria = ?",
      [id_tarea, id_mentoria]
    );

    res.status(200).json({ message: "Tarea eliminada." });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const eliminarMentoria = async (req, res) => {
  try {
    const { id_mentoria } = req.params;

    await db.execute("DELETE FROM tareas WHERE id_mentoria = ?", [id_mentoria]);
    await db.execute("DELETE FROM mentorias WHERE id = ?", [id_mentoria]);

    res.status(200).json({ message: "Mentoría eliminada." });
  } catch (error) {
    console.error("Error al eliminar mentoría:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * =====================================================
 * SUBIR ARCHIVO
 * =====================================================
 */
export const subirArchivoTarea = async (req, res) => {
  try {
    const { id_mentoria, id_tarea } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió archivo." });
    }

    const archivoPath = `/uploads/${req.file.filename}`;

    await db.execute(
      "UPDATE tareas SET archivo = ? WHERE id = ? AND id_mentoria = ?",
      [archivoPath, id_tarea, id_mentoria]
    );

    res.status(200).json({
      message: "Archivo subido correctamente",
      archivo: archivoPath
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};