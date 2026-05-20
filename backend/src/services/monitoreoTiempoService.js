const Proceso = require('../models/Proceso');
const Tienda = require('../models/Tienda');
const User = require('../models/User');
const notificationService = require('./notificationService');

class MonitoreoTiempoService {

    /**
     * Analizar todos los procesos y actualizar su estado de tiempo
     */
    async analizarTodosLosProcesos() {
        try {
            console.log('🔍 Iniciando análisis de tiempos de procesos...');

            const procesos = await Proceso.find({
                estado: { $nin: ['completado', 'cerrado'] },
                fechaLimite: { $exists: true, $ne: null }
            }).populate('tienda');

            let stats = {
                atrasados: 0,
                porVencer: 0,
                normales: 0,
                alertasEnviadas: 0
            };

            for (const proceso of procesos) {
                const estadoAnterior = proceso.estadoTiempo;
                const nuevoEstado = proceso.calcularEstadoTiempo();

                if (estadoAnterior !== nuevoEstado) {
                    proceso.estadoTiempo = nuevoEstado;

                    // Registrar cambio en historial
                    proceso.historial.push({
                        usuario: null, // sistema
                        accion: 'cambio_estado_tiempo',
                        estadoAnterior,
                        estadoNuevo: nuevoEstado,
                        detalles: {
                            fechaLimite: proceso.fechaLimite,
                            diasRestantes: this.calcularDiasRestantes(proceso.fechaLimite)
                        }
                    });

                    await proceso.save();

                    // Enviar alerta si está atrasado o por vencer
                    if (nuevoEstado === 'atrasado' || nuevoEstado === 'por_vencer') {
                        await this.enviarAlertaProceso(proceso, nuevoEstado);
                        stats.alertasEnviadas++;
                    }

                    // Actualizar estadísticas
                    if (nuevoEstado === 'atrasado') stats.atrasados++;
                    else if (nuevoEstado === 'por_vencer') stats.porVencer++;
                    else stats.normales++;
                }
            }

            console.log(`
            📊 RESULTADO DEL ANÁLISIS:
            - Procesos atrasados: ${stats.atrasados}
            - Procesos por vencer: ${stats.porVencer}
            - Procesos normales: ${stats.normales}
            - Alertas enviadas: ${stats.alertasEnviadas}
            `);

            return stats;

        } catch (error) {
            console.error('❌ Error analizando tiempos:', error);
            throw error;
        }
    }

    /**
     * Analizar procesos de una tienda específica
     */
    async analizarProcesosTienda(tiendaId) {
        try {
            const procesos = await Proceso.find({
                tienda: tiendaId,
                estado: { $nin: ['completado', 'cerrado'] }
            });

            const resultados = {
                tienda: tiendaId,
                totalProcesos: procesos.length,
                atrasados: [],
                porVencer: [],
                normales: []
            };

            for (const proceso of procesos) {
                const estado = proceso.calcularEstadoTiempo();

                if (estado === 'atrasado') {
                    resultados.atrasados.push({
                        id: proceso._id,
                        nombre: proceso.nombre,
                        fechaLimite: proceso.fechaLimite,
                        diasAtraso: Math.abs(this.calcularDiasRestantes(proceso.fechaLimite))
                    });
                } else if (estado === 'por_vencer') {
                    resultados.porVencer.push({
                        id: proceso._id,
                        nombre: proceso.nombre,
                        fechaLimite: proceso.fechaLimite,
                        diasRestantes: this.calcularDiasRestantes(proceso.fechaLimite)
                    });
                }
            }

            return resultados;

        } catch (error) {
            console.error('❌ Error analizando procesos de tienda:', error);
            throw error;
        }
    }

    /**
     * Enviar alerta por proceso atrasado o por vencer
     */
    async enviarAlertaProceso(proceso, estado) {
        try {
            const tienda = await Tienda.findById(proceso.tienda);

            // Determinar responsables a notificar
            const responsables = [];

            if (proceso.responsable) {
                const resp = await User.findById(proceso.responsable);
                if (resp) responsables.push(resp);
            }

            // También notificar al responsable del área en la tienda
            const campoResponsable = this.areaToResponsableField(proceso.area);
            if (campoResponsable && tienda.responsables?.[campoResponsable]) {
                const respTienda = await User.findById(tienda.responsables[campoResponsable]);
                if (respTienda && !responsables.find(r => r._id.equals(respTienda._id))) {
                    responsables.push(respTienda);
                }
            }

            const dias = this.calcularDiasRestantes(proceso.fechaLimite);
            const esAtrasado = estado === 'atrasado';
            const titulo = esAtrasado ? '⚠️ PROCESO ATRASADO' : '⚠️ PROCESO POR VENCER';

            const mensaje = esAtrasado
                ? `El proceso "${proceso.nombre}" de la tienda ${tienda.codigo} está ATRASADO por ${Math.abs(dias)} días.`
                : `El proceso "${proceso.nombre}" de la tienda ${tienda.codigo} vence en ${dias} días.`;

            for (const usuario of responsables) {
                // Notificación en BD
                await notificationService.crearNotificacion({
                    usuario: usuario._id,
                    tipo: 'alerta',
                    titulo,
                    mensaje,
                    referencia: {
                        tipo: 'proceso',
                        id: proceso._id
                    },
                    metadata: {
                        tiendaCodigo: tienda.codigo,
                        procesoNombre: proceso.nombre,
                        fechaLimite: proceso.fechaLimite,
                        diasRestantes: dias,
                        estado
                    }
                });

                // Email
                await this.enviarEmailAlerta(usuario, tienda, proceso, estado, dias);

                // SMS solo para atrasados
                if (esAtrasado && usuario.telefono) {
                    await notificationService.enviarSMS(usuario.telefono,
                        `KFC: ${titulo} - ${proceso.nombre} en ${tienda.codigo}`
                    );
                }
            }

            // Marcar que ya se envió alerta
            proceso.alertaEnviada = true;
            await proceso.save();

        } catch (error) {
            console.error('❌ Error enviando alerta de proceso:', error);
        }
    }

    /**
     * Enviar email de alerta
     */
    async enviarEmailAlerta(usuario, tienda, proceso, estado, dias) {
        const esAtrasado = estado === 'atrasado';
        const color = esAtrasado ? '#E4002B' : '#FFA500';
        const titulo = esAtrasado ? 'PROCESO ATRASADO' : 'PROCESO POR VENCER';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background-color: ${color}; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">KFC Ecuador</h1>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: ${color};">${titulo}</h2>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${tienda.codigo} - ${tienda.nombre}</h3>
                        <p><strong>Proceso:</strong> ${proceso.nombre}</p>
                        <p><strong>Área:</strong> ${proceso.area}</p>
                        <p><strong>Fecha límite:</strong> ${new Date(proceso.fechaLimite).toLocaleDateString('es-EC')}</p>
                        <p><strong>Días ${esAtrasado ? 'de atraso' : 'restantes'}:</strong> ${Math.abs(dias)}</p>
                        <p><strong>Progreso checklist:</strong> ${proceso.progresoChecklist || 0}%</p>
                    </div>
                    
                    <p>Por favor, toma acción inmediata:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/procesos/${proceso._id}" 
                           style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver Proceso
                        </a>
                    </div>
                </div>
            </div>
        `;

        await notificationService.enviarEmail(usuario, `KFC - ${titulo}`, html);
    }

    /**
     * Calcular días restantes (negativo si atrasado)
     */
    calcularDiasRestantes(fechaLimite) {
        if (!fechaLimite) return null;
        const hoy = new Date();
        const limite = new Date(fechaLimite);
        return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    }

    /**
     * Convertir área a campo de responsable
     */
    areaToResponsableField(area) {
        const map = {
            'operaciones': 'operaciones',
            'infraestructura': 'it',
            'dsi': 'dsi',
            'contabilidad': 'contabilidad',
            'cx': 'cx',
            'trade': 'trade',
            'marketing': 'marketing',
            'mesa_servicio': 'mesaServicio'
        };
        return map[area] || null;
    }
}

module.exports = new MonitoreoTiempoService();