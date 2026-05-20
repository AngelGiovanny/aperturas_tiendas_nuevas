// backend/routes/tiendasRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ AGREGADO: Para manejar imágenes
const upload = multer({ storage: multer.memoryStorage() }); // ✅ AGREGADO: Almacenamiento en memoria para imágenes

const {
    createTienda,
    getTiendas,
    getTienda,
    assignResponsable,
    updateEstado,
    getDashboardStats,
    getTiemposTienda,
    getResumenTiempos,
    getUsuariosPorArea,
    getCategoriasPorCadena,
    recomendarCX,
    // NUEVOS MÉTODOS
    actualizarConfiguracionEstaciones,
    guardarConfiguracionEstaciones,
    getConfiguracionCompleta,
    getConfiguracionEstaciones,
    // APROBAR FACTURACIÓN
    aprobarFacturacion,
    // ACTUALIZAR TIENDA
    updateTienda,
    // ✅ NUEVA FUNCIÓN: FINALIZAR APERTURA
    finalizarApertura
} = require('../controllers/tiendaController');
const { auth, authorize } = require('../middlewares/auth');
const { filterByCadena, verificarPermiso } = require('../middlewares/cadenaFilter');
const { validateTienda } = require('../middlewares/validators');
const {
    tiendasLimiter,  // Límite alto para tiendas
    adminLimiter,    // Límite muy alto para admin
    developmentLimiter // Sin límite en desarrollo
} = require('../middlewares/rateLimiter');

// Todas las rutas requieren autenticación
router.use(auth);

// Aplicar rate limiter específico para tiendas (500 peticiones cada 15 min)
// En desarrollo, developmentLimiter pasará sin límite
router.use(tiendasLimiter);

// =============================================
// RUTAS AUXILIARES (para selects y recomendaciones)
// =============================================
router.get('/usuarios-por-area', getUsuariosPorArea);
router.get('/categorias-por-cadena/:cadena', getCategoriasPorCadena);
router.get('/recomendar-cx', recomendarCX);

// =============================================
// RUTAS DE CONFIGURACIÓN DE ESTACIONES
// =============================================
router.patch('/:id/configuracion-estaciones',
    authorize('admin', 'operaciones', 'aperturas'),
    actualizarConfiguracionEstaciones
);

router.put('/:id/configuracion-estaciones',
    authorize('admin', 'operaciones', 'aperturas'),
    guardarConfiguracionEstaciones
);

router.get('/:id/configuracion-completa',
    getConfiguracionCompleta
);

router.get('/:id/estaciones',
    getConfiguracionEstaciones
);

// =============================================
// RUTAS DE TIENDAS
// =============================================
router.post('/',
    authorize('admin', 'operaciones', 'aperturas'),
    validateTienda,
    createTienda
);

// ✅ RUTA GET con filtro por cadena
router.get('/',
    filterByCadena,
    getTiendas
);

// ✅ RUTA STATS con filtro por cadena
router.get('/stats/dashboard',
    authorize('admin', 'cx', 'operaciones'),
    filterByCadena,
    getDashboardStats
);

router.get('/tiempos/resumen',
    authorize('admin', 'cx'),
    getResumenTiempos
);

// =============================================
// RUTAS ESPECÍFICAS POR ID
// =============================================
router.get('/:id',
    getTienda
);

// =============================================
// RUTA PUT - Actualizar tienda (reasignación CX)
// =============================================
/**
 * @route   PUT /api/tiendas/:id
 * @desc    Actualizar tienda (para reasignar técnico CX)
 * @access  Private (Admin, Master, CX)
 */
router.put('/:id',
    authorize('admin', 'admin_master', 'cx'),
    updateTienda
);

router.get('/:id/tiempos',
    getTiemposTienda
);

router.put('/:id/assign',
    authorize('admin'),
    assignResponsable
);

router.put('/:id/estado',
    authorize('admin', 'operaciones'),
    updateEstado
);

// =============================================
// RUTA: APROBAR FACTURACIÓN
// =============================================
/**
 * @route   POST /api/tiendas/:id/aprobar-facturacion
 * @desc    Aprobar facturación y mover tienda a APERTURA
 * @access  Private (Admin, Operaciones, Aperturas)
 */
router.post('/:id/aprobar-facturacion',
    authorize('admin', 'operaciones', 'aperturas'),
    aprobarFacturacion
);

// =============================================
// ✅ NUEVA RUTA: FINALIZAR APERTURA (POST MORTEM)
// =============================================
/**
 * @route   POST /api/tiendas/:id/finalizar-apertura
 * @desc    Finalizar apertura y enviar informe Post Mortem con imágenes
 * @access  Private (Admin, Master, Operaciones, Aperturas, CX)
 * @param   {Array} imagenes - Hasta 10 imágenes adjuntas (multipart/form-data)
 */
router.post('/:id/finalizar-apertura',
    authorize('admin', 'admin_master', 'operaciones', 'aperturas', 'cx'),
    upload.array('imagenes', 10),  // Máximo 10 imágenes
    finalizarApertura
);

module.exports = router;