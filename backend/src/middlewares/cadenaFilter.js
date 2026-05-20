// backend/middlewares/cadenaFilter.js

/**
 * Middleware para filtrar tiendas según la cadena asignada al usuario
 */
const filterByCadena = (req, res, next) => {
    try {
        const user = req.user;

        // Admin master ve todo
        if (user.role === 'admin_master') {
            console.log('👑 Admin master - Sin filtro de cadena');
            return next();
        }

        // Usuarios con cadenaAsignada específica
        if (user.cadenaAsignada && user.cadenaAsignada !== 'TODAS') {
            req.cadenaFiltro = user.cadenaAsignada;
            console.log(`🔍 Filtrando por cadena: ${req.cadenaFiltro} para usuario ${user.email}`);
        } else {
            console.log(`🔍 Usuario ${user.email} ve TODAS las cadenas`);
        }

        next();
    } catch (error) {
        console.error('Error en filterByCadena:', error);
        next();
    }
};

/**
 * Middleware para verificar permisos de módulo
 */
const verificarPermiso = (modulo) => {
    return (req, res, next) => {
        const user = req.user;

        // Admin master tiene todos los permisos
        if (user.role === 'admin_master') {
            return next();
        }

        // Verificar permiso específico
        if (user.permisos && user.permisos[modulo]) {
            return next();
        }

        return res.status(403).json({
            success: false,
            error: `No tiene permisos para acceder al módulo ${modulo}`
        });
    };
};

module.exports = { filterByCadena, verificarPermiso };