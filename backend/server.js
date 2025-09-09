import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import profesoresRoutes from './routes/profesoresRoutes.js';
import mentoriasRoutes from './routes/mentoriasRoutes.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import investigacionesRoutes from './routes/investigacionesRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, '../uploads');

// Asegurarse de que el directorio uploads existe
if (!fs.existsSync(uploadsPath)){
    fs.mkdirSync(uploadsPath);
}

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:3000',
  credentials: true
}));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use('/uploads', express.static(uploadsPath));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profesores', authenticateToken, profesoresRoutes);
app.use('/api/mentorias', authenticateToken, mentoriasRoutes);
app.use('/api/investigaciones', authenticateToken, investigacionesRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
