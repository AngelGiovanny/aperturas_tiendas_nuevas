// backend/models/Implementacion.js
const mongoose = require('mongoose');

const implementacionSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'El código es requerido'],
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    cadena: {
        type: String,
        required: [true, 'La cadena es requerida'],
        enum: ['KFC', 'DELI', 'CAJUN', 'ESPANOL', 'GUS', 'JUANVALDEZ', 'MENESTRAS', 'TROPI', 'ILCAPPO', 'CASARES', 'FEDERER', 'BASKIN', 'CINNABON', 'DOLCE']
    },
    direccion: {
        calle: { type: String, default: '' },
        ciudad: { type: String, default: '' },
        provincia: { type: String, default: '' }
    },
    fechaImplementacionPlanificada: {
        type: Date
    },
    fechaInicioReal: {
        type: Date
    },
    fechaFinReal: {
        type: Date
    },
    tecnicoAsignadoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tecnicoAsignado: {
        nombre: String,
        email: String
    },
    observaciones: {
        type: String,
        default: ''
    },
    estadoGeneral: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'en_revision', 'instalacion', 'apertura', 'completado', 'cancelado'],
        default: 'pendiente'
    },
    configuracion: {
        cajas: {
            activo: { type: Boolean, default: false },
            cantidad: { type: Number, default: 1 }
        },
        kioscos: {
            activo: { type: Boolean, default: false },
            cantidad: { type: Number, default: 0 }
        },
        delivery: {
            activo: { type: Boolean, default: false },
            tipo: {
                type: String,
                enum: ['propio', 'agregadores', 'ambos'],
                default: 'propio'  // ✅ CAMBIADO: null → 'propio'
            }
        },
        localizadores: { type: Boolean, default: false },
        turnero: { type: Boolean, default: false },
        kds: { type: Boolean, default: false },
        heladerias: { type: Boolean, default: false },
        drive: {
            activo: { type: Boolean, default: false }
        },
        medianet: { type: Boolean, default: false },
        dragonTail: { type: Boolean, default: false },
        pickUp: { type: Boolean, default: false },
        impresoras: {
            linea: { type: Boolean, default: false },
            lineaDomi: { type: Boolean, default: false },
            bar: { type: Boolean, default: false },
            cocina: { type: Boolean, default: false },
            parrilla: { type: Boolean, default: false },
            personalizada: { type: Boolean, default: false },
            personalizadaNombre: { type: String, default: '' }
        }
    },
    checklist: [{
        item: String,
        completado: { type: Boolean, default: false },
        fechaCompletado: Date,
        responsable: String
    }],
    progreso: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    adjuntos: [{
        nombre: String,
        url: String,
        tipo: String,
        tamaño: Number,
        fechaSubida: Date
    }]
}, {
    timestamps: true
});

// Índices para búsquedas
implementacionSchema.index({ codigo: 1 });
implementacionSchema.index({ cadena: 1 });
implementacionSchema.index({ estadoGeneral: 1 });
implementacionSchema.index({ tecnicoAsignadoId: 1 });

module.exports = mongoose.model('Implementacion', implementacionSchema);