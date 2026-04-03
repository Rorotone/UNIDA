import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import profesoresRoutes from './routes/profesoresRoutes.js';
import mentoriasRoutes from './routes/mentoriasRoutes.js';
import investigacionesRoutes from './routes/investigacionesRoutes.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { obtenerMentores } from './controllers/mentoriasController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const uploadsPath = path.join(__dirname, '../uploads');
const viewsPath = path.join(__dirname, '../frontend/views');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:3000',
  credentials: true
}));

app.use(express.json());

// Publicar archivos subidos
app.use('/uploads', express.static(uploadsPath));

// Archivos estáticos frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(viewsPath));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/mentorias', mentoriasRoutes);
app.use('/api/investigaciones', investigacionesRoutes);

// Mentores (todos los users)
app.get('/api/mentores', authenticateToken, obtenerMentores);

// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(viewsPath, 'index.html'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(viewsPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});