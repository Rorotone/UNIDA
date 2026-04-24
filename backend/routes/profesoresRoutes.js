import express from 'express';
import {
  uploadProfesoresCSV,
  getCatalogoTalleres,
  createCatalogoTaller,
  updateCatalogoTaller,
  deleteCatalogoTaller,
  getCatalogoFormaciones,
  createCatalogoFormacion,
  updateCatalogoFormacion,
  deleteCatalogoFormacion,
  getCatalogoMagister,
  createCatalogoMagister,
  updateCatalogoMagister,
  deleteCatalogoMagister,
  getCatalogoSedes,
  createCatalogoSede,
  updateCatalogoSede,
  deleteCatalogoSede,
  getProfesorSedes,
  createProfesor,
  getProfesores,
  getProfesorById,
  updateProfesor,
  deleteProfesor
} from '../controllers/profesores/profesores.controller.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const uploadProfesoresCSVMiddleware = (req, res, next) => {
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

router.post(
  '/carga-masiva',
  authenticateToken,
  uploadProfesoresCSVMiddleware,
  uploadProfesoresCSV
);

/* Catálogo talleres */
router.get('/catalogo-talleres', authenticateToken, getCatalogoTalleres);
router.post('/catalogo-talleres', authenticateToken, createCatalogoTaller);
router.put('/catalogo-talleres/:id_taller', authenticateToken, updateCatalogoTaller);
router.delete('/catalogo-talleres/:id_taller', authenticateToken, deleteCatalogoTaller);

/* Catálogo formaciones */
router.get('/catalogo-formaciones', authenticateToken, getCatalogoFormaciones);
router.post('/catalogo-formaciones', authenticateToken, createCatalogoFormacion);
router.put('/catalogo-formaciones/:id_catalogo_formacion', authenticateToken, updateCatalogoFormacion);
router.delete('/catalogo-formaciones/:id_catalogo_formacion', authenticateToken, deleteCatalogoFormacion);

/* Catálogo magister */
router.get('/catalogo-magister', authenticateToken, getCatalogoMagister);
router.post('/catalogo-magister', authenticateToken, createCatalogoMagister);
router.put('/catalogo-magister/:id_catalogo_magister', authenticateToken, updateCatalogoMagister);
router.delete('/catalogo-magister/:id_catalogo_magister', authenticateToken, deleteCatalogoMagister);

/* Sedes */
router.get('/catalogo-sedes', authenticateToken, getCatalogoSedes);
router.post('/catalogo-sedes', authenticateToken, createCatalogoSede);
router.put('/catalogo-sedes/:id_sede', authenticateToken, updateCatalogoSede);
router.delete('/catalogo-sedes/:id_sede', authenticateToken, deleteCatalogoSede);
router.get('/:id_profesor/sedes', authenticateToken, getProfesorSedes);

/* Profesores */
router.post('/', authenticateToken, createProfesor);
router.get('/', authenticateToken, getProfesores);
router.get('/:id_profesor', authenticateToken, getProfesorById);
router.put('/:id_profesor', authenticateToken, updateProfesor);
router.delete('/:id_profesor', authenticateToken, deleteProfesor);

export default router;