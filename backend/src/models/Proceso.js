// backend/src/models/Proceso.js

const mongoose = require('mongoose');

const checkItemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true
    },
    descripcion: String,
    responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requiereValidacion: {
        type: Boolean,
        default: true
    },
    validado: {
        type: Boolean,
        default: false
    },
    fechaValidacion: Date,
    validadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adjuntos: [{
        nombre: String,
        url: String,
        tipo: String,
        tamaño: Number,
        fechaSubida: {
            type: Date,
            default: Date.now
        }
    }],
    observaciones: String,
    tiempoEstimado: Number,
    tiempoReal: Number
}, { _id: true });

const procesoSchema = new mongoose.Schema({
    tienda: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tienda',
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    descripcion: String,
    tipo: {
        type: String,
        enum: ['apertura', 'remodelacion', 'mantenimiento'],
        default: 'apertura'
    },
    area: {
        type: String,
        enum: [
            'operaciones',
            'infraestructura',
            'dsi',
            'contabilidad',
            'cx',
            'aperturas',
            'campo',
            'trade',
            'marketing',
            'mesa_servicio'
        ],
        required: true
    },
    etapa: {
        type: String,
        enum: ['planeacion', 'pre_apertura', 'pruebas_uat', 'apertura', 'post_apertura', 'cierre'],
        required: true
    },
    // =============================================
    // 👇 ESTADO - MODIFICADO: AGREGADOS instalacion y apertura
    // =============================================
    estado: {
        type: String,
        enum: [
            'pendiente',
            'en_proceso',
            'en_revision',
            'instalacion',           // 👈 AGREGADO
            'apertura',              // 👈 AGREGADO
            'completado',
            'en_espera_proveedor',
            'en_espera_cliente',
            'pendiente_aprobacion',
            'bloqueado',
            'cancelado'
        ],
        default: 'pendiente'
    },
    orden: {
        type: Number,
        required: true
    },
    dependencias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proceso'
    }],
    equipo: {
        lider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        responsables: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    checklist: [checkItemSchema],

    // =============================================
    // 👇 TIEMPOS ETAPA - MODIFICADO: AGREGADOS instalacion y apertura
    // =============================================
    tiemposEtapa: {
        pendiente: {
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        en_proceso: {
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        en_revision: {
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        instalacion: {               // 👈 AGREGADO
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        apertura: {                  // 👈 AGREGADO
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        pendiente_aprobacion: {
            inicio: Date,
            fin: Date,
            duracion: Number
        },
        completado: {
            inicio: Date,
            fin: Date,
            duracion: Number
        }
    },

    fechas: {
        inicioPlanificacion: Date,
        inicioReal: Date,
        finEstimado: {
            type: Date,
            required: true
        },
        finReal: Date,
        fechaLimite: Date
    },

    tiempoEstimado: {
        type: Number,
        default: 0
    },
    tiempoReal: {
        type: Number,
        default: 0
    },
    estadoTiempo: {
        type: String,
        enum: ['normal', 'por_vencer', 'atrasado'],
        default: 'normal'
    },
    alertaEnviada: {
        type: Boolean,
        default: false
    },

    prioridad: {
        type: String,
        enum: ['baja', 'media', 'alta', 'critica'],
        default: 'media'
    },
    progreso: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    observaciones: String,

    historial: [{
        fecha: {
            type: Date,
            default: Date.now
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        accion: String,
        estadoAnterior: String,
        estadoNuevo: String,
        detalles: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

// ÍNDICES
procesoSchema.index({ tienda: 1, estado: 1 });
procesoSchema.index({ 'fechas.finEstimado': 1 });
procesoSchema.index({ estadoTiempo: 1 });
procesoSchema.index({ area: 1, estado: 1 });

// MÉTODOS
procesoSchema.methods.iniciarEtapa = function(estado) {
    if (!this.tiemposEtapa) {
        this.tiemposEtapa = {};
    }
    if (!this.tiemposEtapa[estado]) {
        this.tiemposEtapa[estado] = {};
    }
    this.tiemposEtapa[estado].inicio = new Date();
    this.tiemposEtapa[estado].fin = null;
    this.tiemposEtapa[estado].duracion = 0;
};

procesoSchema.methods.finalizarEtapa = function(estado) {
    if (this.tiemposEtapa && this.tiemposEtapa[estado] && this.tiemposEtapa[estado].inicio) {
        this.tiemposEtapa[estado].fin = new Date();
        const diffMs = this.tiemposEtapa[estado].fin - this.tiemposEtapa[estado].inicio;
        this.tiemposEtapa[estado].duracion = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
    }
};

procesoSchema.methods.calcularEstadoTiempo = function() {
    if (!this.fechas || !this.fechas.finEstimado) return 'normal';
    if (this.estado === 'completado' || this.estado === 'cancelado') return 'normal';

    const hoy = new Date();
    const limite = new Date(this.fechas.finEstimado);
    const diasRestantes = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'atrasado';
    if (diasRestantes <= 2) return 'por_vencer';
    return 'normal';
};

procesoSchema.methods.actualizarTiempoReal = function() {
    if (this.fechas && this.fechas.inicioReal && this.fechas.finReal) {
        const diffMs = this.fechas.finReal - this.fechas.inicioReal;
        this.tiempoReal = Math.round(diffMs / (1000 * 60 * 60));
    }
};

procesoSchema.methods.calcularProgreso = function() {
    if (!this.checklist || this.checklist.length === 0) {
        this.progreso = this.estado === 'completado' ? 100 : 0;
        return;
    }

    const total = this.checklist.length;
    const completados = this.checklist.filter(item => item.validado).length;
    this.progreso = Math.round((completados / total) * 100);
};

// VIRTUALES
procesoSchema.virtual('diasRestantes').get(function() {
    if (!this.fechas || !this.fechas.finEstimado) return null;
    const hoy = new Date();
    const limite = new Date(this.fechas.finEstimado);
    return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
});

procesoSchema.virtual('tiempoEnEtapaActual').get(function() {
    const etapaActual = this.tiemposEtapa?.[this.estado];
    if (!etapaActual || !etapaActual.inicio) return 0;
    const fin = etapaActual.fin || new Date();
    const diffMs = fin - etapaActual.inicio;
    return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
});

procesoSchema.virtual('progresoChecklist').get(function() {
    if (!this.checklist || this.checklist.length === 0) return 0;
    const completados = this.checklist.filter(item => item.validado).length;
    return Math.round((completados / this.checklist.length) * 100);
});

// MIDDLEWARE
procesoSchema.pre('save', function(next) {
    this.estadoTiempo = this.calcularEstadoTiempo();

    if (this.fechas && this.fechas.finReal) {
        this.actualizarTiempoReal();
    }

    this.calcularProgreso();
    next();
});

module.exports = mongoose.model('Proceso', procesoSchema);