import express from 'express';
import { getAllInvestigaciones, createInvestigacion, updateInvestigacion, deleteInvestigacion, getArchivoInvestigacion } from '../controllers/investigacionesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllInvestigaciones);
router.post('/', authenticateToken, createInvestigacion);
router.put('/:id', authenticateToken, updateInvestigacion);
router.delete('/:id', authenticateToken, deleteInvestigacion);
router.get('/:id/archivo', authenticateToken, getArchivoInvestigacion);

export default router;

