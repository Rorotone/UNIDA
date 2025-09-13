import express from 'express';
import { 
    crearMentoria, 
    obtenerMentorias, 
    crearTarea, 
    obtenerTareas, 
    completarMentoria, 
    eliminarMentoria,
    eliminarTarea,
    actualizarTarea,
    subirArchivoTarea
} from '../controllers/mentoriasController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
// Configuración de multer para esta ruta (idéntica a server.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mentoría routes
router.post('/', authenticateToken, crearMentoria);
router.get('/', authenticateToken, obtenerMentorias);
router.put('/:id_mentoria/completar', authenticateToken, completarMentoria);
router.delete('/:id_mentoria', authenticateToken, eliminarMentoria);

// Tareas routes (nested under mentorías)
router.post('/:id_mentoria/tareas', authenticateToken, crearTarea);
router.get('/:id_mentoria/tareas', authenticateToken, obtenerTareas);
router.delete('/:id_mentoria/tareas/:id_tarea', authenticateToken, eliminarTarea);
router.put('/:id_mentoria/tareas/:id_tarea', authenticateToken, actualizarTarea);

// Subida de archivo para tarea
router.post('/:id_mentoria/tareas/:id_tarea/archivo', authenticateToken, upload.single('archivo'), subirArchivoTarea);

export default router;