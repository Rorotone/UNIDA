
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  obtenerInvestigaciones,
  obtenerInvestigacionPorId,
  crearInvestigacion,
  actualizarInvestigacion,
  eliminarInvestigacion
} from "../controllers/investigacionesController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// Configuración de multer
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// =====================================================
// Rutas de investigaciones
// =====================================================
router.get("/", authenticateToken, obtenerInvestigaciones);
router.get("/:id", authenticateToken, obtenerInvestigacionPorId);

router.post(
  "/",
  authenticateToken,
  upload.single("archivo"),
  crearInvestigacion
);

router.put(
  "/:id",
  authenticateToken,
  upload.single("archivo"),
  actualizarInvestigacion
);

router.delete("/:id", authenticateToken, eliminarInvestigacion);

export default router;
