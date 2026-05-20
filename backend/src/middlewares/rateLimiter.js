const rateLimit = require('express-rate-limit');

// Detectar entorno
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Middleware que pasa directamente en desarrollo (sin rate limiting)
 */
const passthrough = (req, res, next) => {
    // En desarrollo, simplemente continuar sin limitar
    next();
};

/**
 * Middleware de desarrollo que también pasa directamente
 * (alias de passthrough para mantener compatibilidad)
 */
const developmentLimiter = passthrough;

// =============================================
// CONFIGURACIONES DE RATE LIMITING PARA PRODUCCIÓN
// =============================================

/**
 * OPCIÓN 1: Auth Limiter - Estricto para login (5 intentos cada 15 min)
 */
const authLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        success: false,
        error: 'Demasiados intentos de inicio de sesión. Intente en 15 minutos.'
    },
    skipSuccessfulRequests: true, // No contar intentos exitosos
    standardHeaders: true, // Devuelve headers RateLimit-*
    legacyHeaders: false,
    // Versión segura para IPv6
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
};

/**
 * OPCIÓN 2: API General - Límite medio (200 peticiones cada 15 min)
 */
const apiLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 peticiones por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes a la API. Intente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown'
};

/**
 * OPCIÓN 3: Tiendas - Límite alto (500 peticiones cada 15 min)
 */
const tiendasLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // 500 peticiones por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes a tiendas. Intente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
    skip: (req) => {
        // No limitar health checks
        return req.path === '/api/health';
    }
};

/**
 * OPCIÓN 4: Super Admin - Límite muy alto (1000 peticiones cada 15 min)
 */
const adminLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 peticiones por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes. Intente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown'
};

/**
 * OPCIÓN 5: Procesos - Límite medio (300 peticiones cada 15 min)
 */
const procesosLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // 300 peticiones por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes a procesos. Intente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown'
};

/**
 * OPCIÓN 6: Reportes - Límite bajo (50 peticiones cada 15 min)
 */
const reportesLimiterConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 peticiones por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes de reportes. Intente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown'
};

// =============================================
// CREACIÓN DE LOS LIMITERS
// =============================================

// En desarrollo: usar passthrough (sin límites)
// En producción: usar los limiters configurados
const authLimiter = isDevelopment ? passthrough : rateLimit(authLimiterConfig);
const apiLimiter = isDevelopment ? passthrough : rateLimit(apiLimiterConfig);
const tiendasLimiter = isDevelopment ? passthrough : rateLimit(tiendasLimiterConfig);
const adminLimiter = isDevelopment ? passthrough : rateLimit(adminLimiterConfig);
const procesosLimiter = isDevelopment ? passthrough : rateLimit(procesosLimiterConfig);
const reportesLimiter = isDevelopment ? passthrough : rateLimit(reportesLimiterConfig);

// Log para verificar configuración
console.log(`🔧 Rate Limiter configurado en modo: ${isDevelopment ? 'DESARROLLO (sin límites)' : 'PRODUCCIÓN (con límites)'}`);

// =============================================
// EXPORTACIONES
// =============================================

module.exports = {
    // Limiters principales
    authLimiter,
    apiLimiter,
    tiendasLimiter,
    adminLimiter,
    procesosLimiter,
    reportesLimiter,

    // Limiters específicos (alias para compatibilidad)
    developmentLimiter, // Alias de passthrough
    passthrough,        // Middleware que no limita

    // Helper
    isDevelopment
};