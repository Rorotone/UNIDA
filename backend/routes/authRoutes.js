import express from 'express';
import { register, login, getUsers, getUserProfile, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, getUsers);
router.get('/profile', authenticateToken, getUserProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;

