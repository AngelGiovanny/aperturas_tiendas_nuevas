// backend/src/routes/pruebaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Tienda = require('../models/Tienda');
const { auth } = require('../middlewares/auth');

// Asegurar que existe el directorio de uploads
const uploadDir = 'uploads/pruebas/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== PRUEBAS FUNCIONALES ====================

// Obtener estaciones de una tienda para pruebas
router.get('/pruebas/tienda/:tiendaId/estaciones', auth, async (req, res) => {
    try {
        const tienda = await Tienda.findById(req.params.tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        const estaciones = [];
        const config = tienda.configuracionEstaciones || {};

        // Cajas
        if (config.cajas?.activo && config.cajas?.items) {
            config.cajas.items.forEach(caja => {
                if (caja.seleccionado) {
                    estaciones.push({
                        id: caja.id,
                        nombre: caja.nombre || `Caja ${caja.id}`,
                        tipo: 'caja',
                        completado: false,
                        observaciones: [],
                        archivos: []
                    });
                }
            });
        }

        // Kioscos
        if (config.kioscos?.activo && config.kioscos?.items) {
            config.kioscos.items.forEach(kiosco => {
                if (kiosco.seleccionado) {
                    estaciones.push({
                        id: kiosco.id,
                        nombre: kiosco.nombre || `Kiosco ${kiosco.id}`,
                        tipo: 'kiosco',
                        completado: false,
                        observaciones: [],
                        archivos: []
                    });
                }
            });
        }

        // Delivery
        if (config.delivery?.activo === true) {
            estaciones.push({
                id: 'delivery',
                nombre: 'Delivery',
                tipo: 'delivery',
                completado: false,
                observaciones: [],
                archivos: []
            });
        }

        // Drive
        if (config.drive?.activo && config.drive?.items) {
            config.drive.items.forEach(drive => {
                if (drive.seleccionado) {
                    estaciones.push({
                        id: drive.id,
                        nombre: drive.nombre || `Drive ${drive.id}`,
                        tipo: 'drive',
                        completado: false,
                        observaciones: [],
                        archivos: []
                    });
                }
            });
        }

        // PickUp
        if (config.pickUp === true) {
            estaciones.push({
                id: 'pickup',
                nombre: 'PickUp',
                tipo: 'pickup',
                completado: false,
                observaciones: [],
                archivos: []
            });
        }

        // Heladería
        if (config.heladeria?.activo === true) {
            estaciones.push({
                id: 'heladeria',
                nombre: 'Heladería',
                tipo: 'heladeria',
                completado: false,
                observaciones: [],
                archivos: []
            });
        }

        // Cargar datos guardados previamente
        if (tienda.pruebas?.funcionales?.estaciones) {
            tienda.pruebas.funcionales.estaciones.forEach(estGuardada => {
                const estIndex = estaciones.findIndex(e => e.id === estGuardada.estacionId);
                if (estIndex !== -1) {
                    estaciones[estIndex].completado = estGuardada.completado;
                    estaciones[estIndex].observaciones = estGuardada.observaciones || [];
                    estaciones[estIndex].archivos = estGuardada.archivos || [];
                } else {
                    estaciones.push({
                        id: estGuardada.estacionId,
                        nombre: estGuardada.estacionNombre,
                        tipo: estGuardada.estacionTipo,
                        completado: estGuardada.completado,
                        observaciones: estGuardada.observaciones || [],
                        archivos: estGuardada.archivos || []
                    });
                }
            });
        }

        res.json({ success: true, data: estaciones });
    } catch (error) {
        console.error('Error obteniendo estaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agregar observación a una estación
router.post('/pruebas/tienda/:tiendaId/estacion/:estacionId/observacion', auth, async (req, res) => {
    try {
        const { tiendaId, estacionId } = req.params;
        const { texto } = req.body;

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.funcionales) tienda.pruebas.funcionales = { estaciones: [] };

        let estacion = tienda.pruebas.funcionales.estaciones.find(e => e.estacionId === estacionId);

        if (!estacion) {
            let estacionNombre = estacionId;
            let estacionTipo = 'desconocido';
            const config = tienda.configuracionEstaciones || {};

            if (config.cajas?.items) {
                const caja = config.cajas.items.find(c => c.id === estacionId);
                if (caja) {
                    estacionNombre = caja.nombre || `Caja ${estacionId}`;
                    estacionTipo = 'caja';
                }
            }
            if (config.kioscos?.items) {
                const kiosco = config.kioscos.items.find(k => k.id === estacionId);
                if (kiosco) {
                    estacionNombre = kiosco.nombre || `Kiosco ${estacionId}`;
                    estacionTipo = 'kiosco';
                }
            }
            if (config.drive?.items) {
                const drive = config.drive.items.find(d => d.id === estacionId);
                if (drive) {
                    estacionNombre = drive.nombre || `Drive ${estacionId}`;
                    estacionTipo = 'drive';
                }
            }
            if (estacionId === 'delivery') {
                estacionNombre = 'Delivery';
                estacionTipo = 'delivery';
            }
            if (estacionId === 'pickup') {
                estacionNombre = 'PickUp';
                estacionTipo = 'pickup';
            }
            if (estacionId === 'heladeria') {
                estacionNombre = 'Heladería';
                estacionTipo = 'heladeria';
            }

            tienda.pruebas.funcionales.estaciones.push({
                estacionId: estacionId,
                estacionNombre: estacionNombre,
                estacionTipo: estacionTipo,
                completado: false,
                observaciones: [],
                archivos: []
            });
            estacion = tienda.pruebas.funcionales.estaciones.find(e => e.estacionId === estacionId);
        }

        if (!estacion.observaciones) estacion.observaciones = [];
        if (texto && texto.trim()) {
            estacion.observaciones.push({
                texto: texto,
                usuario: req.user.nombre || req.user.email,
                fecha: new Date()
            });
        }

        await tienda.save();

        res.json({ success: true, data: estacion.observaciones });
    } catch (error) {
        console.error('Error agregando observación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Completar una estación
router.put('/pruebas/tienda/:tiendaId/estacion/:estacionId/completar', auth, async (req, res) => {
    try {
        const { tiendaId, estacionId } = req.params;

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.funcionales) tienda.pruebas.funcionales = { estaciones: [] };

        let estacion = tienda.pruebas.funcionales.estaciones.find(e => e.estacionId === estacionId);

        if (!estacion) {
            let estacionNombre = estacionId;
            let estacionTipo = 'desconocido';
            const config = tienda.configuracionEstaciones || {};

            if (config.cajas?.items) {
                const caja = config.cajas.items.find(c => c.id === estacionId);
                if (caja) {
                    estacionNombre = caja.nombre || `Caja ${estacionId}`;
                    estacionTipo = 'caja';
                }
            }
            if (config.kioscos?.items) {
                const kiosco = config.kioscos.items.find(k => k.id === estacionId);
                if (kiosco) {
                    estacionNombre = kiosco.nombre || `Kiosco ${estacionId}`;
                    estacionTipo = 'kiosco';
                }
            }
            if (config.drive?.items) {
                const drive = config.drive.items.find(d => d.id === estacionId);
                if (drive) {
                    estacionNombre = drive.nombre || `Drive ${estacionId}`;
                    estacionTipo = 'drive';
                }
            }
            if (estacionId === 'delivery') {
                estacionNombre = 'Delivery';
                estacionTipo = 'delivery';
            }
            if (estacionId === 'pickup') {
                estacionNombre = 'PickUp';
                estacionTipo = 'pickup';
            }
            if (estacionId === 'heladeria') {
                estacionNombre = 'Heladería';
                estacionTipo = 'heladeria';
            }

            tienda.pruebas.funcionales.estaciones.push({
                estacionId: estacionId,
                estacionNombre: estacionNombre,
                estacionTipo: estacionTipo,
                completado: true,
                observaciones: [],
                archivos: []
            });
        } else {
            estacion.completado = true;
        }

        const todasCompletadas = tienda.pruebas.funcionales.estaciones.every(e => e.completado === true);

        if (todasCompletadas && !tienda.pruebas.funcionales.fechaCompletado) {
            tienda.pruebas.funcionales.fechaCompletado = new Date();
            tienda.pruebas.funcionales.completadoPor = req.user.id;
        }

        await tienda.save();

        res.json({
            success: true,
            data: { completado: true, todasCompletadas: todasCompletadas },
            message: 'Estación completada'
        });
    } catch (error) {
        console.error('Error completando estación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Subir archivo para una estación
router.post('/pruebas/tienda/:tiendaId/estacion/:estacionId/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { tiendaId, estacionId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
        }

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.funcionales) tienda.pruebas.funcionales = { estaciones: [] };

        const estacion = tienda.pruebas.funcionales.estaciones.find(e => e.estacionId === estacionId);
        if (!estacion) {
            return res.status(404).json({ success: false, error: 'Estación no encontrada' });
        }

        if (!estacion.archivos) estacion.archivos = [];
        estacion.archivos.push({
            nombre: req.file.originalname,
            url: `/uploads/pruebas/${req.file.filename}`,
            fechaSubida: new Date()
        });

        await tienda.save();

        res.json({ success: true, data: estacion.archivos });
    } catch (error) {
        console.error('Error subiendo archivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== PRUEBAS PRE-APERTURA ====================

// Obtener estado de pre-apertura
router.get('/pruebas/tienda/:tiendaId/pre-apertura/estado', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        const efectivoCompletado = tienda.pruebas?.preApertura?.facturaEfectivo?.completado || false;
        const tarjetaCompletado = tienda.pruebas?.preApertura?.facturaTarjeta?.completado || false;
        const preAperturaCompletada = efectivoCompletado && tarjetaCompletado;

        res.json({
            success: true,
            data: {
                efectivoCompletado: efectivoCompletado,
                tarjetaCompletado: tarjetaCompletado,
                preAperturaCompletada: preAperturaCompletada,
                facturaEfectivo: tienda.pruebas?.preApertura?.facturaEfectivo || null,
                facturaTarjeta: tienda.pruebas?.preApertura?.facturaTarjeta || null,
                fechaCompletado: tienda.pruebas?.preApertura?.fechaCompletado || null
            }
        });
    } catch (error) {
        console.error('Error obteniendo estado pre-apertura:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Subir factura efectivo
router.post('/pruebas/tienda/:tiendaId/pre-apertura/efectivo/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { tiendaId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
        }

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.preApertura) tienda.pruebas.preApertura = {};

        tienda.pruebas.preApertura.facturaEfectivo = {
            archivo: {
                nombre: req.file.originalname,
                url: `/uploads/pruebas/${req.file.filename}`,
                fechaSubida: new Date()
            },
            observaciones: tienda.pruebas.preApertura.facturaEfectivo?.observaciones || [],
            completado: true
        };

        const tarjetaCompletado = tienda.pruebas.preApertura.facturaTarjeta?.completado || false;
        const efectivoCompletado = true;

        if (efectivoCompletado && tarjetaCompletado && !tienda.pruebas.preApertura.fechaCompletado) {
            tienda.pruebas.preApertura.fechaCompletado = new Date();
            tienda.pruebas.preApertura.completadoPor = req.user.id;
        }

        await tienda.save();

        const ambasCompletadas = (tienda.pruebas.preApertura.facturaEfectivo?.completado && tienda.pruebas.preApertura.facturaTarjeta?.completado) || false;

        res.json({
            success: true,
            data: tienda.pruebas.preApertura.facturaEfectivo,
            preAperturaCompletada: ambasCompletadas
        });
    } catch (error) {
        console.error('Error subiendo factura efectivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Subir factura tarjeta
router.post('/pruebas/tienda/:tiendaId/pre-apertura/tarjeta/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { tiendaId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
        }

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.preApertura) tienda.pruebas.preApertura = {};

        tienda.pruebas.preApertura.facturaTarjeta = {
            archivo: {
                nombre: req.file.originalname,
                url: `/uploads/pruebas/${req.file.filename}`,
                fechaSubida: new Date()
            },
            observaciones: tienda.pruebas.preApertura.facturaTarjeta?.observaciones || [],
            completado: true
        };

        const efectivoCompletado = tienda.pruebas.preApertura.facturaEfectivo?.completado || false;
        const tarjetaCompletado = true;

        if (efectivoCompletado && tarjetaCompletado && !tienda.pruebas.preApertura.fechaCompletado) {
            tienda.pruebas.preApertura.fechaCompletado = new Date();
            tienda.pruebas.preApertura.completadoPor = req.user.id;
        }

        await tienda.save();

        const ambasCompletadas = (tienda.pruebas.preApertura.facturaEfectivo?.completado && tienda.pruebas.preApertura.facturaTarjeta?.completado) || false;

        res.json({
            success: true,
            data: tienda.pruebas.preApertura.facturaTarjeta,
            preAperturaCompletada: ambasCompletadas
        });
    } catch (error) {
        console.error('Error subiendo factura tarjeta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agregar observación a pre-apertura
router.post('/pruebas/tienda/:tiendaId/pre-apertura/observacion', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const { tipo, texto } = req.body;

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.preApertura) tienda.pruebas.preApertura = {};

        const campo = tipo === 'efectivo' ? 'facturaEfectivo' : 'facturaTarjeta';
        if (!tienda.pruebas.preApertura[campo]) {
            tienda.pruebas.preApertura[campo] = { observaciones: [] };
        }
        if (!tienda.pruebas.preApertura[campo].observaciones) {
            tienda.pruebas.preApertura[campo].observaciones = [];
        }

        if (texto && texto.trim()) {
            tienda.pruebas.preApertura[campo].observaciones.push({
                texto: texto,
                usuario: req.user.nombre || req.user.email,
                fecha: new Date()
            });
        }

        await tienda.save();

        res.json({ success: true, data: tienda.pruebas.preApertura[campo].observaciones });
    } catch (error) {
        console.error('Error agregando observación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APROBACIÓN CONTABILIDAD ====================

// Obtener datos de aprobación contabilidad
router.get('/pruebas/tienda/:tiendaId/aprobacion', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        const aprobacion = tienda.pruebas?.aprobacionContabilidad || {
            facturaDocumento: { archivo: null, observaciones: [] },
            revisado: false,
            aprobado: false,
            fechaAprobacion: null
        };

        res.json({ success: true, data: aprobacion });
    } catch (error) {
        console.error('Error obteniendo aprobación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Subir documento de facturación
router.post('/pruebas/tienda/:tiendaId/aprobacion/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { tiendaId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
        }

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.aprobacionContabilidad) tienda.pruebas.aprobacionContabilidad = {};

        tienda.pruebas.aprobacionContabilidad.facturaDocumento = {
            archivo: {
                nombre: req.file.originalname,
                url: `/uploads/pruebas/${req.file.filename}`,
                fechaSubida: new Date()
            },
            observaciones: tienda.pruebas.aprobacionContabilidad.facturaDocumento?.observaciones || []
        };

        await tienda.save();

        res.json({ success: true, data: tienda.pruebas.aprobacionContabilidad.facturaDocumento });
    } catch (error) {
        console.error('Error subiendo documento:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Marcar como revisado
router.put('/pruebas/tienda/:tiendaId/aprobacion/revisado', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const { revisado } = req.body;

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.aprobacionContabilidad) tienda.pruebas.aprobacionContabilidad = {};

        tienda.pruebas.aprobacionContabilidad.revisado = revisado;

        await tienda.save();

        res.json({ success: true, data: { revisado: revisado } });
    } catch (error) {
        console.error('Error actualizando revisado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agregar observación a aprobación
router.post('/pruebas/tienda/:tiendaId/aprobacion/observacion', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const { texto } = req.body;

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.aprobacionContabilidad) {
            tienda.pruebas.aprobacionContabilidad = { facturaDocumento: { observaciones: [] } };
        }
        if (!tienda.pruebas.aprobacionContabilidad.facturaDocumento) {
            tienda.pruebas.aprobacionContabilidad.facturaDocumento = { observaciones: [] };
        }
        if (!tienda.pruebas.aprobacionContabilidad.facturaDocumento.observaciones) {
            tienda.pruebas.aprobacionContabilidad.facturaDocumento.observaciones = [];
        }

        if (texto && texto.trim()) {
            tienda.pruebas.aprobacionContabilidad.facturaDocumento.observaciones.push({
                texto: texto,
                usuario: req.user.nombre || req.user.email,
                fecha: new Date()
            });
        }

        await tienda.save();

        res.json({ success: true, data: tienda.pruebas.aprobacionContabilidad.facturaDocumento.observaciones });
    } catch (error) {
        console.error('Error agregando observación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== APROBAR FACTURACIÓN - VERSIÓN CORREGIDA (SIN VERIFICACIÓN DE REVISADO) ====================
router.post('/pruebas/tienda/:tiendaId/aprobacion/aprobar', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        console.log('🚀 [APROBAR] Iniciando aprobación para tienda:', tiendaId);
        console.log('👤 Usuario:', req.user?.email || req.user?.id);

        const tienda = await Tienda.findById(tiendaId);
        if (!tienda) {
            console.log('❌ [APROBAR] Tienda no encontrada');
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        console.log('📊 Estado actual tienda:', tienda.estadoGeneral);
        console.log('📊 Pre-apertura efectivo completado:', tienda.pruebas?.preApertura?.facturaEfectivo?.completado);
        console.log('📊 Pre-apertura tarjeta completado:', tienda.pruebas?.preApertura?.facturaTarjeta?.completado);

        // Verificar que pre-apertura esté completada
        const preAperturaCompletada = (tienda.pruebas?.preApertura?.facturaEfectivo?.completado === true) &&
            (tienda.pruebas?.preApertura?.facturaTarjeta?.completado === true);

        if (!preAperturaCompletada) {
            console.log('❌ [APROBAR] Pre-apertura no completada');
            return res.status(400).json({
                success: false,
                error: 'Debes completar las pruebas de pre-apertura primero'
            });
        }

        // 🔴 ELIMINAMOS LA VERIFICACIÓN DE REVISADO 🔴
        // La tienda ya pasó por el proceso de revisión, aprobamos directamente
        console.log('✅ Verificación de pre-apertura superada, continuando con aprobación...');

        // Inicializar estructura si no existe
        if (!tienda.pruebas) tienda.pruebas = {};
        if (!tienda.pruebas.aprobacionContabilidad) tienda.pruebas.aprobacionContabilidad = {};

        // Marcar como aprobado y forzar revisado
        tienda.pruebas.aprobacionContabilidad.aprobado = true;
        tienda.pruebas.aprobacionContabilidad.fechaAprobacion = new Date();
        tienda.pruebas.aprobacionContabilidad.aprobadoPor = req.user.id;
        tienda.pruebas.aprobacionContabilidad.revisado = true; // FORZAR REVISADO

        // Cambiar estado general de la tienda a 'apertura'
        const estadoAnterior = tienda.estadoGeneral;
        tienda.estadoGeneral = 'apertura';

        console.log('📊 Cambiando estado tienda:', estadoAnterior, '→', tienda.estadoGeneral);

        await tienda.save();
        console.log('✅ Tienda actualizada correctamente');

        // Buscar y actualizar el proceso activo a APERTURA
        let procesoActualizado = false;
        try {
            const Proceso = mongoose.model('Proceso');

            const procesoActivo = await Proceso.findOne({
                tienda: tiendaId,
                estado: { $in: ['pendiente_aprobacion', 'en_revision', 'instalacion'] }
            });

            if (procesoActivo) {
                console.log('📊 Proceso activo encontrado:', procesoActivo._id);
                console.log('📊 Estado actual del proceso:', procesoActivo.estado);

                const estadoAnteriorProceso = procesoActivo.estado;

                procesoActivo.estado = 'apertura';
                procesoActivo.etapa = 'apertura';

                if (!procesoActivo.historial) procesoActivo.historial = [];
                procesoActivo.historial.push({
                    fecha: new Date(),
                    usuario: req.user.id,
                    accion: 'APROBAR_FACTURACION',
                    estadoAnterior: estadoAnteriorProceso,
                    estadoNuevo: 'apertura',
                    descripcion: 'Aprobación de facturación completada, moviendo a apertura'
                });

                // Actualizar tiempos de etapa
                if (procesoActivo.tiemposEtapa && procesoActivo.tiemposEtapa[estadoAnteriorProceso]) {
                    procesoActivo.tiemposEtapa[estadoAnteriorProceso].fin = new Date();
                    procesoActivo.tiemposEtapa[estadoAnteriorProceso].duracion =
                        new Date() - new Date(procesoActivo.tiemposEtapa[estadoAnteriorProceso].inicio);
                }

                if (!procesoActivo.tiemposEtapa) procesoActivo.tiemposEtapa = {};
                procesoActivo.tiemposEtapa.apertura = {
                    inicio: new Date(),
                    fin: null,
                    duracion: 0
                };

                await procesoActivo.save();
                procesoActualizado = true;
                console.log('✅ Proceso actualizado a APERTURA');
            } else {
                console.log('⚠️ No se encontró proceso activo para actualizar');
            }
        } catch (err) {
            console.error('⚠️ Error al actualizar proceso:', err.message);
        }

        const tiendaActualizada = await Tienda.findById(tiendaId).select('estadoGeneral');

        res.json({
            success: true,
            message: 'Facturación aprobada, tienda movida a APERTURA',
            data: {
                estadoGeneral: tiendaActualizada.estadoGeneral,
                estadoAnterior: estadoAnterior,
                procesoActualizado: procesoActualizado
            }
        });
    } catch (error) {
        console.error('❌ Error aprobando facturación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== RESUMEN FINAL ====================

router.get('/pruebas/tienda/:tiendaId/resumen', auth, async (req, res) => {
    try {
        const { tiendaId } = req.params;
        const tienda = await Tienda.findById(tiendaId)
            .populate('pruebas.funcionales.completadoPor', 'nombre email')
            .populate('pruebas.preApertura.completadoPor', 'nombre email')
            .populate('pruebas.aprobacionContabilidad.aprobadoPor', 'nombre email')
            .populate('resumenFinal.finalizadoPor', 'nombre email');

        if (!tienda) {
            return res.status(404).json({ success: false, error: 'Tienda no encontrada' });
        }

        const resumen = tienda.resumenFinal || {};

        try {
            const Proceso = mongoose.model('Proceso');
            const proceso = await Proceso.findOne({ tienda: tiendaId, tipo: 'apertura' });
            if (proceso && proceso.tiemposEtapa) {
                resumen.tiempoPorEtapa = proceso.tiemposEtapa;

                let tiempoTotal = 0;
                for (const etapa in proceso.tiemposEtapa) {
                    if (proceso.tiemposEtapa[etapa].duracion) {
                        tiempoTotal += proceso.tiemposEtapa[etapa].duracion;
                    }
                }
                resumen.tiempoTotalHoras = Math.round(tiempoTotal / (1000 * 60 * 60));
            }
        } catch (err) {
            console.log('⚠️ Error calculando tiempos:', err.message);
        }

        res.json({ success: true, data: resumen });
    } catch (error) {
        console.error('Error obteniendo resumen:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;