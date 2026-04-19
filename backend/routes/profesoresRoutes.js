import express from 'express';
import * as profesoresController from '../controllers/profesoresController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const uploadProfesoresCSV = (req, res, next) => {
    const upload = req.app.locals.uploadProfesoresCSV;

    if (!upload) {
        return res.status(500).json({
            message: 'La configuración de carga masiva no está disponible.'
        });
    }

    upload.single('archivo')(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                message: error.message || 'Error al subir el archivo.'
            });
        }

        next();
    });
};

router.post('/carga-masiva', authenticateToken, uploadProfesoresCSV, profesoresController.uploadProfesoresCSV);

router.get('/catalogo-talleres', authenticateToken, profesoresController.getCatalogoTalleres);
router.post('/catalogo-talleres', authenticateToken, profesoresController.createCatalogoTaller);
router.put('/catalogo-talleres/:id_taller', authenticateToken, profesoresController.updateCatalogoTaller);
router.delete('/catalogo-talleres/:id_taller', authenticateToken, profesoresController.deleteCatalogoTaller);
router.get('/catalogo-sedes', authenticateToken, profesoresController.getCatalogoSedes);
router.get('/:id_profesor/sedes', authenticateToken, profesoresController.getProfesorSedes);

router.post('/', authenticateToken, profesoresController.createProfesor);
router.get('/', authenticateToken, profesoresController.getProfesores);
router.get('/:id_profesor', authenticateToken, profesoresController.getProfesorById);
router.put('/:id_profesor', authenticateToken, profesoresController.updateProfesor);
router.delete('/:id_profesor', authenticateToken, profesoresController.deleteProfesor);

export default router;
