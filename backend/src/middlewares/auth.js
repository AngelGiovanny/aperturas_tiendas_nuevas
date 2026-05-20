// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado. Token no proporcionado.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

        // El token puede tener 'id' o 'userId'
        const userId = decoded.id || decoded.userId;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado.'
            });
        }

        if (!user.activo) {
            return res.status(401).json({
                success: false,
                error: 'Usuario desactivado. Contacte al administrador.'
            });
        }

        // ✅ VERIFICACIÓN: Usuario debe cambiar contraseña
        // Excluir la ruta de cambio de contraseña para permitir el acceso
        const esRutaCambioPassword = req.path === '/change-password' ||
            req.path.includes('/change-password') ||
            req.path === '/cambiar-password' ||
            req.path.includes('/cambiar-password') ||
            req.path === '/perfil' ||
            req.path.includes('/perfil');

        if (user.debeCambiarPassword && !esRutaCambioPassword) {
            return res.status(403).json({
                success: false,
                error: 'Debe cambiar su contraseña antes de continuar.',
                debeCambiarPassword: true,
                message: 'Por favor, cambie su contraseña para continuar usando el sistema.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error en auth middleware:', error);
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado.'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Rol ${req.user.role} no autorizado. Roles permitidos: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { auth, authorize };