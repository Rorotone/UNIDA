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
  eliminarInvestigacion,
  eliminarArchivoInvestigacion
} from "../controllers/investigacionesController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

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
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.get("/", authenticateToken, obtenerInvestigaciones);
router.get("/:id", authenticateToken, obtenerInvestigacionPorId);
router.post("/", authenticateToken, upload.array("archivos", 10), crearInvestigacion);
router.put("/:id", authenticateToken, upload.array("archivos", 10), actualizarInvestigacion);
router.delete("/:id", authenticateToken, eliminarInvestigacion);
router.delete("/archivos/:idArchivo", authenticateToken, eliminarArchivoInvestigacion);

export default router;
