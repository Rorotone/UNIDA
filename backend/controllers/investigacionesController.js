import db from '../config/database.js';
import multer from 'multer';
import path from 'path';

// Configurar multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Asegúrate de que este directorio exista
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Nombre de archivo único
  }
});

const upload = multer({ storage: storage });

export const getAllInvestigaciones = async (req, res) => {
  try {
    let query = `
      SELECT i.*, p.nombre as profesor_nombre, u.username as mentor_nombre
      FROM investigaciones i
      JOIN profesores p ON i.id_profesor = p.id_profesor
      JOIN users u ON i.id_mentor = u.id
    `;
    
    const queryParams = [];
    const conditions = [];

    if (req.query.titulo) {
      conditions.push('i.titulo LIKE ?');
      queryParams.push(`%${req.query.titulo}%`);
    }
    if (req.query.area) {
      conditions.push('i.area LIKE ?');
      queryParams.push(`%${req.query.area}%`);
    }
    if (req.query.profesor) {
      conditions.push('p.nombre LIKE ?');
      queryParams.push(`%${req.query.profesor}%`);
    }
    if (req.query.mentor) {
      conditions.push('u.username LIKE ?');
      queryParams.push(`%${req.query.mentor}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await db.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvestigacion = [
  upload.single('archivo'), // Middleware para manejar la subida de archivos
  async (req, res) => {
    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;
    const archivo_nombre = req.file ? req.file.originalname : null;
    const archivo_ruta = req.file ? req.file.path : null;

    try {
      const [result] = await db.query(
        'INSERT INTO investigaciones (titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor, archivo_nombre, archivo_ruta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor, archivo_nombre, archivo_ruta]
      );
      res.status(201).json({ id: result.insertId, ...req.body, archivo_nombre, archivo_ruta });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
];

export const updateInvestigacion = [
  upload.single('archivo'),
  async (req, res) => {
    const { id } = req.params;
    const { titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor } = req.body;
    const archivo_nombre = req.file ? req.file.originalname : req.body.archivo_nombre;
    const archivo_ruta = req.file ? req.file.path : req.body.archivo_ruta;

    try {
      await db.query(
        'UPDATE investigaciones SET titulo = ?, area = ?, fecha_inicio = ?, fecha_fin = ?, id_profesor = ?, id_mentor = ?, archivo_nombre = ?, archivo_ruta = ? WHERE id = ?',
        [titulo, area, fecha_inicio, fecha_fin, id_profesor, id_mentor, archivo_nombre, archivo_ruta, id]
      );
      res.status(200).json({ id, ...req.body, archivo_nombre, archivo_ruta });
    } catch (error) {
      console.error('Error updating investigación:', error);
      res.status(500).json({ error: 'Error updating investigación' });
    }
  }
];
export const deleteInvestigacion = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM investigaciones WHERE id = ?', [id]);
    res.json({ message: 'Investigación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArchivoInvestigacion = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT archivo_ruta FROM investigaciones WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].archivo_ruta) {
      res.sendFile(path.resolve(rows[0].archivo_ruta));
    } else {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

