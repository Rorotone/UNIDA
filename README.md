# UNIDA – Plataforma Académica de Gestión de Mentorías e Investigaciones

Aplicación web full stack para centralizar la gestión académica de profesores, mentorías e investigaciones en un entorno universitario. Desarrollada como proyecto de memoria para la Universidad Andrés Bello.

---

## Descripción

UNIDA permite a equipos académicos gestionar en un solo lugar:

- El registro y administración de **profesores** con sus datos, sedes, talleres, formaciones y postgrados
- La coordinación de **mentorías** entre mentores y profesores, con tareas, workflow de estados y seguimiento
- El registro de **investigaciones** académicas con archivos adjuntos
- La **importación masiva de profesores** vía CSV
- La **actualización automática de estados** de mentorías al iniciar el servidor, según fecha actual

---

## Vistas del frontend

| Vista | Descripción |
|-------|-------------|
| `index.html` | Home / dashboard principal |
| `login.html` | Autenticación de usuarios |
| `profe.html` | Gestión de profesores (CRUD + carga CSV) |
| `mentorias.html` | Gestión de mentorías y tareas |
| `investigaciones.html` | Registro y seguimiento de investigaciones |
| `nav.html` | Barra de navegación superior compartida |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js, Express |
| Base de datos | MySQL |
| Autenticación | JWT, bcryptjs |
| Carga de archivos | Multer |
| Tareas programadas | vencimientoJob.js (al iniciar servidor) |
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Arquitectura | MVC, REST API (55 endpoints) |

---

## 📁 Estructura del proyecto

```
UNIDA/
├── backend/
│   ├── config/
│   │   └── database.js          # Conexión MySQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── mentoriasController.js
│   │   ├── investigacionesController.js
│   │   ├── estadosController.js
│   │   └── profesores/
│   │       ├── profesores.controller.js
│   │       ├── profesores.service.js
│   │       ├── profesores.validator.js
│   │       └── profesores.csv.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── mentoriasRoutes.js
│   │   ├── investigacionesRoutes.js
│   │   └── profesoresRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── jobs/
│   │   └── vencimientoJob.js    # Actualiza estados de mentorías al iniciar
│   ├── uploads/                 # Archivos subidos y CSVs importados
│   └── server.js
├── frontend/
│   ├── styles/ 	               #Diseño personalizado por vista
│   ├── views/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── profe.html
│   │   ├── mentorias.html
│   │   ├── investigaciones.html
│   │   └── nav.html
│   └── scripts/                 # Lógica JS del cliente
└── README.md
```

---

## Instalación y configuración

### Requisitos previos

- Node.js v16+
- MySQL 8+

### 1. Clonar el repositorio

```bash
git clone https://github.com/Rorotone/UNIDA.git
cd UNIDA
```

### 2. Instalar dependencias

```bash
cd backend
npm install
```
### 4. Ejecutar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`.  
Al iniciar, `vencimientoJob.js` actualizará automáticamente los estados de todas las mentorías según la fecha actual.

---

## Workflow de estados — Mentorías

Los estados de las mentorías se actualizan automáticamente cada vez que se inicia el servidor, comparando las fechas de inicio y término con la fecha actual.

```
Pendiente → En curso → Completada
               ↑
        (actualización automática al iniciar)
```

Las tareas dentro de cada mentoría también siguen un workflow de estados con transiciones validadas en base de datos e historial de cambios por usuario.

---

## API REST — Resumen de endpoints

| Módulo | Endpoints |
|--------|-----------|
| Autenticación y usuarios | 10 |
| Profesores + catálogos | 26 |
| Mentorías y tareas | 13 |
| Investigaciones | 6 |
| **Total** | **55** |

### Ejemplos

```
POST   /api/auth/login
GET    /api/profesores
POST   /api/profesores/carga-masiva          # Importación CSV
GET    /api/mentorias
POST   /api/mentorias/:id/tareas
PATCH  /api/mentorias/:id/tareas/:id_tarea   # Workflow de estados
GET    /api/investigaciones
POST   /api/investigaciones                  # Con archivos adjuntos
```

---

## Catálogos del sistema

Los catálogos son tablas maestras configurables que se asocian a cada profesor. Cada catálogo tiene CRUD propio vía API y puede ser administrado de forma independiente.

| Catálogo | Descripción |
|----------|-------------|
| **Sedes** | Ubicaciones o campus donde el profesor ejerce |
| **Talleres** | Talleres dictados o en los que participa el profesor |
| **Formaciones** | Formaciones académicas del profesor |
| **Postgrados** | Estudios de postgrado (magíster, doctorado, etc.) |

Cada profesor puede tener múltiples registros asociados en cada catálogo. Las opciones disponibles en cada catálogo son gestionadas por el administrador antes de asignarlas a los profesores.

---

## Carga masiva de profesores (CSV)

El sistema acepta archivos `.csv` con datos de profesores. Cada fila es validada individualmente antes de insertarse. Los errores se reportan por fila y la operación se ejecuta dentro de una transacción SQL para garantizar consistencia.

---

## Autenticación

- Tokens JWT con expiración de 1 hora
- Registro de usuarios solo disponible para administradores autenticados
- Middleware `authenticateToken` protege todas las rutas privadas
- Middleware `requireAdmin` restringe rutas de administración
- Soft delete de usuarios (deshabilitación sin eliminar registros)

---

## Autor

**Rodrigo Molina Castillo**  
Ingeniería Civil Informática — Universidad Andrés Bello  
[linkedin.com/in/rodrigo-molina-817194176](https://linkedin.com/in/rodrigo-molina-817194176)
(Base de datos en secreto)
## Licencia

Este repositorio es público con fines de portafolio y demostración académica.  
El código **no está disponible para reutilización, modificación ni distribución** sin autorización expresa del autor.

© 2025 Rodrigo Molina Castillo — Todos los derechos reservados.
