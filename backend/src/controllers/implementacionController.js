// backend/controllers/implementacionController.js
const Implementacion = require('../models/Implementacion');
const User = require('../models/User');

// @desc    Obtener todas las implementaciones
// @route   GET /api/implementaciones
// @access  Private
exports.getImplementaciones = async (req, res) => {
    try {
        const { estado, cadena, tecnico, search } = req.query;

        let query = {};

        if (estado) query.estadoGeneral = estado;
        if (cadena) query.cadena = cadena;
        if (tecnico) query.tecnicoAsignadoId = tecnico;

        if (search) {
            query.$or = [
                { codigo: { $regex: search, $options: 'i' } },
                { nombre: { $regex: search, $options: 'i' } },
                { cadena: { $regex: search, $options: 'i' } }
            ];
        }

        const implementaciones = await Implementacion.find(query)
            .populate('tecnicoAsignadoId', 'nombre apellido email')
            .sort('-createdAt');

        console.log(`✅ Enviando ${implementaciones.length} implementaciones`);

        res.json({
            success: true,
            count: implementaciones.length,
            data: implementaciones
        });
    } catch (error) {
        console.error('Error en getImplementaciones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener implementación por ID
// @route   GET /api/implementaciones/:id
// @access  Private
exports.getImplementacion = async (req, res) => {
    try {
        const implementacion = await Implementacion.findById(req.params.id)
            .populate('tecnicoAsignadoId', 'nombre apellido email');

        if (!implementacion) {
            return res.status(404).json({
                success: false,
                error: 'Implementación no encontrada'
            });
        }

        res.json({
            success: true,
            data: implementacion
        });
    } catch (error) {
        console.error('Error en getImplementacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Crear nueva implementación
// @route   POST /api/implementaciones
// @access  Private
exports.createImplementacion = async (req, res) => {
    try {
        const {
            codigo,
            nombre,
            cadena,
            direccion,
            fechaImplementacionPlanificada,
            tecnicoAsignadoId,
            observaciones,
            configuracion
        } = req.body;

        console.log('📝 Creando implementación:', { codigo, nombre, cadena });

        // Verificar si ya existe una implementación con el mismo código
        const existingImplementacion = await Implementacion.findOne({ codigo });
        if (existingImplementacion) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una implementación con este código'
            });
        }

        // Obtener datos del técnico si se asignó
        let tecnicoData = null;
        if (tecnicoAsignadoId) {
            const tecnico = await User.findById(tecnicoAsignadoId).select('nombre apellido email');
            if (tecnico) {
                tecnicoData = {
                    nombre: `${tecnico.nombre} ${tecnico.apellido || ''}`.trim(),
                    email: tecnico.email
                };
            }
        }

        const nuevaImplementacion = new Implementacion({
            codigo,
            nombre,
            cadena,
            direccion: direccion || {},
            fechaImplementacionPlanificada: fechaImplementacionPlanificada || null,
            tecnicoAsignadoId: tecnicoAsignadoId || null,
            tecnicoAsignado: tecnicoData,
            observaciones: observaciones || '',
            configuracion: configuracion || {
                cajas: { activo: false, cantidad: 1 },
                kioscos: { activo: false, cantidad: 0 },
                delivery: { activo: false, tipo: 'propio' },
                localizadores: false,
                turnero: false,
                kds: false,
                heladerias: false,
                drive: { activo: false },
                medianet: false,
                dragonTail: false,
                pickUp: false,
                impresoras: {
                    linea: false,
                    lineaDomi: false,
                    bar: false,
                    cocina: false,
                    parrilla: false,
                    personalizada: false,
                    personalizadaNombre: ''
                }
            },
            estadoGeneral: 'pendiente',
            progreso: 0
        });

        await nuevaImplementacion.save();

        console.log('✅ Implementación creada exitosamente:', codigo);

        res.status(201).json({
            success: true,
            data: nuevaImplementacion,
            message: 'Implementación creada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en createImplementacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Actualizar implementación
// @route   PUT /api/implementaciones/:id
// @access  Private
exports.updateImplementacion = async (req, res) => {
    try {
        const {
            nombre,
            direccion,
            fechaImplementacionPlanificada,
            tecnicoAsignadoId,
            observaciones,
            configuracion,
            estadoGeneral,
            progreso
        } = req.body;

        // Obtener datos del técnico si cambió
        let tecnicoData = null;
        if (tecnicoAsignadoId) {
            const tecnico = await User.findById(tecnicoAsignadoId).select('nombre apellido email');
            if (tecnico) {
                tecnicoData = {
                    nombre: `${tecnico.nombre} ${tecnico.apellido || ''}`.trim(),
                    email: tecnico.email
                };
            }
        }

        const implementacion = await Implementacion.findByIdAndUpdate(
            req.params.id,
            {
                nombre,
                direccion,
                fechaImplementacionPlanificada,
                tecnicoAsignadoId,
                tecnicoAsignado: tecnicoData,
                observaciones,
                configuracion,
                estadoGeneral,
                progreso
            },
            { new: true, runValidators: true }
        );

        if (!implementacion) {
            return res.status(404).json({
                success: false,
                error: 'Implementación no encontrada'
            });
        }

        console.log('✅ Implementación actualizada:', implementacion.codigo);

        res.json({
            success: true,
            data: implementacion,
            message: 'Implementación actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error en updateImplementacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Eliminar implementación
// @route   DELETE /api/implementaciones/:id
// @access  Private/Admin
exports.deleteImplementacion = async (req, res) => {
    try {
        const implementacion = await Implementacion.findByIdAndDelete(req.params.id);

        if (!implementacion) {
            return res.status(404).json({
                success: false,
                error: 'Implementación no encontrada'
            });
        }

        console.log('✅ Implementación eliminada:', implementacion.codigo);

        res.json({
            success: true,
            message: 'Implementación eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteImplementacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Cambiar estado de implementación
// @route   PATCH /api/implementaciones/:id/estado
// @access  Private
exports.cambiarEstadoImplementacion = async (req, res) => {
    try {
        const { estado } = req.body;
        const estadosValidos = ['pendiente', 'en_proceso', 'en_revision', 'instalacion', 'apertura', 'completado', 'cancelado'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado no válido'
            });
        }

        const implementacion = await Implementacion.findByIdAndUpdate(
            req.params.id,
            {
                estadoGeneral: estado,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!implementacion) {
            return res.status(404).json({
                success: false,
                error: 'Implementación no encontrada'
            });
        }

        console.log(`✅ Estado de implementación actualizado: ${implementacion.codigo} → ${estado}`);

        res.json({
            success: true,
            data: implementacion,
            message: `Estado cambiado a ${estado}`
        });
    } catch (error) {
        console.error('Error en cambiarEstadoImplementacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};