const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validators
const validateRegister = [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').isIn(['admin', 'contabilidad', 'operaciones', 'it', 'dsi', 'cx', 'trade', 'marketing', 'mesa_servicio']),
    body('area').notEmpty().withMessage('El área es requerida'),
    body('telefono').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido'),
    handleValidationErrors
];

const validateLogin = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    handleValidationErrors
];

// Tienda validators
const validateTienda = [
    body('codigo').notEmpty().withMessage('El código es requerido'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('direccion.calle').notEmpty().withMessage('La calle es requerida'),
    body('direccion.ciudad').notEmpty().withMessage('La ciudad es requerida'),
    body('direccion.provincia').notEmpty().withMessage('La provincia es requerida'),
    body('ruc').matches(/^\d{13}$/).withMessage('RUC debe tener 13 dígitos'),
    body('fechaAperturaPlanificada').isISO8601().withMessage('Fecha inválida'),
    handleValidationErrors
];

// Proceso validators
const validateProceso = [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('area').notEmpty().withMessage('El área es requerida'),
    body('etapa').isIn(['planeacion', 'pre_apertura', 'pruebas_uat', 'apertura', 'post_apertura', 'cierre']),
    body('orden').isInt({ min: 1 }).withMessage('Orden debe ser un número positivo'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateTienda,
    validateProceso,
    handleValidationErrors
};