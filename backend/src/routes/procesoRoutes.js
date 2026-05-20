// backend/src/routes/procesoRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getProcesosByTienda,
    getProceso,
    crearProceso,
    updateProceso,
    addChecklistItem,
    validateChecklistItem,
    uploadAttachment,
    getMyProcesos,
    iniciarProceso,
    actualizarChecklist,
    pasarARevision,
    finalizarProceso,
    getConfiguracionProceso,
    validarPuntoEmision,
    continuarRevision
} = require('../controllers/procesoController');
const { auth } = require('../middlewares/auth');

// Configurar multer para archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Middleware de autenticación para todas las rutas
router.use(auth);

// =============================================
// RUTAS DE PROCESOS
// =============================================

router.post('/', crearProceso);
router.get('/mis-procesos', getMyProcesos);
router.get('/tienda/:tiendaId', getProcesosByTienda);

router.get('/:id', getProceso);
router.get('/:id/configuracion', getConfiguracionProceso);
router.put('/:id', updateProceso);
router.put('/:id/iniciar', iniciarProceso);
router.put('/:id/checklist', actualizarChecklist);
router.put('/:id/revision', pasarARevision);
router.put('/:id/continuar-revision', continuarRevision);
router.put('/:id/finalizar', finalizarProceso);
router.put('/:id/validar-punto/:puntoId', validarPuntoEmision);

router.post('/:id/checklist', addChecklistItem);
router.put('/:id/checklist/:itemId/validate', validateChecklistItem);
router.post('/:id/checklist/:itemId/upload', upload.single('file'), uploadAttachment);

module.exports = router;