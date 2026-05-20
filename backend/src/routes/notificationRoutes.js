const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    sendNotification,
    limpiarNotificacionesAntiguas,
    getEstadisticas,
    marcarPorReferencia
} = require('../controllers/notificationController'); // 👈 SOLO ESTA LÍNEA CAMBIÓ (notificacion → notification)
const { auth, authorize } = require('../middlewares/auth');

// Middleware de autenticación para todas las rutas
router.use(auth);

// =============================================
// RUTAS PARA USUARIOS AUTENTICADOS
// =============================================

/**
 * @route   GET /api/notificaciones
 * @desc    Obtener notificaciones del usuario (con paginación y filtros)
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notificaciones/estadisticas
 * @desc    Obtener estadísticas de notificaciones
 * @access  Private
 */
router.get('/estadisticas', getEstadisticas);

/**
 * @route   GET /api/notificaciones/unread-count
 * @desc    Obtener conteo de notificaciones no leídas
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notificaciones/mark-all-read
 * @desc    Marcar todas las notificaciones como leídas
 * @access  Private
 */
router.put('/mark-all-read', markAllAsRead);

/**
 * @route   PUT /api/notificaciones/marcar-por-referencia
 * @desc    Marcar notificaciones por referencia como leídas
 * @access  Private
 */
router.put('/marcar-por-referencia', marcarPorReferencia);

/**
 * @route   PUT /api/notificaciones/:id/read
 * @desc    Marcar una notificación específica como leída
 * @access  Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notificaciones/:id
 * @desc    Eliminar una notificación
 * @access  Private
 */
router.delete('/:id', deleteNotification);

// =============================================
// RUTAS PARA ADMINISTRADORES
// =============================================

/**
 * @route   POST /api/notificaciones/send
 * @desc    Enviar notificación manual a un usuario
 * @access  Admin
 */
router.post('/send', authorize('admin', 'admin_master'), sendNotification);

/**
 * @route   DELETE /api/notificaciones/limpiar/antiguas
 * @desc    Limpiar notificaciones antiguas (por defecto > 30 días)
 * @access  Admin
 */
router.delete('/limpiar/antiguas', authorize('admin'), limpiarNotificacionesAntiguas);

module.exports = router;