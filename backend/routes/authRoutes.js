import express from 'express';
import { register, login, getUsers, getUserProfile, changePassword, getTiposUsuario } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authenticateToken, requireAdmin, register);
router.post('/login', login);
router.get('/users', authenticateToken, getUsers);
router.get('/profile', authenticateToken, getUserProfile);
router.post('/change-password', authenticateToken, changePassword);
router.get('/tipos-usuario', authenticateToken, requireAdmin, getTiposUsuario);

export default router;