
import db from "../config/database.js";

/**
 * GET /api/investigaciones
 * Lista investigaciones con nombre de profesor y mentor.
 */
export const obtenerInvestigaciones = async (req, res) => {
  try {
    const query = `
      SELECT
        i.id,
        i.titulo,
        i.area,
        i.fecha_inicio,
        i.fecha_fin,
        i.id_profesor,
        i.id_mentor,
        p.nombre AS profesor,
        u.username AS mentor,
        i.archivo_nombre,
        i.archivo_ruta,
        i.fecha_registro
      FROM investigaciones i
      JOIN profesores p ON i.id_profesor = p.id_profesor
      JOIN users u ON i.id_mentor = u.id
      ORDER BY i.id DESC
    `;

    const [rows] = await db.execute(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener investigaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * GET /api/investigaciones/:id
 */
export const obtenerInvestigacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        i.id,
        i.titulo,
        i.area,
        i.fecha_inicio,
        i.fecha_fin,
        i.id_profesor,
        i.id_mentor,
        p.nombre AS profesor,
        u.username AS mentor,
        i.archivo_nombre,
        i.archivo_ruta,
        i.fecha_registro
      FROM investigaciones i
      JOIN profesores p ON i.id_profesor = p.id_profesor
      JOIN users u ON i.id_mentor = u.id
      WHERE i.id = ?
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Investigación no encontrada." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error al obtener investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * POST /api/investigaciones
 * Recibe multipart/form-data con archivo opcional.
 */
export const crearInvestigacion = async (req, res) => {
  try {
    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;

    if (!titulo || !area || !fecha_inicio || !fecha_fin || !id_profesor || !id_mentor) {
      return res.status(400).json({
        message: "Título, área, fechas, profesor y mentor son obligatorios."
      });
    }

    let archivo_nombre = null;
    let archivo_ruta = null;

    if (req.file) {
      archivo_nombre = req.file.originalname;
      archivo_ruta = `/uploads/${req.file.filename}`;
    }

    const query = `
      INSERT INTO investigaciones (
        titulo,
        area,
        fecha_inicio,
        fecha_fin,
        id_profesor,
        id_mentor,
        archivo_nombre,
        archivo_ruta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      titulo,
      area,
      fecha_inicio,
      fecha_fin,
      id_profesor,
      id_mentor,
      archivo_nombre,
      archivo_ruta
    ]);

    res.status(201).json({
      message: "Investigación creada exitosamente.",
      id: result.insertId,
      archivo_nombre,
      archivo_ruta
    });
  } catch (error) {
    console.error("Error al crear investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * PUT /api/investigaciones/:id
 * Permite reemplazar el archivo si se envía uno nuevo.
 */
export const actualizarInvestigacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;

    const [actual] = await db.execute(
      "SELECT id, archivo_nombre, archivo_ruta FROM investigaciones WHERE id = ?",
      [id]
    );

    if (actual.length === 0) {
      return res.status(404).json({ message: "Investigación no encontrada." });
    }

    let archivo_nombre = actual[0].archivo_nombre;
    let archivo_ruta = actual[0].archivo_ruta;

    if (req.file) {
      archivo_nombre = req.file.originalname;
      archivo_ruta = `/uploads/${req.file.filename}`;
    }

    const query = `
      UPDATE investigaciones
      SET
        titulo = ?,
        area = ?,
        fecha_inicio = ?,
        fecha_fin = ?,
        id_profesor = ?,
        id_mentor = ?,
        archivo_nombre = ?,
        archivo_ruta = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      titulo,
      area,
      fecha_inicio,
      fecha_fin,
      id_profesor,
      id_mentor,
      archivo_nombre,
      archivo_ruta,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Investigación no encontrada." });
    }

    res.status(200).json({
      message: "Investigación actualizada exitosamente.",
      archivo_nombre,
      archivo_ruta
    });
  } catch (error) {
    console.error("Error al actualizar investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * DELETE /api/investigaciones/:id
 */
export const eliminarInvestigacion = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM investigaciones WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Investigación no encontrada." });
    }

    res.status(200).json({ message: "Investigación eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
