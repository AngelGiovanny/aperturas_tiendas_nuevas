// backend/src/models/FormaPago.js
const mongoose = require('mongoose');

const FormaPagoSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    cadenaId: {
        type: String,
        required: true,
        index: true
    },
    codigo: {
        type: String,
        default: ''
    },
    descripcion: {
        type: String,
        default: ''
    },
    activo: {
        type: Boolean,
        default: true
    },
    orden: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

FormaPagoSchema.index({ cadenaId: 1, activo: 1, orden: 1 });
FormaPagoSchema.index({ codigo: 1 });

module.exports = mongoose.model('FormaPago', FormaPagoSchema);