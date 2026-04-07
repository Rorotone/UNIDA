import express from 'express';
import * as profesoresController from '../controllers/profesoresController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas CRUD
router.post('/' , authenticateToken, profesoresController.createProfesor);
router.get('/' , authenticateToken, profesoresController.getProfesores);
router.get('/:id_profesor', authenticateToken, profesoresController.getProfesorById);
router.put('/:id_profesor', authenticateToken, profesoresController.updateProfesor);
router.delete('/:id_profesor', authenticateToken, profesoresController.deleteProfesor);

export default router;

