import db from "../config/database.js";

async function cargarArchivosPorInvestigacion(ids = []) {
  if (!ids.length) return {};

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db.execute(
    `SELECT id, id_investigacion, archivo_nombre, archivo_ruta, fecha_subida
     FROM investigaciones_archivos
     WHERE id_investigacion IN (${placeholders})
     ORDER BY id ASC`,
    ids
  );

  return rows.reduce((acc, row) => {
    if (!acc[row.id_investigacion]) acc[row.id_investigacion] = [];
    acc[row.id_investigacion].push(row);
    return acc;
  }, {});
}

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
        i.fecha_registro
      FROM investigaciones i
      JOIN profesores p ON i.id_profesor = p.id_profesor
      JOIN users u ON i.id_mentor = u.id
      ORDER BY i.id DESC
    `;

    const [rows] = await db.execute(query);
    const ids = rows.map((r) => r.id);
    const archivosPorInvestigacion = await cargarArchivosPorInvestigacion(ids);

    const resultado = rows.map((row) => ({
      ...row,
      archivos: archivosPorInvestigacion[row.id] || []
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener investigaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

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

    const investigacion = rows[0];
    const archivosPorInvestigacion = await cargarArchivosPorInvestigacion([Number(id)]);

    res.status(200).json({
      ...investigacion,
      archivos: archivosPorInvestigacion[investigacion.id] || []
    });
  } catch (error) {
    console.error("Error al obtener investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const crearInvestigacion = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;

    if (!titulo || !area || !fecha_inicio || !fecha_fin || !id_profesor || !id_mentor) {
      await conn.rollback();
      return res.status(400).json({
        message: "Título, área, fechas, profesor y mentor son obligatorios."
      });
    }

    const [result] = await conn.execute(
      `INSERT INTO investigaciones (
        titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor]
    );

    const idInvestigacion = result.insertId;
    const archivos = Array.isArray(req.files) ? req.files : [];

    for (const file of archivos) {
      await conn.execute(
        `INSERT INTO investigaciones_archivos (
          id_investigacion, archivo_nombre, archivo_ruta
        ) VALUES (?, ?, ?)`,
        [idInvestigacion, file.originalname, `/uploads/${file.filename}`]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: "Investigación creada exitosamente.",
      id: idInvestigacion
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error al crear investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  } finally {
    conn.release();
  }
};

export const actualizarInvestigacion = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;

    const [actual] = await conn.execute(
      "SELECT id FROM investigaciones WHERE id = ?",
      [id]
    );

    if (actual.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Investigación no encontrada." });
    }

    await conn.execute(
      `UPDATE investigaciones
       SET titulo = ?, area = ?, fecha_inicio = ?, fecha_fin = ?, id_profesor = ?, id_mentor = ?
       WHERE id = ?`,
      [titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor, id]
    );

    const archivos = Array.isArray(req.files) ? req.files : [];
    for (const file of archivos) {
      await conn.execute(
        `INSERT INTO investigaciones_archivos (
          id_investigacion, archivo_nombre, archivo_ruta
        ) VALUES (?, ?, ?)`,
        [id, file.originalname, `/uploads/${file.filename}`]
      );
    }

    await conn.commit();
    res.status(200).json({ message: "Investigación actualizada exitosamente." });
  } catch (error) {
    await conn.rollback();
    console.error("Error al actualizar investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  } finally {
    conn.release();
  }
};

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

export const eliminarArchivoInvestigacion = async (req, res) => {
  try {
    const { idArchivo } = req.params;

    const [result] = await db.execute(
      "DELETE FROM investigaciones_archivos WHERE id = ?",
      [idArchivo]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Archivo no encontrado." });
    }

    res.status(200).json({ message: "Archivo eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar archivo de investigación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
