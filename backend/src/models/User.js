// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    apellido: {
        type: String,
        trim: true,
        default: ''  // ✅ Valor por defecto vacío en lugar de requerido
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: [
            'admin_master',  // Super administrador (Angel)
            'admin',          // Administradores generales
            'cx',            // Customer Experience (técnicos)
            'aperturas',      // Equipo de aperturas
            'campo',          // Equipo en campo
            'operaciones',    // Operaciones
            'contabilidad',   // Contabilidad
            'it',            // IT
            'dsi',           // DSI
            'trade',         // Trade
            'marketing',     // Marketing
            'mesa_servicio',  // Mesa de servicio
            'tecnico',       // Técnico adicional
            'instalador',    // Instalador
            'soporte'        // Soporte
        ],
        required: true,
        default: 'cx'
    },
    area: {
        type: String,
        enum: [
            'administracion',
            'operaciones',
            'infraestructura',
            'desarrollo',
            'cx',
            'trade',
            'contabilidad',
            'it',
            'dsi',
            'marketing',
            'aperturas',
            'campo',
            'soporte'
        ],
        required: true,
        default: 'cx'
    },
    telefono: {
        type: String,
        default: '',  // ✅ Cambiado: ya no es requerido
        match: [/^\d{10,15}$/, 'El teléfono debe tener entre 10 y 15 dígitos']
    },
    activo: {
        type: Boolean,
        default: true
    },
    passwordTemporal: {
        type: Boolean,
        default: true
    },
    debeCambiarPassword: {
        type: Boolean,
        default: false
    },
    ultimoAcceso: {
        type: Date,
        default: null
    },
    // ✅ NUEVOS CAMPOS PARA PERMISOS POR CADENA
    cadenaAsignada: {
        type: String,
        enum: [
            'KFC',
            'AMERICAN_DELI',
            'CAJUN',
            'ESPANOL',
            'GUS',
            'JUAN_VALDEZ',
            'MENESTRAS',
            'TROPI',
            'IL_CAPPO',
            'CASA_RES',
            'FEDERER',
            'BASKIN_ROBBINS',
            'CINNABON',
            'DOLCE_INCONTRO',
            'TODAS'
        ],
        default: 'TODAS'
    },
    // ✅ PERMISOS ESPECÍFICOS POR MÓDULO
    permisos: {
        tiendas: { type: Boolean, default: true },
        implementaciones: { type: Boolean, default: true },
        usuarios: { type: Boolean, default: false },
        reportes: { type: Boolean, default: false },
        configuraciones: { type: Boolean, default: false }
    },
    permisosEspeciales: [{
        type: String,
        enum: ['crear_usuarios', 'eliminar_usuarios', 'asignar_roles', 'ver_todos_reportes']
    }]
}, {
    timestamps: true
});

// Encriptar password antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener nombre completo (maneja apellido opcional)
userSchema.virtual('nombreCompleto').get(function() {
    return this.apellido ? `${this.nombre} ${this.apellido}` : this.nombre;
});

// ✅ Índices para búsquedas rápidas
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ area: 1 });
userSchema.index({ activo: 1 });
userSchema.index({ cadenaAsignada: 1 });

module.exports = mongoose.model('User', userSchema);