import {
    createProfesorService,
    getProfesoresService,
    getProfesorByIdService,
    updateProfesorService,
    deleteProfesorService,
    getCatalogoSedesService,
    createCatalogoSedeService,
    updateCatalogoSedeService,
    deleteCatalogoSedeService,
    getProfesorSedesService,
    getCatalogoTalleresService,
    createCatalogoTallerService,
    updateCatalogoTallerService,
    deleteCatalogoTallerService,
    uploadProfesoresCSVService,
    getCatalogoFormacionesService,
    createCatalogoFormacionService,
    updateCatalogoFormacionService,
    deleteCatalogoFormacionService,
    getCatalogoMagisterService,
    createCatalogoMagisterService,
    updateCatalogoMagisterService,
    deleteCatalogoMagisterService,
} from '../profesores/profesores.service.js';

function handleError(res, error, label = 'Error interno del servidor.') {
    console.error(label, error);
    return res.status(error.statusCode || 500).json({
        message: error.message || 'Error interno del servidor.',
        ...(error.errors ? { errors: error.errors } : {}),
        ...(error.extra ? error.extra : {}),
    });
}

export const createProfesor = async (req, res) => {
    try {
        const result = await createProfesorService(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al crear profesor:');
    }
};

export const getProfesores = async (req, res) => {
    try {
        const result = await getProfesoresService(req.query);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener profesores:');
    }
};

export const getProfesorById = async (req, res) => {
    try {
        const result = await getProfesorByIdService(req.params.id_profesor);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener profesor:');
    }
};

export const updateProfesor = async (req, res) => {
    try {
        const result = await updateProfesorService(req.params.id_profesor, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar profesor:');
    }
};

export const deleteProfesor = async (req, res) => {
    try {
        const result = await deleteProfesorService(req.params.id_profesor);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al eliminar profesor:');
    }
};

export const getCatalogoSedes = async (req, res) => {
    try {
        const result = await getCatalogoSedesService(req.query);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener catálogo de sedes:');
    }
};

export const createCatalogoSede = async (req, res) => {
    try {
        const result = await createCatalogoSedeService(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al crear sede del catálogo:');
    }
};

export const updateCatalogoSede = async (req, res) => {
    try {
        const result = await updateCatalogoSedeService(req.params.id_sede, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar sede del catálogo:');
    }
};

export const deleteCatalogoSede = async (req, res) => {
    try {
        const result = await deleteCatalogoSedeService(req.params.id_sede);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al eliminar sede del catálogo:');
    }
};

export const getProfesorSedes = async (req, res) => {
    try {
        const result = await getProfesorSedesService(req.params.id_profesor);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener sedes del profesor:');
    }
};

export const getCatalogoTalleres = async (_req, res) => {
    try {
        const result = await getCatalogoTalleresService();
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener catálogo de talleres:');
    }
};

export const createCatalogoTaller = async (req, res) => {
    try {
        const result = await createCatalogoTallerService(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al crear taller del catálogo:');
    }
};

export const updateCatalogoTaller = async (req, res) => {
    try {
        const result = await updateCatalogoTallerService(req.params.id_taller, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar taller del catálogo:');
    }
};

export const deleteCatalogoTaller = async (req, res) => {
    try {
        const result = await deleteCatalogoTallerService(req.params.id_taller);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al eliminar taller del catálogo:');
    }
};

export const uploadProfesoresCSV = async (req, res) => {
    try {
        const result = await uploadProfesoresCSVService(req);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error en carga masiva de profesores:');
    }
};

export const getCatalogoFormaciones = async (_req, res) => {
    try {
        const result = await getCatalogoFormacionesService();
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener catálogo de formaciones:');
    }
};

export const createCatalogoFormacion = async (req, res) => {
    try {
        const result = await createCatalogoFormacionService(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al crear formación del catálogo:');
    }
};

export const updateCatalogoFormacion = async (req, res) => {
    try {
        const result = await updateCatalogoFormacionService(req.params.id_catalogo_formacion, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar formación del catálogo:');
    }
};

export const deleteCatalogoFormacion = async (req, res) => {
    try {
        const result = await deleteCatalogoFormacionService(req.params.id_catalogo_formacion);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al eliminar formación del catálogo:');
    }
};

export const getCatalogoMagister = async (_req, res) => {
    try {
        const result = await getCatalogoMagisterService();
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al obtener catálogo de magíster:');
    }
};

export const createCatalogoMagister = async (req, res) => {
    try {
        const result = await createCatalogoMagisterService(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al crear magíster del catálogo:');
    }
};

export const updateCatalogoMagister = async (req, res) => {
    try {
        const result = await updateCatalogoMagisterService(req.params.id_catalogo_magister, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar magíster del catálogo:');
    }
};

export const deleteCatalogoMagister = async (req, res) => {
    try {
        const result = await deleteCatalogoMagisterService(req.params.id_catalogo_magister);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'Error al eliminar magíster del catálogo:');
    }
};
