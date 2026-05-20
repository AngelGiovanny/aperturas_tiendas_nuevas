// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    changePassword,
    changeRole
} = require('../controllers/authController');
const { auth, authorize } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validators');
const {
    authLimiter,
    developmentLimiter,
    adminLimiter
} = require('../middlewares/rateLimiter');

// Verificar que los controladores existen (para debugging)
console.log('📦 Cargando rutas de autenticación...');
console.log('   - register:', typeof register);
console.log('   - login:', typeof login);
console.log('   - getMe:', typeof getMe);
console.log('   - changePassword:', typeof changePassword);
console.log('   - changeRole:', typeof changeRole);

// Determinar qué limiter usar según el entorno
const isDevelopment = process.env.NODE_ENV === 'development';
console.log(`🔧 Entorno: ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}`);

// En desarrollo, usar developmentLimiter (sin límite)
// En producción, usar authLimiter (con límite)
const loginLimiter = isDevelopment ? developmentLimiter : authLimiter;
const registerLimiter = isDevelopment ? developmentLimiter : authLimiter;

// =============================================
// RUTAS PÚBLICAS (con rate limiting)
// =============================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Admin
 */
router.post('/register',
    registerLimiter,
    validateRegister,
    register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login',
    loginLimiter,
    validateLogin,
    login
);

// =============================================
// RUTAS PRIVADAS (autenticación requerida)
// =============================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/me',
    auth,
    getMe
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put('/change-password',
    auth,
    changePassword
);

// =============================================
// RUTAS DE ADMINISTRACIÓN
// =============================================

/**
 * @route   PUT /api/auth/change-role/:id
 * @desc    Cambiar rol de un usuario (solo admin)
 * @access  Admin
 */
router.put('/change-role/:id',
    auth,
    authorize('admin', 'admin_master'),
    changeRole
);

console.log('✅ Rutas de autenticación cargadas correctamente');

module.exports = router;