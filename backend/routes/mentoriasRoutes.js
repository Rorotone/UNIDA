import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
    crearMentoria,
    obtenerMentorias,
    crearTarea,
    obtenerTareas,
    completarMentoria,
    eliminarMentoria,
    eliminarTarea,
    actualizarTarea,
    subirArchivoTarea,
    marcarTodasTareas
} from '../controllers/mentoriasController.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// =====================================================
// Configuración de multer
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '../../uploads');

// Crear carpeta uploads si no existe
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// =====================================================
// Rutas de mentorías
// =====================================================
router.post('/', authenticateToken, crearMentoria);
router.get('/', authenticateToken, obtenerMentorias);
router.patch('/:id_mentoria/completar', authenticateToken, completarMentoria);
router.delete('/:id_mentoria', authenticateToken, eliminarMentoria);

// =====================================================
// Rutas de tareas anidadas en mentorías
// =====================================================
router.post('/:id_mentoria/tareas', authenticateToken, crearTarea);
router.get('/:id_mentoria/tareas', authenticateToken, obtenerTareas);
router.patch('/:id_mentoria/tareas/marcar-todas', authenticateToken, marcarTodasTareas);
router.patch('/:id_mentoria/tareas/:id_tarea', authenticateToken, actualizarTarea);
router.delete('/:id_mentoria/tareas/:id_tarea', authenticateToken, eliminarTarea);

// =====================================================
// Subida de archivo para tarea
// =====================================================
router.post(
    '/:id_mentoria/tareas/:id_tarea/archivo',
    authenticateToken,
    upload.single('archivo'),
    subirArchivoTarea
);

export default router;