// backend/src/models/Tienda.js
const mongoose = require('mongoose');

const tiendaSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'El código de tienda es requerido'],
        unique: true,
        uppercase: true,
        trim: true
    },
    nombre: {
        type: String,
        required: [true, 'El nombre de la tienda es requerido'],
        trim: true
    },
    // Campo para identificar la cadena
    cadena: {
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
            'OTRO'
        ],
        required: [true, 'La cadena es requerida'],
        default: 'KFC'
    },
    categoriaPrecio: {
        type: String,
        enum: [
            'KFC SIERRA CENTRO', 'KFC COSTA NORTE', 'KFC PICHINCHA', 'KFC - AEROPUERTO',
            'KFC - HIBRIDO', 'KFC - CUENCA', 'KFC - MOVIL', 'KFC-GYE', 'KFC UIO',
            'GENERAL - 2014', 'AEROPUERTO GYE', 'KFC COSTA CENTRO', 'KFC LATACUNGA RIOBAMBA',
            'KFC LOJA MACHALA', 'KFC MOBILES GYE', 'KFC ORIENTE', 'ATACAMES', 'EXPRESS', 'KFC-MANABI',
            'DELI FONTANA Y PLAZA', 'DELI MANTA', 'DELI FULL PILOTO', 'DELI IN LINE NORTE',
            'DELI TERMINAL PATIO', 'DELI CITY BISTRO', 'GENERAL - DELI PATIOS', 'DELI PATIO FULL',
            'D ARRECIFE UIO', 'DELI ARRECIFE', 'CAJUN AEROPUERTO', 'CAJUN TERMINAL', 'CAJUN AERO QUITO',
            'GENERAL - CAJUN', 'CAJUN PASEO SAN FRANCISCO', 'CONVENIOS', 'PROVINCIAS',
            'ESPAÑOL PREEMBARQUE GYE', 'ESPAÑOL AEROPUERTO', 'ESPANOL PUNTILLA', 'ESPANOL AEROPUERTO UIO',
            'GENERAL - ESPANOL SERVICIO A LA MESA', 'GENERAL PROMOCIONAL', 'GENERAL ALTA', 'PROVINCIAS ALTA',
            'GENERAL - GUS', 'GUS GUAYAQUIL', 'GUS QUEVEDO', 'GUS DIFERENCIADOS', 'GUS PILOTOS',
            'JUAN VALDEZ', 'JUAN VALDEZ AEROPUERTO', 'GENERAL - JUAN VALDEZ', 'JUAN VALDEZ AEROPUERTO UIO',
            'JUAN VALDEZ CEIBOS', 'JUAN VALDEZ PREEMBARQUE', 'JUAN VALDEZ-BEL', 'TERPEL', 'POR COMPETECIA STARB',
            'CUENCA', 'AEROPUERTO GYE', 'GENERAL - MENESTRAS', 'MENESTRAS GYE PILOTO', 'MENESTRAS MANABI',
            'PILOTOS PROV', 'TROPI CANCHAS', 'TROPI GUAYAQUIL', 'GENERAL - TROPI', 'TROPI LOCALES SUR',
            'TROPI CUENCA', 'TROPI-PILOTO', 'DOMICILIO UBER', 'GENERAL - IL CAPPO', 'IL CAPPO VALOR',
            'IL CAPPO AEROPUERTO', 'IL CAPPO JARDIN', '9 DE OCTUBRE', 'AEROPUERTO', 'GENERAL',
            'CASA RES SAN MARINO', 'CASA RES GYE', 'MANABI', 'GENERAL FEDERER', 'APP MERCADITO',
            'GENERAL - CINNABON', 'AEREOPUERTO GYE-BASKIN ROBBINS', 'BASKIN AEREOPUERTO QUITO',
            'BASKIN VALOR', 'PREMIUM-BASKIN ROBBINS NIVEL 2', 'GENERAL - BASKIN ROBBINS',
            'ARRIBO INTERNACIONAL GYE', 'BASKIN VALOR NIVEL 2', 'GENERAL - DOLCE INCONTRO',
            'GASOLINERA', 'DOLCE PILOTO', 'OTRO'
        ],
        required: [true, 'La categoría de precio es requerida']
    },
    direccion: {
        calle: { type: String, required: true },
        ciudad: { type: String, required: true },
        provincia: { type: String, required: true },
        codigoPostal: String,
        referencia: String
    },
    localidad: String,
    tipoServicio: {
        type: String,
        enum: ['FAST FOOD', 'FULL SERVICE', 'PATIOS DE COMIDA', 'IL', 'DL', 'MIXTO'],
        default: 'FAST FOOD',
        required: true,
        set: function(value) {
            if (!value) return value;
            const valueStr = value.toString().toUpperCase().trim();
            const map = {
                'FASTFOOD': 'FAST FOOD', 'FAST FOOD': 'FAST FOOD', 'FAST': 'FAST FOOD',
                'FULLSERVICE': 'FULL SERVICE', 'FULL SERVICE': 'FULL SERVICE', 'FULL': 'FULL SERVICE',
                'PATIOS': 'PATIOS DE COMIDA', 'PATIOS DE COMIDA': 'PATIOS DE COMIDA',
                'IL': 'IL', 'DL': 'DL', 'MIXTO': 'MIXTO'
            };
            return map[valueStr] || valueStr;
        }
    },
    ruc: {
        type: String,
        required: true,
        match: [/^\d{13}$/, 'RUC debe tener 13 dígitos']
    },
    empresa: {
        type: String,
        default: 'INT FOOD SERVICES CORP SA'
    },
    telefono: String,

    fechaSolicitud: { type: Date, default: Date.now },
    fechaAperturaPlanificada: { type: Date, required: true },
    fechaAperturaReal: Date,
    fechaCierre: Date,

    // =============================================
    // 👇 ESTADO GENERAL - MODIFICADO
    // =============================================
    estadoGeneral: {
        type: String,
        enum: [
            'pendiente',
            'en_proceso',
            'en_revision',           // 👈 AGREGADO
            'instalacion',           // 👈 AGREGADO
            'en_espera_proveedor',
            'en_espera_cliente',
            'pendiente_aprobacion',
            'apertura',
            'completado',
            'cerrado',
            'cancelado',
            'bloqueado'              // 👈 AGREGADO
        ],
        default: 'pendiente'
    },
    progreso: { type: Number, min: 0, max: 100, default: 0 },

    server: { type: String, default: '' },
    ipServidor: { type: String, match: [/^(\d{1,3}\.){3}\d{1,3}$/, 'IP inválida'], default: '' },
    mid: { type: String, default: '' },

    configuracionEstaciones: {
        cajas: { activo: { type: Boolean, default: false }, items: [{ id: String, nombre: String, seleccionado: Boolean, descripcion: String }] },
        kioscos: { activo: { type: Boolean, default: false }, items: [{ id: String, nombre: String, seleccionado: Boolean }] },
        delivery: { activo: { type: Boolean, default: false }, agregadores: Boolean, canalPropio: Boolean },
        pickUp: { type: Boolean, default: false },
        drive: { activo: { type: Boolean, default: false }, items: [{ id: String, nombre: String, seleccionado: Boolean }] },
        heladeria: { activo: { type: Boolean, default: false }, items: [{ id: String, nombre: String, seleccionado: Boolean }] },
        meseros: { activo: { type: Boolean, default: false }, items: [{ id: String, nombre: String, seleccionado: Boolean }] },
        impresoraLinea: { type: Boolean, default: false },
        impresoraLineaDomi: { type: Boolean, default: false },
        impresoraBar: { type: Boolean, default: false },
        impresoraCocina: { type: Boolean, default: false },
        impresoraParrilla: { type: Boolean, default: false },
        impresoraPersonalizada: { type: Boolean, default: false },
        impresoraPersonalizadaNombre: String,
        kdsItems: { kds1: Boolean, kds2: Boolean, kds3: Boolean, kdsPersonalizado: Boolean, kdsPersonalizadoNombre: String }
    },

    puntosEmision: [{
        nombre: String, codigo: String,
        tipo: { type: String, enum: ['caja', 'drive', 'kiosco', 'pickup', 'domicilio', 'tablet'] },
        impresora: String, ip: String, tid: String, activo: { type: Boolean, default: true }
    }],

    configuraciones: {
        impuestos: { tipo: { type: String, default: 'IVA' }, porcentaje: { type: Number, default: 15 }, metodo: { type: String, enum: ['incluido', 'adicional'], default: 'incluido' } },
        facturacion: { tipo: { type: String, default: 'Plan Market' }, serie: String, puntoEmision: String, secuencial: Number },
        horarioAtencion: { type: String, default: '7 DÍAS' },
        kds: { type: Boolean, default: false },
        delivery: { type: Boolean, default: false },
        drive: { type: Boolean, default: false },
        kioscos: { type: Boolean, default: false },
        dragonTail: { type: Boolean, default: false },
        impresorasBalanceo: { type: Boolean, default: false },
        facturacionElectronica: { type: Boolean, default: true },
        domicilios: { type: Boolean, default: false },
        lineaDomicilio: { type: Boolean, default: false }
    },

    responsables: {
        operaciones: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        it: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dsi: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cx: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        contabilidad: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        trade: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        marketing: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        mesaServicio: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },

    responsableOperaciones: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responsableIT: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responsableDSI: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responsableCX: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responsableContabilidad: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    checklistRUC: {
        emitido: { type: Boolean, default: false }, fechaEmision: Date,
        emitidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        entregado: { type: Boolean, default: false }, fechaEntrega: Date, url: String
    },

    integraciones: {
        mxp: { type: Boolean, default: false }, swt: { type: Boolean, default: false },
        trade: { type: Boolean, default: false }, dragonTail: { type: Boolean, default: false },
        apiIntegracion: { type: Boolean, default: false }, mongodbConfig: { type: Boolean, default: false }
    },

    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ultimaModificacion: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    observaciones: String,

    historial: [{
        fecha: { type: Date, default: Date.now },
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        accion: String, campo: String,
        valorAnterior: mongoose.Schema.Types.Mixed,
        valorNuevo: mongoose.Schema.Types.Mixed
    }],

    // ===== NUEVOS CAMPOS PARA PRUEBAS Y APROBACIONES =====
    pruebas: {
        funcionales: {
            estaciones: [{
                estacionId: String,
                estacionNombre: String,
                estacionTipo: String,
                completado: { type: Boolean, default: false },
                observaciones: [{
                    texto: String,
                    usuario: String,
                    fecha: { type: Date, default: Date.now }
                }],
                archivos: [{
                    nombre: String,
                    url: String,
                    fechaSubida: { type: Date, default: Date.now }
                }]
            }],
            fechaCompletado: Date,
            completadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        },
        preApertura: {
            facturaEfectivo: {
                archivo: { nombre: String, url: String, fechaSubida: { type: Date, default: Date.now } },
                observaciones: [{
                    texto: String,
                    usuario: String,
                    fecha: { type: Date, default: Date.now }
                }],
                completado: { type: Boolean, default: false }
            },
            facturaTarjeta: {
                archivo: { nombre: String, url: String, fechaSubida: { type: Date, default: Date.now } },
                observaciones: [{
                    texto: String,
                    usuario: String,
                    fecha: { type: Date, default: Date.now }
                }],
                completado: { type: Boolean, default: false }
            },
            fechaCompletado: Date,
            completadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        },
        aprobacionContabilidad: {
            facturaDocumento: {
                archivo: { nombre: String, url: String, fechaSubida: { type: Date, default: Date.now } },
                observaciones: [{
                    texto: String,
                    usuario: String,
                    fecha: { type: Date, default: Date.now }
                }]
            },
            aprobado: { type: Boolean, default: false },
            fechaAprobacion: Date,
            aprobadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    },

    // RESUMEN FINAL
    resumenFinal: {
        tiempoTotalHoras: { type: Number, default: 0 },
        tiempoPorEtapa: {
            configuracion: { type: Number, default: 0 },
            pruebas: { type: Number, default: 0 },
            instalacion: { type: Number, default: 0 },
            apertura: { type: Number, default: 0 }
        },
        chatResumen: [{
            usuario: String,
            mensaje: String,
            fecha: { type: Date, default: Date.now }
        }],
        fechaFinalizacion: Date,
        finalizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }

}, { timestamps: true });

// ÍNDICES
tiendaSchema.index({ codigo: 1 });
tiendaSchema.index({ cadena: 1 });
tiendaSchema.index({ categoriaPrecio: 1 });
tiendaSchema.index({ estadoGeneral: 1, fechaAperturaPlanificada: 1 });
tiendaSchema.index({ 'responsables.cx': 1, estadoGeneral: 1 });
tiendaSchema.index({ 'responsables.operaciones': 1 });
tiendaSchema.index({ fechaAperturaPlanificada: 1 });
tiendaSchema.index({ 'direccion.ciudad': 1 });

// VIRTUALES
tiendaSchema.virtual('diasRestantes').get(function() {
    if (!this.fechaAperturaPlanificada) return null;
    const hoy = new Date();
    const apertura = new Date(this.fechaAperturaPlanificada);
    return Math.ceil((apertura - hoy) / (1000 * 60 * 60 * 24));
});

tiendaSchema.virtual('atrasada').get(function() {
    if (!this.fechaAperturaPlanificada) return false;
    if (['completado', 'cerrado', 'cancelado'].includes(this.estadoGeneral)) return false;
    return new Date() > new Date(this.fechaAperturaPlanificada);
});

// MIDDLEWARE
tiendaSchema.pre('save', function(next) {
    // ✅ Sincronizar responsableCX con responsables.cx
    if (this.responsableCX) {
        this.responsables.cx = this.responsableCX;
    }
    if (this.responsables.cx) {
        this.responsableCX = this.responsables.cx;
    }
    if (this.responsableOperaciones) this.responsables.operaciones = this.responsableOperaciones;
    if (this.responsableIT) this.responsables.it = this.responsableIT;
    if (this.responsableDSI) this.responsables.dsi = this.responsableDSI;
    if (this.responsableCX) this.responsables.cx = this.responsableCX;
    if (this.responsableContabilidad) this.responsables.contabilidad = this.responsableContabilidad;
    if (this.responsables.operaciones) this.responsableOperaciones = this.responsables.operaciones;
    if (this.responsables.it) this.responsableIT = this.responsables.it;
    if (this.responsables.dsi) this.responsableDSI = this.responsables.dsi;
    if (this.responsables.cx) this.responsableCX = this.responsables.cx;
    if (this.responsables.contabilidad) this.responsableContabilidad = this.responsables.contabilidad;
    next();
});

// MÉTODOS
tiendaSchema.methods.agregarPuntoEmision = function(punto) {
    this.puntosEmision.push(punto);
    return this.save();
};

tiendaSchema.methods.actualizarProgreso = async function() {
    const Proceso = mongoose.model('Proceso');
    const procesos = await Proceso.find({ tienda: this._id });
    if (procesos.length === 0) {
        this.progreso = 0;
    } else {
        const completados = procesos.filter(p => p.estado === 'completado').length;
        this.progreso = Math.round((completados / procesos.length) * 100);
    }
    return this.save();
};

tiendaSchema.methods.registrarHistorial = function(usuarioId, accion, campo, valorAnterior, valorNuevo) {
    this.historial.push({ fecha: new Date(), usuario: usuarioId, accion, campo, valorAnterior, valorNuevo });
    return this.save();
};

tiendaSchema.statics.getCategoriasPorCadena = function(cadena) {
    const categorias = {
        'KFC': ['KFC SIERRA CENTRO', 'KFC COSTA NORTE', 'KFC PICHINCHA', 'KFC - AEROPUERTO', 'KFC - HIBRIDO', 'KFC - CUENCA', 'KFC - MOVIL', 'KFC-GYE', 'KFC UIO', 'GENERAL - 2014', 'AEROPUERTO GYE', 'KFC COSTA CENTRO', 'KFC LATACUNGA RIOBAMBA', 'KFC LOJA MACHALA', 'KFC MOBILES GYE', 'KFC ORIENTE', 'ATACAMES', 'EXPRESS', 'KFC-MANABI'],
        'AMERICAN_DELI': ['DELI FONTANA Y PLAZA', 'DELI MANTA', 'DELI FULL PILOTO', 'DELI IN LINE NORTE', 'DELI TERMINAL PATIO', 'DELI CITY BISTRO', 'GENERAL - DELI PATIOS', 'DELI PATIO FULL', 'D ARRECIFE UIO', 'DELI ARRECIFE'],
        'CAJUN': ['CAJUN AEROPUERTO', 'CAJUN TERMINAL', 'CAJUN AERO QUITO', 'GENERAL - CAJUN', 'CAJUN PASEO SAN FRANCISCO', 'CONVENIOS'],
        'ESPANOL': ['PROVINCIAS', 'ESPAÑOL PREEMBARQUE GYE', 'ESPAÑOL AEROPUERTO', 'ESPANOL PUNTILLA', 'ESPANOL AEROPUERTO UIO', 'GENERAL - ESPANOL SERVICIO A LA MESA', 'GENERAL PROMOCIONAL', 'GENERAL ALTA', 'PROVINCIAS ALTA'],
        'GUS': ['GENERAL - GUS', 'GUS GUAYAQUIL', 'GUS QUEVEDO', 'GUS DIFERENCIADOS', 'GUS PILOTOS'],
        'JUAN_VALDEZ': ['JUAN VALDEZ', 'JUAN VALDEZ AEROPUERTO', 'GENERAL - JUAN VALDEZ', 'JUAN VALDEZ AEROPUERTO UIO', 'JUAN VALDEZ CEIBOS', 'JUAN VALDEZ PREEMBARQUE', 'JUAN VALDEZ-BEL', 'TERPEL', 'POR COMPETECIA STARB'],
        'MENESTRAS': ['CUENCA', 'AEROPUERTO GYE', 'GENERAL - MENESTRAS', 'MENESTRAS GYE PILOTO', 'MENESTRAS MANABI', 'PILOTOS PROV'],
        'TROPI': ['TROPI CANCHAS', 'TROPI GUAYAQUIL', 'GENERAL - TROPI', 'TROPI LOCALES SUR', 'TROPI CUENCA', 'TROPI-PILOTO', 'DOMICILIO UBER'],
        'IL_CAPPO': ['GENERAL - IL CAPPO', 'IL CAPPO VALOR', 'IL CAPPO AEROPUERTO', 'IL CAPPO JARDIN'],
        'CASA_RES': ['9 DE OCTUBRE', 'AEROPUERTO', 'GENERAL', 'CASA RES SAN MARINO', 'CASA RES GYE', 'MANABI'],
        'FEDERER': ['GENERAL FEDERER', 'APP MERCADITO'],
        'BASKIN_ROBBINS': ['GENERAL - CINNABON', 'AEREOPUERTO GYE-BASKIN ROBBINS', 'BASKIN AEREOPUERTO QUITO', 'BASKIN VALOR', 'PREMIUM-BASKIN ROBBINS NIVEL 2', 'GENERAL - BASKIN ROBBINS', 'ARRIBO INTERNACIONAL GYE', 'BASKIN VALOR NIVEL 2'],
        'CINNABON': ['GENERAL - CINNABON', 'AEREOPUERTO GYE-BASKIN ROBBINS', 'BASKIN AEREOPUERTO QUITO', 'BASKIN VALOR', 'PREMIUM-BASKIN ROBBINS NIVEL 2'],
        'DOLCE_INCONTRO': ['GENERAL - DOLCE INCONTRO', 'GASOLINERA', 'DOLCE PILOTO'],
        'OTRO': ['OTRO']
    };
    return categorias[cadena] || [];
};

module.exports = mongoose.model('Tienda', tiendaSchema);