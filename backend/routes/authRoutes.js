import express from 'express';
import { register, login, getUsers, getUsersAdmin, updateUser, disableUser, enableUser, getUserProfile, changePassword, getTiposUsuario } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authenticateToken, requireAdmin, register);
router.post('/login', login);
router.get('/users', authenticateToken, getUsers);
router.get('/users/manage', authenticateToken, requireAdmin, getUsersAdmin);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, disableUser);
router.put('/users/:id/enable', authenticateToken, requireAdmin, enableUser);
router.get('/profile', authenticateToken, getUserProfile);
router.post('/change-password', authenticateToken, changePassword);
router.get('/tipos-usuario', authenticateToken, requireAdmin, getTiposUsuario);

export default router;
