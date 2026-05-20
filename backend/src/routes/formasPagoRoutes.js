// backend/src/routes/formasPagoRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
const FormaPago = require('../models/FormaPago');

// Obtener formas de pago por cadena (público - no requiere autenticación)
router.get('/cadenas/:cadenaId/formas-pago', async (req, res) => {
    try {
        const { cadenaId } = req.params;

        console.log(`🔍 [Backend] Buscando formas de pago para cadena ID: ${cadenaId}`);

        if (!cadenaId) {
            return res.status(400).json({
                success: false,
                error: 'El ID de la cadena es requerido'
            });
        }

        const formasPago = await FormaPago.find({
            cadenaId: cadenaId.toString(),
            activo: true
        }).sort({ orden: 1 });

        console.log(`📦 [Backend] Formas de pago encontradas para cadena ${cadenaId}: ${formasPago.length}`);

        return res.status(200).json({
            success: true,
            data: formasPago.map(fp => ({
                id: fp.id,
                nombre: fp.nombre,
                codigo: fp.codigo || '',
                descripcion: fp.descripcion || '',
                orden: fp.orden
            })),
            count: formasPago.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo formas de pago:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener las formas de pago'
        });
    }
});

// Obtener todas las formas de pago (solo administradores)
router.get('/formas-pago', auth, authorize('admin_master', 'admin'), async (req, res) => {
    try {
        const formasPago = await FormaPago.find().sort({ cadenaId: 1, orden: 1 });

        return res.status(200).json({
            success: true,
            data: formasPago,
            count: formasPago.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo formas de pago:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener las formas de pago'
        });
    }
});

// Crear una nueva forma de pago (solo administradores)
router.post('/formas-pago', auth, authorize('admin_master', 'admin'), async (req, res) => {
    try {
        const { id, nombre, cadenaId, orden, codigo, descripcion } = req.body;

        if (!id || !nombre || !cadenaId) {
            return res.status(400).json({
                success: false,
                error: 'Los campos id, nombre y cadenaId son requeridos'
            });
        }

        const existe = await FormaPago.findOne({ id });
        if (existe) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una forma de pago con ese ID'
            });
        }

        const nuevaFormaPago = new FormaPago({
            id,
            nombre,
            cadenaId: cadenaId.toString(),
            orden: orden || 0,
            codigo: codigo || '',
            descripcion: descripcion || '',
            activo: true
        });

        await nuevaFormaPago.save();

        return res.status(201).json({
            success: true,
            data: nuevaFormaPago,
            message: 'Forma de pago creada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error creando forma de pago:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al crear la forma de pago'
        });
    }
});

// Actualizar forma de pago
router.put('/formas-pago/:id', auth, authorize('admin_master', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, activo, orden, codigo, descripcion } = req.body;

        const formaPago = await FormaPago.findOne({ id });

        if (!formaPago) {
            return res.status(404).json({
                success: false,
                error: 'Forma de pago no encontrada'
            });
        }

        if (nombre) formaPago.nombre = nombre;
        if (activo !== undefined) formaPago.activo = activo;
        if (orden !== undefined) formaPago.orden = orden;
        if (codigo !== undefined) formaPago.codigo = codigo;
        if (descripcion !== undefined) formaPago.descripcion = descripcion;

        await formaPago.save();

        return res.status(200).json({
            success: true,
            data: formaPago,
            message: 'Forma de pago actualizada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error actualizando forma de pago:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al actualizar la forma de pago'
        });
    }
});

// Eliminar forma de pago (soft delete)
router.delete('/formas-pago/:id', auth, authorize('admin_master', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const formaPago = await FormaPago.findOneAndUpdate(
            { id },
            { activo: false },
            { new: true }
        );

        if (!formaPago) {
            return res.status(404).json({
                success: false,
                error: 'Forma de pago no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Forma de pago eliminada correctamente'
        });
    } catch (error) {
        console.error('❌ Error eliminando forma de pago:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al eliminar la forma de pago'
        });
    }
});

module.exports = router;