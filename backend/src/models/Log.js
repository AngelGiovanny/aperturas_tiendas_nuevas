const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    nivel: {
        type: String,
        enum: ['info', 'advertencia', 'error', 'critico'],
        default: 'info'
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    accion: String,
    modulo: String,
    detalles: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    duracion: Number // en ms
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema);