import express from 'express';
import { 
    crearMentoria, 
    obtenerMentorias, 
    crearTarea, 
    obtenerTareas, 
    completarMentoria, 
    eliminarMentoria,
    eliminarTarea,
    actualizarTarea 
} from '../controllers/mentoriasController.js';
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

export default router;