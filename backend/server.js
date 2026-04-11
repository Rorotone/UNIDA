import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import multer from 'multer';

import authRoutes from './routes/authRoutes.js';
import profesoresRoutes from './routes/profesoresRoutes.js';
import mentoriasRoutes from './routes/mentoriasRoutes.js';
import investigacionesRoutes from './routes/investigacionesRoutes.js';

import { authenticateToken } from './middleware/authMiddleware.js';
import { obtenerMentores } from './controllers/mentoriasController.js';
import { iniciarCronVencimientos } from './jobs/vencimientoJob.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const uploadsPath = path.join(__dirname, '../uploads');
const csvUploadsPath = path.join(uploadsPath, 'csv');
const viewsPath = path.join(__dirname, '../frontend/views');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

if (!fs.existsSync(csvUploadsPath)) {
  fs.mkdirSync(csvUploadsPath, { recursive: true });
}

const profesoresCsvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, csvUploadsPath);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '.csv';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profesores-${uniqueSuffix}${extension}`);
  }
});

const profesoresCsvFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel'
  ];

  const isCsvMime = allowedMimeTypes.includes(file.mimetype);
  const isCsvExt = path.extname(file.originalname).toLowerCase() === '.csv';

  if (isCsvMime || isCsvExt) {
    return cb(null, true);
  }

  cb(new Error('Solo se permiten archivos CSV.'));
};

const uploadProfesoresCSV = multer({
  storage: profesoresCsvStorage,
  fileFilter: profesoresCsvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const app = express();

app.locals.fs = fs;
app.locals.csvParser = csv;
app.locals.uploadProfesoresCSV = uploadProfesoresCSV;

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
  iniciarCronVencimientos();
});