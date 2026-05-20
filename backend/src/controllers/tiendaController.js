// backend/controllers/tiendaController.js
const Tienda = require('../models/Tienda');
const Proceso = require('../models/Proceso');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// @desc    Crear nueva tienda (con validación mejorada)
// @route   POST /api/tiendas
exports.createTienda = async (req, res) => {
    try {
        // Normalizar tipoServicio si viene en formato incorrecto
        if (req.body.tipoServicio) {
            const tipoMap = {
                'fast food': 'FAST FOOD',
                'fastfood': 'FAST FOOD',
                'fast': 'FAST FOOD',
                'full service': 'FULL SERVICE',
                'fullservice': 'FULL SERVICE',
                'full': 'FULL SERVICE',
                'patios de comida': 'PATIOS DE COMIDA',
                'patios': 'PATIOS DE COMIDA',
                'il': 'IL',
                'dl': 'DL',
                'mixto': 'MIXTO'
            };
            const inputLower = req.body.tipoServicio.toLowerCase().trim();
            req.body.tipoServicio = tipoMap[inputLower] || req.body.tipoServicio.toUpperCase();
        }

        // ✅ CORRECCIÓN AGREGADA: Sincronizar responsableCX con responsable y responsables.cx
        if (req.body.responsableCX) {
            const tecnico = await User.findById(req.body.responsableCX).select('nombre apellido email');
            if (tecnico) {
                req.body.responsable = `${tecnico.nombre} ${tecnico.apellido || ''}`.trim();
                req.body.responsables = {
                    ...req.body.responsables,
                    cx: req.body.responsableCX
                };
            }
        }

        // ✅ LOGS AGREGADOS PARA DEPURACIÓN
        console.log('📥 Datos recibidos en backend:');
        console.log('   responsableCX:', req.body.responsableCX);
        console.log('   responsable:', req.body.responsable);
        console.log('   responsables:', req.body.responsables);

        const tiendaData = {
            ...req.body,
            creadoPor: req.user.id,
            'metadata.creadoPor': req.user.id,
            'metadata.fechaActualizacion': new Date()
        };

        const tienda = await Tienda.create(tiendaData);

        // Registrar en historial
        await tienda.registrarHistorial(
            req.user.id,
            'creación',
            null,
            null,
            tienda.toObject()
        );

        // Enviar notificaciones
        await notificationService.emitTiendaCreada(tienda, req.user.id);

        // =============================================
        // ✅ ENVÍO DE CORREO DE NOTIFICACIÓN
        // =============================================
        try {
            // Obtener el técnico CX asignado
            let tecnicoCX = null;
            if (tienda.responsableCX) {
                tecnicoCX = await User.findById(tienda.responsableCX).select('nombre apellido email');
            }

            // Enviar correo
            await emailService.enviarCorreoCreacionTienda(tienda, req.user, tecnicoCX);
            console.log(`📧 Correo enviado para tienda ${tienda.codigo}`);
        } catch (emailError) {
            console.error('❌ Error enviando correo de notificación:', emailError.message);
            // No fallar la creación de la tienda si el correo falla
        }

        // Poblar datos para la respuesta
        const tiendaPopulada = await Tienda.findById(tienda._id)
            .populate('creadoPor', 'nombre email')
            .populate('responsables.operaciones', 'nombre email')
            .populate('responsables.it', 'nombre email')
            .populate('responsables.dsi', 'nombre email')
            .populate('responsables.cx', 'nombre email')
            .populate('responsables.contabilidad', 'nombre email');

        // ✅ LOG AGREGADO
        console.log('✅ Tienda creada exitosamente. responsableCX guardado:', tienda.responsableCX);

        res.status(201).json({
            success: true,
            message: 'Tienda creada exitosamente',
            data: tiendaPopulada
        });
    } catch (error) {
        console.error('❌ Error creando tienda:', error);

        // Manejar errores de validación
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Manejar error de campo único duplicado
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `La tienda con ese ${field} ya existe`
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener usuarios por área (para selects)
// @route   GET /api/tiendas/usuarios-por-area
exports.getUsuariosPorArea = async (req, res) => {
    try {
        const usuarios = await User.find({ activo: true })
            .select('_id nombre apellido email area role telefono cadenaAsignada')
            .sort('area nombre');

        // Agrupar por área
        const agrupados = {
            operaciones: usuarios.filter(u => u.area === 'operaciones'),
            it: usuarios.filter(u => u.area === 'it' || u.area === 'infraestructura'),
            dsi: usuarios.filter(u => u.area === 'dsi' || u.area === 'desarrollo'),
            cx: usuarios.filter(u => u.area === 'cx'),
            contabilidad: usuarios.filter(u => u.area === 'contabilidad'),
            trade: usuarios.filter(u => u.area === 'trade'),
            marketing: usuarios.filter(u => u.area === 'marketing'),
            aperturas: usuarios.filter(u => u.area === 'aperturas'),
            campo: usuarios.filter(u => u.area === 'campo'),
            administracion: usuarios.filter(u => u.area === 'administracion')
        };

        // Opciones para selects
        const opciones = {
            tipoServicio: [
                { value: 'FAST FOOD', label: 'Fast Food' },
                { value: 'FULL SERVICE', label: 'Full Service' },
                { value: 'PATIOS DE COMIDA', label: 'Patios de Comida' },
                { value: 'IL', label: 'IL' },
                { value: 'DL', label: 'DL' },
                { value: 'MIXTO', label: 'Mixto' }
            ],
            cadena: [
                { value: 'KFC', label: 'KFC' },
                { value: 'AMERICAN_DELI', label: 'American Deli' },
                { value: 'CAJUN', label: 'Cajun' },
                { value: 'ESPANOL', label: 'Español' },
                { value: 'GUS', label: 'GUS' },
                { value: 'JUAN_VALDEZ', label: 'Juan Valdez' },
                { value: 'MENESTRAS', label: 'Menestras del Negro' },
                { value: 'TROPI', label: 'TropiBurger' },
                { value: 'IL_CAPPO', label: 'IL CAPPO' },
                { value: 'CASA_RES', label: 'Casa Res' },
                { value: 'FEDERER', label: 'Federer' },
                { value: 'BASKIN_ROBBINS', label: 'Baskin Robbins' },
                { value: 'CINNABON', label: 'Cinnabon' },
                { value: 'DOLCE_INCONTRO', label: 'Dolce Incontro' },
                { value: 'OTRO', label: 'Otro' }
            ],
            estadoGeneral: [
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'en_proceso', label: 'En Proceso' },
                { value: 'en_espera_proveedor', label: 'Espera Proveedor' },
                { value: 'en_espera_cliente', label: 'Espera Cliente' },
                { value: 'pendiente_aprobacion', label: 'Pendiente Aprobación' },
                { value: 'completado', label: 'Completado' },
                { value: 'cerrado', label: 'Cerrado' },
                { value: 'cancelado', label: 'Cancelado' }
            ]
        };

        res.json({
            success: true,
            data: {
                usuarios: agrupados,
                opciones
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener categorías de precio por cadena
// @route   GET /api/tiendas/categorias-por-cadena/:cadena
exports.getCategoriasPorCadena = async (req, res) => {
    try {
        const { cadena } = req.params;
        const categorias = Tienda.getCategoriasPorCadena(cadena);

        res.json({
            success: true,
            data: categorias.map(cat => ({
                value: cat,
                label: cat
            }))
        });
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener técnico de CX con menor carga de trabajo
// @route   GET /api/tiendas/recomendar-cx
exports.recomendarCX = async (req, res) => {
    try {
        // Obtener todos los usuarios de CX activos
        const tecnicosCX = await User.find({
            area: 'cx',
            activo: true,
            role: { $in: ['cx', 'admin'] }
        }).select('_id nombre apellido email');

        if (tecnicosCX.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay técnicos de CX disponibles'
            });
        }

        // Calcular carga de trabajo para cada técnico
        const cargaTrabajo = await Promise.all(tecnicosCX.map(async (tecnico) => {
            // Tiendas donde es responsable CX
            const tiendasAsignadas = await Tienda.countDocuments({
                'responsables.cx': tecnico._id,
                estadoGeneral: { $nin: ['completado', 'cerrado', 'cancelado'] }
            });

            // Procesos activos donde participa
            const procesosActivos = await Proceso.countDocuments({
                $or: [
                    { 'equipo.lider': tecnico._id },
                    { 'equipo.responsables': tecnico._id }
                ],
                estado: { $nin: ['completado', 'cancelado'] }
            });

            // Puntaje de carga (menor es mejor)
            const puntaje = (tiendasAsignadas * 3) + (procesosActivos * 2);

            return {
                _id: tecnico._id,
                nombre: `${tecnico.nombre} ${tecnico.apellido}`,
                email: tecnico.email,
                tiendasAsignadas,
                procesosActivos,
                puntaje
            };
        }));

        // Ordenar por puntaje (menor carga primero)
        cargaTrabajo.sort((a, b) => a.puntaje - b.puntaje);

        res.json({
            success: true,
            data: {
                recomendado: cargaTrabajo[0],
                todos: cargaTrabajo
            }
        });

    } catch (error) {
        console.error('❌ Error recomendando CX:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener todas las tiendas (VERSIÓN CORREGIDA CON LOGS Y FILTRO POR CADENA)
// @route   GET /api/tiendas
exports.getTiendas = async (req, res) => {
    try {
        console.log('🔍 Recibida petición GET /api/tiendas');
        console.log('👤 Usuario:', req.user?.id);
        console.log('🔍 Filtro de cadena:', req.cadenaFiltro || 'NINGUNO');

        const { estado, ciudad, responsable, page = 1, limit = 20 } = req.query;
        let query = {};

        // ✅ FILTRO POR CADENA (según usuario)
        if (req.cadenaFiltro) {
            query.cadena = req.cadenaFiltro;
        }

        if (estado) query.estadoGeneral = estado;
        if (ciudad) query['direccion.ciudad'] = ciudad;
        if (responsable) {
            query.$or = [
                { 'responsables.operaciones': responsable },
                { 'responsables.it': responsable },
                { 'responsables.dsi': responsable },
                { 'responsables.cx': responsable }
            ];
        }

        console.log('📊 Query:', query);

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Contar total de tiendas en la base de datos
        const totalEnBD = await Tienda.countDocuments({});
        console.log('📦 Total de tiendas en BD:', totalEnBD);

        const [tiendas, total] = await Promise.all([
            Tienda.find(query)
                .populate('creadoPor', 'nombre email')
                .populate('responsables.operaciones', 'nombre email')
                .populate('responsables.it', 'nombre email')
                .populate('responsables.dsi', 'nombre email')
                .populate('responsables.cx', 'nombre email')
                .populate('responsables.contabilidad', 'nombre email')
                .sort('-createdAt')
                .skip(skip)
                .limit(parseInt(limit)),
            Tienda.countDocuments(query)
        ]);

        console.log(`✅ Tiendas encontradas: ${tiendas.length} (total: ${total})`);

        if (tiendas.length > 0) {
            console.log('📋 Primera tienda:', {
                id: tiendas[0]._id,
                codigo: tiendas[0].codigo,
                nombre: tiendas[0].nombre,
                estado: tiendas[0].estadoGeneral
            });
        }

        res.json({
            success: true,
            count: tiendas.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: tiendas
        });
    } catch (error) {
        console.error('❌ Error obteniendo tiendas:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener una tienda
// @route   GET /api/tiendas/:id
exports.getTienda = async (req, res) => {
    try {
        const tienda = await Tienda.findById(req.params.id)
            .populate('creadoPor', 'nombre email')
            .populate('responsables.operaciones', 'nombre email telefono')
            .populate('responsables.it', 'nombre email telefono')
            .populate('responsables.cx', 'nombre email telefono')
            .populate('responsables.dsi', 'nombre email telefono')
            .populate('responsables.contabilidad', 'nombre email telefono')
            .populate('historial.usuario', 'nombre email');

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        // Obtener procesos asociados
        const procesos = await Proceso.find({ tienda: tienda._id })
            .populate('equipo.lider', 'nombre email')
            .sort('orden');

        res.json({
            success: true,
            data: {
                tienda,
                procesos,
                totalProcesos: procesos.length,
                procesosCompletados: procesos.filter(p => p.estado === 'completado').length
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo tienda:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// 👇 NUEVA FUNCIÓN: ACTUALIZAR TIENDA (PUT)
// =============================================

/**
 * @desc    Actualizar tienda (para reasignación de técnico CX)
 * @route   PUT /api/tiendas/:id
 * @access  Private (Admin, Master, CX)
 */
exports.updateTienda = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('🔄 [updateTienda] ID:', id);
        console.log('📝 Datos a actualizar:', JSON.stringify(updateData, null, 2));

        // Verificar que la tienda existe
        const tiendaExistente = await Tienda.findById(id);
        if (!tiendaExistente) {
            return res.status(404).json({
                success: false,
                error: 'Tienda no encontrada'
            });
        }

        // Construir objeto de actualización
        const updates = {};

        // Actualizar responsableCX si viene
        if (updateData.responsableCX !== undefined) {
            updates.responsableCX = updateData.responsableCX;
            updates['responsables.cx'] = updateData.responsableCX;

            // ✅ CORRECCIÓN AGREGADA: Actualizar también el nombre del responsable
            if (updateData.responsableCX) {
                const tecnico = await User.findById(updateData.responsableCX).select('nombre apellido');
                if (tecnico) {
                    updates.responsable = `${tecnico.nombre} ${tecnico.apellido || ''}`.trim();
                }
            } else {
                updates.responsable = '';
            }
        }

        // Actualizar responsables si viene
        if (updateData.responsables !== undefined) {
            if (updateData.responsables.cx !== undefined) {
                updates.responsableCX = updateData.responsables.cx;
                updates['responsables.cx'] = updateData.responsables.cx;
            }
            if (updateData.responsables.operaciones !== undefined) {
                updates['responsables.operaciones'] = updateData.responsables.operaciones;
            }
            if (updateData.responsables.it !== undefined) {
                updates['responsables.it'] = updateData.responsables.it;
            }
            if (updateData.responsables.dsi !== undefined) {
                updates['responsables.dsi'] = updateData.responsables.dsi;
            }
            if (updateData.responsables.contabilidad !== undefined) {
                updates['responsables.contabilidad'] = updateData.responsables.contabilidad;
            }
        }

        // Si no hay nada que actualizar
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos válidos para actualizar'
            });
        }

        // Actualizar la tienda
        const tiendaActualizada = await Tienda.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('responsables.cx', 'nombre apellido email');

        console.log('✅ Tienda actualizada correctamente');

        res.status(200).json({
            success: true,
            message: 'Tienda actualizada exitosamente',
            data: tiendaActualizada
        });

    } catch (error) {
        console.error('❌ Error en updateTienda:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al actualizar la tienda'
        });
    }
};

// @desc    Obtener tiempos de una tienda específica
// @route   GET /api/tiendas/:id/tiempos
exports.getTiemposTienda = async (req, res) => {
    try {
        const tienda = await Tienda.findById(req.params.id);
        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        const procesos = await Proceso.find({ tienda: tienda._id })
            .select('nombre fechas estadoTiempo tiempoEstimado tiempoReal');

        // Calcular métricas de tiempo
        const metricas = {
            totalProcesos: procesos.length,
            procesosAtrasados: procesos.filter(p => p.estadoTiempo === 'atrasado').length,
            procesosPorVencer: procesos.filter(p => p.estadoTiempo === 'por_vencer').length,
            tiempoEstimadoTotal: procesos.reduce((sum, p) => sum + (p.tiempoEstimado || 0), 0),
            tiempoRealTotal: procesos.reduce((sum, p) => sum + (p.tiempoReal || 0), 0),
            eficiencia: 0
        };

        if (metricas.tiempoEstimadoTotal > 0) {
            metricas.eficiencia = Math.round(
                (metricas.tiempoRealTotal / metricas.tiempoEstimadoTotal) * 100
            );
        }

        res.json({
            success: true,
            data: {
                tienda: {
                    id: tienda._id,
                    nombre: tienda.nombre,
                    codigo: tienda.codigo
                },
                metricas,
                procesos: procesos.map(p => ({
                    id: p._id,
                    nombre: p.nombre,
                    estadoTiempo: p.estadoTiempo,
                    diasRestantes: p.diasRestantes,
                    fechaLimite: p.fechas?.finEstimado
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo tiempos:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener resumen de tiempos de todas las tiendas
// @route   GET /api/tiendas/tiempos/resumen
exports.getResumenTiempos = async (req, res) => {
    try {
        const tiendas = await Tienda.find({ estadoGeneral: { $ne: 'cancelado' } });

        const resumen = {
            totalTiendas: tiendas.length,
            totalProcesos: 0,
            procesosAtrasados: 0,
            procesosPorVencer: 0,
            alertasCriticas: 0,
            porTienda: []
        };

        for (const tienda of tiendas) {
            const procesos = await Proceso.find({
                tienda: tienda._id,
                estado: { $nin: ['completado', 'cancelado'] }
            });

            const atrasados = procesos.filter(p => p.estadoTiempo === 'atrasado').length;
            const porVencer = procesos.filter(p => p.estadoTiempo === 'por_vencer').length;

            resumen.totalProcesos += procesos.length;
            resumen.procesosAtrasados += atrasados;
            resumen.procesosPorVencer += porVencer;

            if (atrasados > 0 || porVencer > 0) {
                resumen.alertasCriticas += 1;
            }

            resumen.porTienda.push({
                tienda: {
                    id: tienda._id,
                    nombre: tienda.nombre,
                    codigo: tienda.codigo
                },
                totalProcesos: procesos.length,
                atrasados,
                porVencer,
                estado: tienda.estadoGeneral
            });
        }

        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        console.error('❌ Error obteniendo resumen:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Asignar responsable a tienda
// @route   PUT /api/tiendas/:id/assign
exports.assignResponsable = async (req, res) => {
    try {
        const { area, usuarioId } = req.body;
        const tienda = await Tienda.findById(req.params.id);

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        const usuario = await User.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Validar que el área coincida con el rol/área del usuario
        const areaValida = usuario.area === area ||
            (area === 'it' && ['it', 'infraestructura'].includes(usuario.area)) ||
            (area === 'dsi' && ['dsi', 'desarrollo'].includes(usuario.area)) ||
            usuario.role === 'admin' ||
            usuario.role === 'admin_master';

        if (!areaValida) {
            return res.status(400).json({
                success: false,
                message: `El usuario no tiene el área adecuada para ${area}. Área del usuario: ${usuario.area}`
            });
        }

        // Guardar valor anterior para historial
        const valorAnterior = tienda.responsables?.[area];

        // Asignar responsable
        if (!tienda.responsables) tienda.responsables = {};
        tienda.responsables[area] = usuarioId;

        // Mantener compatibilidad con campos individuales
        const areaMap = {
            operaciones: 'responsableOperaciones',
            it: 'responsableIT',
            dsi: 'responsableDSI',
            cx: 'responsableCX',
            contabilidad: 'responsableContabilidad'
        };
        if (areaMap[area]) {
            tienda[areaMap[area]] = usuarioId;

            // ✅ CORRECCIÓN AGREGADA: Si se asigna CX, actualizar también el nombre del responsable
            if (area === 'cx') {
                tienda.responsable = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
            }
        }

        tienda.ultimaModificacion = req.user.id;

        await tienda.save();

        // Registrar en historial
        await tienda.registrarHistorial(
            req.user.id,
            'asignación',
            `responsables.${area}`,
            valorAnterior,
            usuarioId
        );

        // Enviar notificación
        await notificationService.emitAsignacion(tienda, usuario, area);

        res.json({
            success: true,
            message: `Responsable de ${area} asignado correctamente`,
            data: tienda
        });
    } catch (error) {
        console.error('❌ Error asignando responsable:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Actualizar estado de tienda
// @route   PUT /api/tiendas/:id/estado
exports.updateEstado = async (req, res) => {
    try {
        const { estado, observaciones } = req.body;
        const tienda = await Tienda.findById(req.params.id);

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        const valorAnterior = tienda.estadoGeneral;
        tienda.estadoGeneral = estado;
        tienda.observaciones = observaciones || tienda.observaciones;
        tienda.ultimaModificacion = req.user.id;

        await tienda.save();

        // Registrar en historial
        await tienda.registrarHistorial(
            req.user.id,
            'cambio_estado',
            'estadoGeneral',
            valorAnterior,
            estado
        );

        res.json({
            success: true,
            data: tienda
        });
    } catch (error) {
        console.error('❌ Error actualizando estado:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener estadísticas para dashboard
// @route   GET /api/tiendas/stats/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        let query = {};
        // ✅ FILTRO POR CADENA para dashboard stats
        if (req.cadenaFiltro) {
            query.cadena = req.cadenaFiltro;
        }

        const totalTiendas = await Tienda.countDocuments(query);

        const tiendasPorEstado = await Tienda.aggregate([
            { $match: query },
            { $group: { _id: "$estadoGeneral", count: { $sum: 1 } } }
        ]);

        const tiendasPorCadena = await Tienda.aggregate([
            { $match: query },
            { $group: { _id: "$cadena", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const tiendasPorCiudad = await Tienda.aggregate([
            { $match: query },
            { $group: { _id: "$direccion.ciudad", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const procesosCriticos = await Proceso.countDocuments({
            estadoTiempo: 'atrasado',
            estado: { $nin: ['completado', 'cancelado'] }
        });

        const proximasAperturas = await Tienda.find({
            ...query,
            fechaAperturaPlanificada: { $gte: new Date() },
            estadoGeneral: { $in: ['en_proceso', 'pendiente'] }
        })
            .sort('fechaAperturaPlanificada')
            .limit(5)
            .select('nombre codigo fechaAperturaPlanificada progreso cadena');

        res.json({
            success: true,
            data: {
                totalTiendas,
                tiendasPorEstado,
                tiendasPorCadena,
                tiendasPorCiudad,
                procesosCriticos,
                proximasAperturas
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============= MÉTODOS PARA CONFIGURACIÓN DE ESTACIONES =============

/**
 * @desc    Actualizar configuración de estaciones de una tienda
 * @route   PATCH /api/tiendas/:id/configuracion-estaciones
 */
exports.actualizarConfiguracionEstaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { configuracionEstaciones } = req.body;

        const tienda = await Tienda.findById(id);
        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        // Guardar valor anterior para historial
        const valorAnterior = tienda.configuracionEstaciones;

        // Actualizar configuración
        tienda.configuracionEstaciones = configuracionEstaciones;
        tienda.ultimaModificacion = req.user.id;

        await tienda.save();

        // Registrar en historial
        await tienda.registrarHistorial(
            req.user.id,
            'actualización_configuración',
            'configuracionEstaciones',
            valorAnterior,
            configuracionEstaciones
        );

        res.json({
            success: true,
            message: 'Configuración de estaciones actualizada',
            data: tienda.configuracionEstaciones
        });
    } catch (error) {
        console.error('❌ Error actualizando configuración de estaciones:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Guardar configuración completa de estaciones
 * @route   PUT /api/tiendas/:id/configuracion-estaciones
 */
exports.guardarConfiguracionEstaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { configuracionEstaciones } = req.body;

        const tienda = await Tienda.findByIdAndUpdate(
            id,
            {
                configuracionEstaciones,
                ultimaModificacion: req.user.id
            },
            { new: true, runValidators: true }
        );

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Configuración guardada correctamente',
            data: tienda.configuracionEstaciones
        });
    } catch (error) {
        console.error('❌ Error guardando configuración de estaciones:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Obtener configuración completa de la tienda
 * @route   GET /api/tiendas/:id/configuracion-completa
 */
exports.getConfiguracionCompleta = async (req, res) => {
    try {
        const { id } = req.params;

        const tienda = await Tienda.findById(id)
            .populate('creadoPor', 'nombre email')
            .populate('responsables.operaciones', 'nombre email')
            .populate('responsables.it', 'nombre email')
            .populate('responsables.dsi', 'nombre email')
            .populate('responsables.cx', 'nombre email')
            .populate('responsables.contabilidad', 'nombre email')
            .populate('historial.usuario', 'nombre email');

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                tienda,
                configuracionEstaciones: tienda.configuracionEstaciones || {
                    cajas: { activo: false, items: [] },
                    kioscos: { activo: false, items: [] },
                    delivery: { activo: false, agregadores: false, canalPropio: false },
                    pickUp: false,
                    drive: { activo: false, items: [] },
                    heladeria: { activo: false, items: [] },
                    meseros: { activo: false, items: [] },
                    impresoraLinea: false,
                    impresoraLineaDomi: false,
                    impresoraBar: false,
                    impresoraCocina: false,
                    impresoraParrilla: false,
                    impresoraPersonalizada: false,
                    impresoraPersonalizadaNombre: '',
                    kdsItems: {
                        kds1: false,
                        kds2: false,
                        kds3: false,
                        kdsPersonalizado: false,
                        kdsPersonalizadoNombre: ''
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo configuración completa:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Obtener configuración de estaciones de una tienda
 * @route   GET /api/tiendas/:id/estaciones
 */
exports.getConfiguracionEstaciones = async (req, res) => {
    try {
        const { id } = req.params;

        const tienda = await Tienda.findById(id).select('configuracionEstaciones codigo nombre');

        if (!tienda) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                tiendaId: tienda._id,
                codigo: tienda.codigo,
                nombre: tienda.nombre,
                configuracionEstaciones: tienda.configuracionEstaciones || {
                    cajas: { activo: false, items: [] },
                    kioscos: { activo: false, items: [] },
                    delivery: { activo: false, agregadores: false, canalPropio: false },
                    pickUp: false,
                    drive: { activo: false, items: [] },
                    heladeria: { activo: false, items: [] },
                    meseros: { activo: false, items: [] },
                    impresoraLinea: false,
                    impresoraLineaDomi: false,
                    impresoraBar: false,
                    impresoraCocina: false,
                    impresoraParrilla: false,
                    impresoraPersonalizada: false,
                    impresoraPersonalizadaNombre: '',
                    kdsItems: {
                        kds1: false,
                        kds2: false,
                        kds3: false,
                        kdsPersonalizado: false,
                        kdsPersonalizadoNombre: ''
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo configuración de estaciones:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============= FUNCIÓN: APROBAR FACTURACIÓN (CORREGIDA - PASA A APERTURA) =============

/**
 * @desc    Aprobar facturación y mover tienda a APERTURA
 * @route   POST /api/tiendas/:id/aprobar-facturacion
 * @access  Private (Admin/Master/Operaciones/Aperturas)
 */
exports.aprobarFacturacion = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🚀 [APROBAR] Iniciando aprobación para tienda:', id);
        console.log('👤 Usuario:', req.user?.email);

        // Buscar la tienda
        const tienda = await Tienda.findById(id);
        if (!tienda) {
            return res.status(404).json({
                success: false,
                error: 'Tienda no encontrada'
            });
        }

        console.log('📊 Estado actual TIENDA:', tienda.estadoGeneral);

        // Cambiar estado de la TIENDA a 'apertura'
        const estadoAnteriorTienda = tienda.estadoGeneral;
        tienda.estadoGeneral = 'apertura';
        await tienda.save();
        console.log('✅ TIENDA actualizada:', estadoAnteriorTienda, '→', tienda.estadoGeneral);

        // Buscar y actualizar el PROCESO
        const proceso = await Proceso.findOne({
            tienda: id,
            tipo: 'apertura'
        });

        let procesoActualizado = false;

        if (proceso) {
            console.log('📊 Proceso encontrado:', proceso._id);
            console.log('📊 Estado actual PROCESO:', proceso.estado);

            // Finalizar etapa anterior si existe el método
            if (typeof proceso.finalizarEtapa === 'function') {
                if (proceso.estado === 'pendiente_aprobacion') {
                    proceso.finalizarEtapa('pendiente_aprobacion');
                } else if (proceso.estado === 'en_revision') {
                    proceso.finalizarEtapa('en_revision');
                } else if (proceso.estado === 'en_proceso') {
                    proceso.finalizarEtapa('en_proceso');
                }
            }

            // Cambiar estado del proceso a 'apertura'
            const estadoAnteriorProceso = proceso.estado;
            proceso.estado = 'apertura';

            // Iniciar nueva etapa si existe el método
            if (typeof proceso.iniciarEtapa === 'function') {
                proceso.iniciarEtapa('apertura');
            }

            // Registrar en historial
            proceso.historial = proceso.historial || [];
            proceso.historial.push({
                fecha: new Date(),
                usuario: req.user.id,
                accion: 'aprobacion_facturacion',
                estadoAnterior: estadoAnteriorProceso,
                estadoNuevo: 'apertura',
                detalles: 'Facturación aprobada, proceso movido a APERTURA'
            });

            await proceso.save();
            procesoActualizado = true;
            console.log('✅ PROCESO actualizado a:', proceso.estado);
        } else {
            console.log('⚠️ No se encontró proceso para actualizar');
        }

        // Registrar en historial de tienda
        if (typeof tienda.registrarHistorial === 'function') {
            await tienda.registrarHistorial(
                req.user.id,
                'aprobacion_facturacion',
                'estadoGeneral',
                estadoAnteriorTienda,
                'apertura'
            );
        }

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Facturación aprobada, tienda movida a APERTURA',
            data: {
                estadoGeneral: tienda.estadoGeneral,
                procesoActualizado
            }
        });

    } catch (error) {
        console.error('❌ Error en aprobación:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// =============================================
// 🆕 FUNCIÓN: NOTIFICAR AVANCE DE MODAL
// =============================================

/**
 * @desc    Notificar avance de modal completado
 * @route   POST /api/tiendas/:id/notificar-avance
 * @access  Private
 */
exports.notificarAvanceModal = async (req, res) => {
    try {
        const { id } = req.params;
        const { modalNombre, modalPorcentaje } = req.body;

        console.log('📢 [NOTIFICAR AVANCE] Tienda:', id);
        console.log('📌 Modal:', modalNombre, '-', modalPorcentaje, '%');

        const tienda = await Tienda.findById(id);
        if (!tienda) {
            return res.status(404).json({
                success: false,
                error: 'Tienda no encontrada'
            });
        }

        await emailService.enviarCorreoAvanceModal(tienda, modalNombre, modalPorcentaje, req.user);

        res.json({
            success: true,
            message: `Notificación de avance para ${modalNombre} enviada`
        });

    } catch (error) {
        console.error('❌ Error en notificarAvanceModal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// =============================================
// 🆕 FUNCIÓN: FINALIZAR APERTURA (POST MORTEM)
// =============================================

/**
 * @desc    Finalizar apertura y enviar informe Post Mortem
 * @route   POST /api/tiendas/:id/finalizar-apertura
 * @access  Private (Admin/Master/Operaciones/Aperturas/CX)
 */
exports.finalizarApertura = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones, metricasAdicionales } = req.body;

        // Obtener imágenes subidas (si vienen en multipart/form-data)
        const imagenes = req.files || [];

        console.log('🚀 [FINALIZAR APERTURA] Tienda:', id);
        console.log('👤 Usuario:', req.user?.email);
        console.log('📸 Imágenes recibidas:', imagenes.length);

        // Buscar la tienda
        const tienda = await Tienda.findById(id);
        if (!tienda) {
            return res.status(404).json({
                success: false,
                error: 'Tienda no encontrada'
            });
        }

        // Verificar que la tienda esté en estado 'apertura'
        if (tienda.estadoGeneral !== 'apertura') {
            return res.status(400).json({
                success: false,
                error: `La tienda está en estado "${tienda.estadoGeneral}". Debe estar en "apertura" para finalizar.`
            });
        }

        // Obtener procesos completados (modales)
        const procesos = await Proceso.find({
            tienda: id,
            estado: 'completado'
        }).sort('orden');

        // Calcular métricas
        const fechaInicio = tienda.createdAt || tienda.fechaAperturaPlanificada;
        const fechaFin = new Date();
        const duracionTotalDias = fechaInicio ? Math.ceil((fechaFin - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)) : 'N/A';

        // Preparar métricas para el correo
        const metricas = {
            duracionTotalDias,
            totalModales: procesos.length,
            eficiencia: procesos.length > 0 ? Math.round((procesos.length / 5) * 100) : 100,
            totalIncidencias: 0,
            observaciones: observaciones || 'Apertura finalizada exitosamente.',
            modal1Fecha: procesos[0]?.fechas?.finReal || 'Completado',
            modal2Fecha: procesos[1]?.fechas?.finReal || 'Completado',
            modal3Fecha: procesos[2]?.fechas?.finReal || 'Completado',
            modal4Fecha: procesos[3]?.fechas?.finReal || 'Completado',
            ...metricasAdicionales
        };

        // Preparar imágenes para adjuntar
        const imagenesAdjuntas = imagenes.map((img, idx) => ({
            buffer: img.buffer,
            filename: img.originalname || `evidencia_${idx + 1}.jpg`,
            mimetype: img.mimetype
        }));

        // Cambiar estado de la tienda a 'completado'
        const estadoAnterior = tienda.estadoGeneral;
        tienda.estadoGeneral = 'completado';
        tienda.fechaAperturaReal = fechaFin;
        tienda.observacionesPostMortem = observaciones;
        await tienda.save();

        // Registrar en historial
        if (typeof tienda.registrarHistorial === 'function') {
            await tienda.registrarHistorial(
                req.user.id,
                'finalizacion_apertura',
                'estadoGeneral',
                estadoAnterior,
                'completado'
            );
        }

        // Enviar correo Post Mortem
        try {
            await emailService.enviarCorreoPostMortem(tienda, req.user, imagenesAdjuntas, metricas);
            console.log(`📧 Correo Post Mortem enviado para ${tienda.nombre}`);
        } catch (emailError) {
            console.error('❌ Error enviando correo Post Mortem:', emailError.message);
            // No fallar la finalización si el correo falla
        }

        res.json({
            success: true,
            message: 'Apertura finalizada exitosamente. Informe Post Mortem enviado.',
            data: {
                tienda: {
                    id: tienda._id,
                    nombre: tienda.nombre,
                    codigo: tienda.codigo,
                    estado: tienda.estadoGeneral,
                    fechaAperturaReal: fechaFin
                },
                metricas,
                imagenesEnviadas: imagenes.length
            }
        });

    } catch (error) {
        console.error('❌ Error finalizando apertura:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};