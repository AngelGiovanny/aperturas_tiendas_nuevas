// backend/scripts/migrarConfiguracionEstaciones.js
const mongoose = require('mongoose');
const Tienda = require('../models/Tienda');

// Configuración de conexión
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aperturas';

async function migrarConfiguracionEstaciones() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todas las tiendas
        const tiendas = await Tienda.find({});
        console.log(`📦 Procesando ${tiendas.length} tiendas...`);

        let actualizadas = 0;

        for (const tienda of tiendas) {
            let necesitaActualizacion = false;
            let nuevasConfig = {};

            // Si la tienda ya tiene configuracionEstaciones, verificamos si está completa
            if (!tienda.configuracionEstaciones) {
                necesitaActualizacion = true;
                nuevasConfig = {
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
                };
            } else {
                // Verificar si faltan campos
                const configActual = tienda.configuracionEstaciones;

                if (!configActual.cajas) {
                    necesitaActualizacion = true;
                    nuevasConfig.cajas = { activo: false, items: [] };
                }
                if (!configActual.kioscos) {
                    necesitaActualizacion = true;
                    nuevasConfig.kioscos = { activo: false, items: [] };
                }
                if (configActual.delivery === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.delivery = { activo: false, agregadores: false, canalPropio: false };
                }
                if (configActual.pickUp === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.pickUp = false;
                }
                if (!configActual.drive) {
                    necesitaActualizacion = true;
                    nuevasConfig.drive = { activo: false, items: [] };
                }
                if (!configActual.heladeria) {
                    necesitaActualizacion = true;
                    nuevasConfig.heladeria = { activo: false, items: [] };
                }
                if (!configActual.meseros) {
                    necesitaActualizacion = true;
                    nuevasConfig.meseros = { activo: false, items: [] };
                }
                if (configActual.impresoraLinea === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraLinea = false;
                }
                if (configActual.impresoraLineaDomi === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraLineaDomi = false;
                }
                if (configActual.impresoraBar === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraBar = false;
                }
                if (configActual.impresoraCocina === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraCocina = false;
                }
                if (configActual.impresoraParrilla === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraParrilla = false;
                }
                if (configActual.impresoraPersonalizada === undefined) {
                    necesitaActualizacion = true;
                    nuevasConfig.impresoraPersonalizada = false;
                }
                if (!configActual.kdsItems) {
                    necesitaActualizacion = true;
                    nuevasConfig.kdsItems = {
                        kds1: false,
                        kds2: false,
                        kds3: false,
                        kdsPersonalizado: false,
                        kdsPersonalizadoNombre: ''
                    };
                }
            }

            if (necesitaActualizacion) {
                // Fusionar configuraciones existentes con las nuevas
                tienda.configuracionEstaciones = {
                    ...tienda.configuracionEstaciones,
                    ...nuevasConfig
                };

                await tienda.save();
                actualizadas++;
                console.log(`✅ Tienda ${tienda.codigo} - ${tienda.nombre} actualizada`);
            }
        }

        console.log(`\n✅ Migración completada: ${actualizadas} tiendas actualizadas`);

    } catch (error) {
        console.error('❌ Error en migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar migración
migrarConfiguracionEstaciones();