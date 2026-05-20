// backend/src/controllers/procesoController.js

const Proceso = require('../models/Proceso');
const Tienda = require('../models/Tienda');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// @desc    Crear un nuevo proceso
// @route   POST /api/procesos
// @access  Private
exports.crearProceso = async (req, res) => {
    try {
        console.log('📝 Creando nuevo proceso:', req.body.nombre);

        const procesoData = {
            ...req.body,
            historial: [{
                fecha: new Date(),
                usuario: req.user.id,
                accion: 'creación',
                detalles: 'Proceso creado'
            }]
        };

        const proceso = await Proceso.create(procesoData);

        console.log('✅ Proceso creado con ID:', proceso._id);

        res.status(201).json({
            success: true,
            data: proceso
        });
    } catch (error) {
        console.error('❌ Error creando proceso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener procesos de una tienda
// @route   GET /api/procesos/tienda/:tiendaId
// @access  Private
exports.getProcesosByTienda = async (req, res) => {
    try {
        console.log(`🔍 Buscando procesos para tienda: ${req.params.tiendaId}`);

        const procesos = await Proceso.find({ tienda: req.params.tiendaId })
            .populate('checklist.responsable', 'nombre email')
            .populate('checklist.validadoPor', 'nombre email')
            .populate('historial.usuario', 'nombre email')
            .populate('equipo.lider', 'nombre email')
            .populate('equipo.responsables', 'nombre email')
            .sort('orden');

        console.log(`✅ Procesos encontrados: ${procesos.length}`);

        res.json({
            success: true,
            count: procesos.length,
            data: procesos
        });
    } catch (error) {
        console.error('❌ Error en getProcesosByTienda:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener proceso por ID
// @route   GET /api/procesos/:id
// @access  Private
exports.getProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id)
            .populate({
                path: 'tienda',
                select: 'codigo nombre direccion configuraciones puntosEmision'
            })
            .populate('checklist.responsable', 'nombre email')
            .populate('checklist.validadoPor', 'nombre email')
            .populate('historial.usuario', 'nombre email')
            .populate('equipo.lider', 'nombre email')
            .populate('equipo.responsables', 'nombre email');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        if (proceso.tienda && proceso.tienda.puntosEmision) {
            proceso.tienda.puntosEmision = proceso.tienda.puntosEmision.map(punto => {
                const puntoObj = punto.toObject ? punto.toObject() : punto;
                const itemExistente = proceso.checklist.find(item =>
                    item.item.includes(puntoObj.nombre) ||
                    item.item.includes(puntoObj.codigo)
                );

                return {
                    ...puntoObj,
                    enRevision: proceso.estado === 'pendiente_aprobacion' || proceso.estado === 'en_revision',
                    validado: itemExistente?.validado || false,
                    itemId: itemExistente?._id
                };
            });
        }

        res.json({
            success: true,
            data: proceso
        });
    } catch (error) {
        console.error('❌ Error en getProceso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Validar punto de emisión en revisión
// @route   PUT /api/procesos/:id/validar-punto/:puntoId
// @access  Private
exports.validarPuntoEmision = async (req, res) => {
    try {
        const { id, puntoId } = req.params;
        const { validado, observaciones } = req.body;

        const proceso = await Proceso.findById(id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        if (proceso.estado !== 'pendiente_aprobacion' && proceso.estado !== 'en_revision') {
            return res.status(400).json({
                success: false,
                error: 'Los puntos solo pueden validarse cuando el proceso está en revisión'
            });
        }

        const tienda = proceso.tienda;
        const punto = tienda.puntosEmision?.id(puntoId);

        if (!punto) {
            return res.status(404).json({
                success: false,
                error: 'Punto de emisión no encontrado'
            });
        }

        let checklistItem = proceso.checklist.find(item =>
            item.item.includes(punto.nombre) || item.item.includes(`Punto ${punto.codigo}`)
        );

        if (!checklistItem) {
            proceso.checklist.push({
                item: `Configuración de ${punto.nombre} (${punto.tipo})`,
                descripcion: `Validar configuración del punto de emisión ${punto.codigo}`,
                requiereValidacion: true,
                validado: validado || false,
                observaciones: observaciones || '',
                fechaValidacion: validado ? new Date() : null,
                validadoPor: validado ? req.user.id : null
            });
        } else {
            checklistItem.validado = validado || false;
            if (observaciones) checklistItem.observaciones = observaciones;
            if (validado) {
                checklistItem.fechaValidacion = new Date();
                checklistItem.validadoPor = req.user.id;
            }
        }

        proceso.calcularProgreso();
        await proceso.save();

        res.json({
            success: true,
            message: validado ? 'Punto validado correctamente' : 'Validación actualizada',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error validando punto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Iniciar proceso (pendiente -> en_proceso)
// @route   PUT /api/procesos/:id/iniciar
// @access  Private
exports.iniciarProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        if (proceso.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                error: `El proceso ya está en estado: ${proceso.estado}`
            });
        }

        const estadoAnterior = proceso.estado;

        proceso.finalizarEtapa('pendiente');
        proceso.estado = 'en_proceso';
        proceso.fechas.inicioReal = new Date();
        proceso.iniciarEtapa('en_proceso');

        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'inicio',
            estadoAnterior,
            estadoNuevo: 'en_proceso',
            detalles: 'Proceso iniciado'
        });

        await proceso.save();
        await notificationService.emitCambioEstado(proceso, proceso.tienda, estadoAnterior, req.user.id);

        res.json({
            success: true,
            message: 'Proceso iniciado correctamente',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error iniciando proceso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Actualizar checklist completo
// @route   PUT /api/procesos/:id/checklist
// @access  Private
exports.actualizarChecklist = async (req, res) => {
    try {
        const { checklist } = req.body;
        const proceso = await Proceso.findById(req.params.id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        let cambios = false;
        for (const item of checklist) {
            const itemExistente = proceso.checklist.id(item._id);
            if (itemExistente) {
                if (itemExistente.validado !== item.validado) {
                    itemExistente.validado = item.validado;
                    itemExistente.fechaValidacion = item.validado ? new Date() : null;
                    itemExistente.validadoPor = item.validado ? req.user.id : null;
                    cambios = true;
                }
                if (item.observaciones !== undefined) {
                    itemExistente.observaciones = item.observaciones;
                }
            }
        }

        if (!cambios) {
            return res.json({
                success: true,
                message: 'Sin cambios en el checklist',
                data: proceso
            });
        }

        proceso.calcularProgreso();

        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'checklist',
            detalles: 'Checklist actualizado'
        });

        await proceso.save();

        res.json({
            success: true,
            message: 'Checklist actualizado',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error actualizando checklist:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Pasar proceso a revisión (en_proceso -> pendiente_aprobacion)
// @route   PUT /api/procesos/:id/revision
// @access  Private
exports.pasarARevision = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        if (proceso.estado !== 'en_proceso') {
            return res.status(400).json({
                success: false,
                error: `El proceso debe estar en proceso, actual: ${proceso.estado}`
            });
        }

        const itemsRequeridos = proceso.checklist.filter(item => item.requiereValidacion);
        const itemsPendientes = itemsRequeridos.filter(item => !item.validado);

        if (itemsPendientes.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Faltan ${itemsPendientes.length} items por validar`,
                itemsPendientes: itemsPendientes.map(i => i.item)
            });
        }

        const estadoAnterior = proceso.estado;

        proceso.finalizarEtapa('en_proceso');
        proceso.estado = 'pendiente_aprobacion';
        proceso.iniciarEtapa('pendiente_aprobacion');

        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'revision',
            estadoAnterior,
            estadoNuevo: 'pendiente_aprobacion',
            detalles: 'Proceso enviado a revisión'
        });

        await proceso.save();
        await notificationService.emitCambioEstado(proceso, proceso.tienda, estadoAnterior, req.user.id);

        res.json({
            success: true,
            message: 'Proceso enviado a revisión',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error pasando a revisión:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Continuar revisión (pendiente_aprobacion -> en_revision)
// @route   PUT /api/procesos/:id/continuar-revision
// @access  Private
exports.continuarRevision = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        if (proceso.estado !== 'pendiente_aprobacion') {
            return res.status(400).json({
                success: false,
                error: `El proceso debe estar en pendiente_aprobacion, actual: ${proceso.estado}`
            });
        }

        const estadoAnterior = proceso.estado;

        proceso.finalizarEtapa('pendiente_aprobacion');
        proceso.estado = 'en_revision';
        proceso.iniciarEtapa('en_revision');

        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'continuar_revision',
            estadoAnterior,
            estadoNuevo: 'en_revision',
            detalles: 'Proceso devuelto a revisión para continuar con configuración'
        });

        await proceso.save();
        await notificationService.emitCambioEstado(proceso, proceso.tienda, estadoAnterior, req.user.id);

        res.json({
            success: true,
            message: 'Proceso devuelto a revisión',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error en continuarRevision:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============= FUNCIÓN FINALIZAR PROCESO CORREGIDA =============

// @desc    Finalizar proceso de apertura (apertura -> completado)
// @route   PUT /api/procesos/:id/finalizar
// @access  Private
exports.finalizarProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id).populate('tienda');

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        // 🔥 MODIFICADO: Permitir finalizar desde apertura, instalacion o pendiente_aprobacion
        if (proceso.estado !== 'pendiente_aprobacion' && proceso.estado !== 'apertura' && proceso.estado !== 'instalacion') {
            return res.status(400).json({
                success: false,
                error: `El proceso debe estar en Apertura o Instalación para finalizarlo, actual: ${proceso.estado}`
            });
        }

        const estadoAnterior = proceso.estado;

        // Finalizar etapa actual
        if (typeof proceso.finalizarEtapa === 'function') {
            proceso.finalizarEtapa(proceso.estado);
        }

        proceso.estado = 'completado';
        proceso.fechas.finReal = new Date();

        if (typeof proceso.iniciarEtapa === 'function') {
            proceso.iniciarEtapa('completado');
        }

        if (typeof proceso.actualizarTiempoReal === 'function') {
            proceso.actualizarTiempoReal();
        }

        // Registrar en historial
        proceso.historial = proceso.historial || [];
        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'finalizacion_apertura',
            estadoAnterior,
            estadoNuevo: 'completado',
            detalles: 'Apertura finalizada exitosamente'
        });

        await proceso.save();

        // 🔥 NUEVO: Actualizar también el estado de la tienda
        if (proceso.tienda) {
            proceso.tienda.estadoGeneral = 'completado';
            await proceso.tienda.save();
            console.log(`✅ Tienda ${proceso.tienda.codigo} actualizada a completado`);

            // Registrar en historial de la tienda
            if (typeof proceso.tienda.registrarHistorial === 'function') {
                await proceso.tienda.registrarHistorial(
                    req.user.id,
                    'finalizacion_apertura',
                    'estadoGeneral',
                    estadoAnterior,
                    'completado'
                );
            }
        }

        await notificationService.emitCambioEstado(proceso, proceso.tienda, estadoAnterior, req.user.id);

        res.json({
            success: true,
            message: 'Apertura finalizada exitosamente',
            data: proceso
        });

    } catch (error) {
        console.error('❌ Error finalizando proceso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener configuración dinámica para el proceso
// @route   GET /api/procesos/:id/configuracion
// @access  Private
exports.getConfiguracionProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id)
            .populate({
                path: 'tienda',
                populate: {
                    path: 'responsables.cx responsables.operaciones',
                    select: 'nombre email'
                }
            });

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        const tienda = proceso.tienda;

        const configuracion = {
            estaciones: tienda.puntosEmision?.filter(p => p.tipo === 'caja').map(caja => ({
                _id: caja._id,
                nombre: caja.nombre || `Caja ${caja.codigo}`,
                codigo: caja.codigo,
                ip: caja.ip,
                activo: caja.activo,
                configurado: false
            })) || [],

            impresoras: {
                cajas: tienda.puntosEmision?.filter(p => p.impresora).map(p => ({
                    nombre: p.impresora,
                    caja: p.nombre,
                    configurado: false
                })) || [],
                linea: tienda.configuraciones?.facturacion?.tipo === 'Plan Market',
                domicilio: tienda.configuraciones?.lineaDomicilio || false
            },

            formasPago: {
                efectivo: { activo: true, configurado: false },
                tarjeta: { activo: true, configurado: false },
                domicilio: { activo: tienda.configuraciones?.domicilios || false, configurado: false }
            },

            servicios: {
                kds: { activo: tienda.configuraciones?.kds || false, configurado: false },
                kioscos: { activo: tienda.configuraciones?.kioscos || false, configurado: false },
                dragonTail: { activo: tienda.configuraciones?.dragonTail || false, configurado: false },
                delivery: { activo: tienda.configuraciones?.delivery || false, configurado: false },
                drive: { activo: tienda.configuraciones?.drive || false, configurado: false },
                uosellin: { activo: false, configurado: false }
            },

            usuariosLocal: await User.find({
                area: { $in: ['cx', 'operaciones', 'campo', 'aperturas'] },
                activo: true
            }).select('nombre apellido email area role'),

            politicas: {
                replicaInicial: false,
                usuariosConfigurados: false,
                kioscoUser: tienda.configuraciones?.kioscos || false
            },

            progreso: proceso.progreso,
            checklist: proceso.checklist
        };

        res.json({
            success: true,
            data: configuracion
        });

    } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Validar item de checklist
// @route   PUT /api/procesos/:id/checklist/:itemId/validate
// @access  Private
exports.validateChecklistItem = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id);

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        const item = proceso.checklist.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item no encontrado'
            });
        }

        item.validado = true;
        item.fechaValidacion = new Date();
        item.validadoPor = req.user.id;

        if (req.body.observaciones) {
            item.observaciones = req.body.observaciones;
        }

        proceso.calcularProgreso();

        proceso.historial.push({
            fecha: new Date(),
            usuario: req.user.id,
            accion: 'validación',
            detalles: `Item validado: ${item.item}`
        });

        await proceso.save();

        res.json({
            success: true,
            data: item,
            progreso: proceso.progreso,
            message: 'Item validado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error validando item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Agregar item a checklist
// @route   POST /api/procesos/:id/checklist
// @access  Private
exports.addChecklistItem = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id);

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        const newItem = {
            item: req.body.item,
            descripcion: req.body.descripcion,
            responsable: req.body.responsable,
            requiereValidacion: req.body.requiereValidacion ?? true,
            tiempoEstimado: req.body.tiempoEstimado
        };

        proceso.checklist.push(newItem);
        await proceso.save();

        res.json({
            success: true,
            data: proceso.checklist[proceso.checklist.length - 1]
        });
    } catch (error) {
        console.error('❌ Error agregando item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Subir adjunto a checklist
// @route   POST /api/procesos/:id/checklist/:itemId/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se subió ningún archivo'
            });
        }

        const proceso = await Proceso.findById(req.params.id);

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        const item = proceso.checklist.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item no encontrado'
            });
        }

        const attachment = {
            nombre: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            tipo: req.file.mimetype,
            tamaño: req.file.size,
            fechaSubida: new Date()
        };

        if (!item.adjuntos) {
            item.adjuntos = [];
        }

        item.adjuntos.push(attachment);
        await proceso.save();

        res.json({
            success: true,
            data: attachment
        });
    } catch (error) {
        console.error('❌ Error subiendo adjunto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener mis procesos (por área)
// @route   GET /api/procesos/mis-procesos
// @access  Private
exports.getMyProcesos = async (req, res) => {
    try {
        const { estado } = req.query;
        let query = {
            $or: [
                { area: req.user.area },
                { 'equipo.lider': req.user.id },
                { 'equipo.responsables': req.user.id }
            ]
        };

        if (estado) {
            query.estado = estado;
        } else {
            query.estado = { $nin: ['completado', 'cancelado'] };
        }

        const procesos = await Proceso.find(query)
            .populate('tienda', 'codigo nombre estadoGeneral')
            .populate('equipo.lider', 'nombre email')
            .sort({ 'fechas.finEstimado': 1, prioridad: -1 });

        const stats = {
            total: procesos.length,
            pendientes: procesos.filter(p => p.estado === 'pendiente').length,
            enProceso: procesos.filter(p => p.estado === 'en_proceso').length,
            enRevision: procesos.filter(p => p.estado === 'en_revision').length,
            revision: procesos.filter(p => p.estado === 'pendiente_aprobacion').length,
            atrasados: procesos.filter(p => p.estadoTiempo === 'atrasado').length
        };

        res.json({
            success: true,
            count: procesos.length,
            stats,
            data: procesos
        });
    } catch (error) {
        console.error('❌ Error obteniendo mis procesos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Actualizar proceso
// @route   PUT /api/procesos/:id
// @access  Private
exports.updateProceso = async (req, res) => {
    try {
        const proceso = await Proceso.findById(req.params.id);

        if (!proceso) {
            return res.status(404).json({
                success: false,
                error: 'Proceso no encontrado'
            });
        }

        const estadoAnterior = proceso.estado;

        proceso.historial.push({
            usuario: req.user.id,
            accion: 'Actualización de proceso',
            estadoAnterior,
            estadoNuevo: req.body.estado || estadoAnterior,
            detalles: req.body
        });

        Object.assign(proceso, req.body);

        if (req.body.estado === 'completado' && !proceso.fechas.finReal) {
            proceso.fechas.finReal = new Date();
            proceso.actualizarTiempoReal();
        }

        await proceso.save();

        if (estadoAnterior !== proceso.estado) {
            const tienda = await Tienda.findById(proceso.tienda);
            await notificationService.emitCambioEstado(proceso, tienda, estadoAnterior, req.user.id);
        }

        res.json({
            success: true,
            data: proceso
        });
    } catch (error) {
        console.error('❌ Error actualizando proceso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};