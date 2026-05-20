const cron = require('node-cron');
const Proceso = require('../models/Proceso');
const Notificacion = require('../models/Notificacion');
const User = require('../models/User');

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
    console.log('🔍 Ejecutando monitoreo de tiempos...');

    try {
        const hoy = new Date();
        const procesos = await Proceso.find({
            'fechas.finEstimado': { $exists: true },
            estado: { $nin: ['completado', 'cancelado'] }
        }).populate('tienda').populate('equipo.lider');

        for (const proceso of procesos) {
            const estadoAnterior = proceso.estadoTiempo;
            proceso.estadoTiempo = proceso.calcularEstadoTiempo();

            // Si cambió el estado o está por vencer/atrasado y no se ha enviado alerta
            if (estadoAnterior !== proceso.estadoTiempo ||
                (proceso.estadoTiempo !== 'normal' && !proceso.alertaEnviada)) {

                await proceso.save();

                // Crear notificación
                const titulo = proceso.estadoTiempo === 'atrasado'
                    ? '⚠️ PROCESO ATRASADO'
                    : '⏰ PROCESO POR VENCER';

                const mensaje = `${titulo}: ${proceso.nombre} - Tienda: ${proceso.tienda?.nombre || 'N/A'}`;

                // Notificar al líder del equipo
                if (proceso.equipo?.lider) {
                    await Notificacion.create({
                        tipo: proceso.estadoTiempo === 'atrasado' ? 'alerta' : 'recordatorio',
                        titulo,
                        mensaje,
                        para: [proceso.equipo.lider._id],
                        idProceso: proceso._id,
                        fechaCreacion: new Date(),
                        leida: false
                    });

                    console.log(`📨 Notificación enviada a ${proceso.equipo.lider.email}`);
                }

                proceso.alertaEnviada = true;
                await proceso.save();
            }
        }

        console.log(`✅ Monitoreo completado. ${procesos.length} procesos revisados.`);
    } catch (error) {
        console.error('❌ Error en monitoreo de tiempos:', error);
    }
}, {
    scheduled: true,
    timezone: "America/Guayaquil"
});

console.log('⏰ Job de monitoreo de tiempos programado (cada hora)');