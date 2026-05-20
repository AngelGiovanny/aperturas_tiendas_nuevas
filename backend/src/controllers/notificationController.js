const Notificacion = require('../models/Notificacion');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

// @desc    Obtener notificaciones del usuario
// @route   GET /api/notificaciones
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, leida, tipo } = req.query;

        let query = { usuario: req.user.id };

        if (leida !== undefined) {
            query.leida = leida === 'true';
        }

        if (tipo) {
            query.tipo = tipo;
        }

        const notificaciones = await Notificacion.find(query)
            .populate('enviadoPor', 'nombre email')
            .populate('referencia.id')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Notificacion.countDocuments(query);

        // Obtener conteo de no leídas para el badge
        const noLeidas = await Notificacion.countDocuments({
            usuario: req.user.id,
            leida: false
        });

        // Obtener conteo por tipo para filtros
        const conteoPorTipo = await Notificacion.aggregate([
            { $match: { usuario: req.user.id } },
            { $group: { _id: "$tipo", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            count: notificaciones.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            noLeidas,
            conteoPorTipo,
            data: notificaciones
        });
    } catch (error) {
        console.error('❌ Error en getNotifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notificaciones/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notificacion = await Notificacion.findOne({
            _id: req.params.id,
            usuario: req.user.id
        });

        if (!notificacion) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        notificacion.leida = true;
        await notificacion.save();

        res.json({
            success: true,
            data: notificacion
        });
    } catch (error) {
        console.error('❌ Error en markAsRead:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Marcar todas como leídas
// @route   PUT /api/notificaciones/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notificacion.updateMany(
            { usuario: req.user.id, leida: false },
            { $set: { leida: true } }
        );

        res.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('❌ Error en markAllAsRead:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Eliminar notificación
// @route   DELETE /api/notificaciones/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notificacion = await Notificacion.findOneAndDelete({
            _id: req.params.id,
            usuario: req.user.id
        });

        if (!notificacion) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Notificación eliminada',
            data: notificacion
        });
    } catch (error) {
        console.error('❌ Error en deleteNotification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Contar no leídas
// @route   GET /api/notificaciones/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notificacion.countDocuments({
            usuario: req.user.id,
            leida: false
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('❌ Error en getUnreadCount:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Enviar notificación manual
// @route   POST /api/notificaciones/send
// @access  Admin
exports.sendNotification = async (req, res) => {
    try {
        const { usuario, tipo, titulo, mensaje, referencia, prioridad, canales } = req.body;

        // Validar que el usuario existe
        const userExists = await User.findById(usuario);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Crear notificación
        const notificacion = await notificationService.crearNotificacion({
            usuario,
            tipo: tipo || 'sistema',
            titulo,
            mensaje,
            referencia,
            prioridad: prioridad || 'media',
            enviadoPor: req.user.id,
            canales: canales || { email: false, sms: false, push: true }
        });

        // Enviar por email si se solicita
        if (req.body.enviarEmail || canales?.email) {
            try {
                await notificationService.enviarEmail(usuario, titulo, mensaje);
                console.log(`✅ Email enviado a ${userExists.email}`);
            } catch (emailError) {
                console.error('❌ Error enviando email:', emailError.message);
            }
        }

        // Enviar por SMS si se solicita
        if (req.body.enviarSMS || canales?.sms) {
            try {
                await notificationService.enviarSMS(usuario, mensaje);
                console.log(`✅ SMS enviado a ${userExists.telefono}`);
            } catch (smsError) {
                console.error('❌ Error enviando SMS:', smsError.message);
            }
        }

        res.status(201).json({
            success: true,
            data: notificacion,
            message: 'Notificación creada y enviada'
        });
    } catch (error) {
        console.error('❌ Error en sendNotification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Eliminar notificaciones antiguas (job)
// @route   DELETE /api/notificaciones/limpiar-antiguas
// @access  Admin
exports.limpiarNotificacionesAntiguas = async (req, res) => {
    try {
        const dias = parseInt(req.query.dias) || 30;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);

        const resultado = await Notificacion.deleteMany({
            createdAt: { $lt: fechaLimite },
            leida: true
        });

        res.json({
            success: true,
            message: `Eliminadas ${resultado.deletedCount} notificaciones antiguas`,
            count: resultado.deletedCount,
            dias
        });
    } catch (error) {
        console.error('❌ Error en limpiarNotificacionesAntiguas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas de notificaciones
// @route   GET /api/notificaciones/estadisticas
// @access  Private
exports.getEstadisticas = async (req, res) => {
    try {
        const total = await Notificacion.countDocuments({ usuario: req.user.id });
        const noLeidas = await Notificacion.countDocuments({
            usuario: req.user.id,
            leida: false
        });

        const ultimasSemana = await Notificacion.countDocuments({
            usuario: req.user.id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const porTipo = await Notificacion.aggregate([
            { $match: { usuario: req.user.id } },
            { $group: { _id: "$tipo", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const ultimas5 = await Notificacion.find({ usuario: req.user.id })
            .sort('-createdAt')
            .limit(5)
            .select('titulo tipo leida createdAt');

        res.json({
            success: true,
            data: {
                total,
                noLeidas,
                ultimasSemana,
                porcentajeLeidas: total > 0 ? Math.round(((total - noLeidas) / total) * 100) : 0,
                porTipo,
                ultimas: ultimas5
            }
        });
    } catch (error) {
        console.error('❌ Error en getEstadisticas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Marcar notificaciones por referencia como leídas
// @route   PUT /api/notificaciones/marcar-por-referencia
// @access  Private
exports.marcarPorReferencia = async (req, res) => {
    try {
        const { referenciaTipo, referenciaId } = req.body;

        const result = await Notificacion.updateMany(
            {
                usuario: req.user.id,
                'referencia.tipo': referenciaTipo,
                'referencia.id': referenciaId,
                leida: false
            },
            { leida: true }
        );

        res.json({
            success: true,
            message: `Marcadas ${result.modifiedCount} notificaciones como leídas`,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('❌ Error en marcarPorReferencia:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};