import express from 'express';
import * as profesoresController from '../controllers/profesoresController.js';

const router = express.Router();

// Rutas CRUD
router.post('/', profesoresController.createProfesor);
router.get('/', profesoresController.getProfesores);
router.get('/:id_profesor', profesoresController.getProfesorById);
router.put('/:id_profesor', profesoresController.updateProfesor);
router.delete('/:id_profesor', profesoresController.deleteProfesor);

export default router;

