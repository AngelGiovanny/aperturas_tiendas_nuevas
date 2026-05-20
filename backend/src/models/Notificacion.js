const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: [
            'nueva_tienda',
            'asignacion',
            'cambio_estado',
            'validacion',
            'recordatorio',
            'alerta',
            'completado',
            'retraso',
            'aprobacion',
            'sistema'
        ],
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    leida: {
        type: Boolean,
        default: false,
        index: true
    },
    prioridad: {
        type: String,
        enum: ['baja', 'media', 'alta', 'critica'],
        default: 'media'
    },
    referencia: {
        tipo: {
            type: String,
            enum: ['tienda', 'proceso', 'checklist', 'usuario']
        },
        id: mongoose.Schema.Types.ObjectId
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    enviadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fechaExpiracion: Date,
    canales: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Índices compuestos para búsquedas eficientes
notificacionSchema.index({ usuario: 1, leida: 1, createdAt: -1 });
notificacionSchema.index({ usuario: 1, tipo: 1 });
notificacionSchema.index({ 'referencia.id': 1 });
notificacionSchema.index({ fechaExpiracion: 1 }, { expireAfterSeconds: 0 });

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = function() {
    this.leida = true;
    return this.save();
};

// Método para obtener resumen
notificacionSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('Notificacion', notificacionSchema);