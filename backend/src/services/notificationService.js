const Notificacion = require('../models/Notificacion');
const User = require('../models/User');
const Proceso = require('../models/Proceso');
const Tienda = require('../models/Tienda');
const emailService = require('./emailService');
const smsService = require('./smsService');

class NotificationService {

    /**
     * Notificar nueva tienda creada
     */
    async emitTiendaCreada(tienda, creador) {
        try {
            console.log(`📢 Enviando notificaciones de nueva tienda: ${tienda.codigo}`);

            const destinatarios = await this.getDestinatariosPorArea([
                'operaciones', 'cx', 'it', 'dsi', 'contabilidad', 'trade', 'aperturas', 'campo'
            ]);

            let contador = 0;
            for (const usuario of destinatarios) {
                // No notificar al creador
                if (creador && usuario._id.toString() === creador.toString()) continue;

                // Notificación en base de datos
                await this.crearNotificacion({
                    usuario: usuario._id,
                    tipo: 'nueva_tienda',
                    titulo: '🏪 Nueva tienda en proceso de apertura',
                    mensaje: `Se ha creado la tienda ${tienda.codigo} - ${tienda.nombre}`,
                    prioridad: 'media',
                    referencia: {
                        tipo: 'tienda',
                        id: tienda._id
                    },
                    metadata: {
                        tiendaCodigo: tienda.codigo,
                        tiendaNombre: tienda.nombre,
                        fechaApertura: tienda.fechaAperturaPlanificada,
                        creadoPor: creador
                    },
                    canales: {
                        email: true,
                        sms: false,
                        push: true
                    }
                });

                // Email
                try {
                    await emailService.sendEmail({
                        email: usuario.email,
                        subject: `Nueva Tienda Creada: ${tienda.codigo}`,
                        html: this._getEmailTemplateNuevaTienda(tienda, usuario)
                    });
                } catch (emailError) {
                    console.error(`❌ Error enviando email a ${usuario.email}:`, emailError.message);
                }

                // SMS solo para usuarios críticos
                if (usuario.telefono && ['operaciones', 'aperturas'].includes(usuario.area)) {
                    try {
                        await smsService.sendSMS(
                            usuario.telefono,
                            null,
                            'nuevaTienda',
                            { codigo: tienda.codigo, nombre: tienda.nombre }
                        );
                    } catch (smsError) {
                        console.error(`❌ Error enviando SMS a ${usuario.telefono}:`, smsError.message);
                    }
                }
                contador++;
            }

            console.log(`✅ Notificaciones de nueva tienda enviadas a ${contador} usuarios`);

        } catch (error) {
            console.error('❌ Error en notificación de tienda creada:', error);
        }
    }

    /**
     * Notificar asignación de responsable
     */
    async emitAsignacion(tienda, usuario, area, motivo = 'Asignación de responsabilidad') {
        try {
            console.log(`📢 Enviando notificación de asignación a ${usuario.email} para tienda ${tienda.codigo}`);

            // Notificación en base de datos
            await this.crearNotificacion({
                usuario: usuario._id,
                tipo: 'asignacion',
                titulo: `✅ Has sido asignado como responsable de ${area}`,
                mensaje: `Has sido asignado a la tienda ${tienda.codigo} - ${tienda.nombre} como responsable de ${area}. ${motivo}`,
                prioridad: 'alta',
                referencia: {
                    tipo: 'tienda',
                    id: tienda._id
                },
                metadata: {
                    area,
                    motivo,
                    tiendaCodigo: tienda.codigo,
                    tiendaNombre: tienda.nombre
                },
                canales: {
                    email: true,
                    sms: true,
                    push: true
                }
            });

            // Email
            try {
                await emailService.sendEmail({
                    email: usuario.email,
                    subject: `Asignación como responsable de ${area} - Tienda ${tienda.codigo}`,
                    html: this._getEmailTemplateAsignacion(tienda, usuario, area, motivo)
                });
            } catch (emailError) {
                console.error(`❌ Error enviando email a ${usuario.email}:`, emailError.message);
            }

            // SMS
            if (usuario.telefono) {
                try {
                    await smsService.sendTemplateSMS(
                        usuario.telefono,
                        'asignacion',
                        { codigo: tienda.codigo, area }
                    );
                } catch (smsError) {
                    console.error(`❌ Error enviando SMS a ${usuario.telefono}:`, smsError.message);
                }
            }

            // Notificar también al admin de la asignación
            const admins = await User.find({ role: { $in: ['admin', 'admin_master'] } });
            for (const admin of admins) {
                if (admin._id.toString() !== usuario._id.toString()) {
                    await this.crearNotificacion({
                        usuario: admin._id,
                        tipo: 'sistema',
                        titulo: '📋 Nueva asignación realizada',
                        mensaje: `Se asignó ${area} de tienda ${tienda.codigo} a ${usuario.nombre} ${usuario.apellido}`,
                        prioridad: 'baja',
                        referencia: {
                            tipo: 'tienda',
                            id: tienda._id
                        }
                    });
                }
            }

        } catch (error) {
            console.error('❌ Error en notificación de asignación:', error);
        }
    }

    /**
     * Notificar cambio de estado en proceso
     */
    async emitCambioEstado(proceso, tienda, estadoAnterior, usuarioCambio = null) {
        try {
            console.log(`📢 Notificando cambio de estado en proceso: ${proceso.nombre}`);

            // Notificar al responsable del proceso
            if (proceso.equipo?.lider) {
                const usuario = await User.findById(proceso.equipo.lider);

                if (usuario) {
                    await this.crearNotificacion({
                        usuario: usuario._id,
                        tipo: 'cambio_estado',
                        titulo: `🔄 Cambio en proceso: ${proceso.nombre}`,
                        mensaje: `El proceso "${proceso.nombre}" de la tienda ${tienda.codigo} cambió de "${estadoAnterior}" a "${proceso.estado}"`,
                        prioridad: proceso.prioridad || 'media',
                        referencia: {
                            tipo: 'proceso',
                            id: proceso._id
                        },
                        metadata: {
                            tiendaCodigo: tienda.codigo,
                            tiendaNombre: tienda.nombre,
                            estadoAnterior,
                            estadoNuevo: proceso.estado,
                            procesoNombre: proceso.nombre
                        },
                        canales: {
                            email: true,
                            sms: false,
                            push: true
                        }
                    });

                    // Email
                    try {
                        await emailService.sendEmail({
                            email: usuario.email,
                            subject: `Cambio de estado: ${proceso.nombre}`,
                            html: this._getEmailTemplateCambioEstado(tienda, proceso, estadoAnterior, usuario)
                        });
                    } catch (emailError) {
                        console.error(`❌ Error enviando email a ${usuario.email}:`, emailError.message);
                    }
                }
            }

            // Si el proceso requiere validación de otra área
            if (proceso.estado === 'pendiente_aprobacion') {
                const responsables = await this.getResponsablesPorArea(proceso.area);
                for (const resp of responsables) {
                    // No notificar al mismo que hizo el cambio
                    if (usuarioCambio && resp._id.toString() === usuarioCambio.toString()) continue;

                    await this.crearNotificacion({
                        usuario: resp._id,
                        tipo: 'validacion',
                        titulo: '⚠️ Validación requerida',
                        mensaje: `Se requiere tu validación para el proceso "${proceso.nombre}" de la tienda ${tienda.codigo}`,
                        prioridad: 'alta',
                        referencia: {
                            tipo: 'proceso',
                            id: proceso._id
                        },
                        metadata: {
                            tiendaCodigo: tienda.codigo,
                            procesoNombre: proceso.nombre,
                            area: proceso.area
                        },
                        canales: {
                            email: true,
                            sms: true,
                            push: true
                        }
                    });

                    // SMS para validaciones críticas
                    if (resp.telefono && proceso.prioridad === 'critica') {
                        try {
                            await smsService.sendTemplateSMS(
                                resp.telefono,
                                'validacionRequerida',
                                { codigo: tienda.codigo, nombre: proceso.nombre }
                            );
                        } catch (smsError) {
                            console.error(`❌ Error enviando SMS:`, smsError.message);
                        }
                    }
                }
            }

            // Si el proceso se completó
            if (proceso.estado === 'completado') {
                await this._notificarProcesoCompletado(proceso, tienda);
            }

        } catch (error) {
            console.error('❌ Error en notificación de cambio de estado:', error);
        }
    }

    /**
     * Notificar retraso en proceso (para el job de monitoreo)
     */
    async emitRetrasoProceso(proceso, tienda, diasRetraso) {
        try {
            console.log(`⚠️ Enviando alerta de retraso: ${proceso.nombre} (${diasRetraso} días)`);

            const destinatarios = [];

            // Responsable del proceso
            if (proceso.equipo?.lider) {
                const lider = await User.findById(proceso.equipo.lider);
                if (lider) destinatarios.push(lider);
            }

            // Responsables del área
            const responsablesArea = await this.getResponsablesPorArea(proceso.area);
            destinatarios.push(...responsablesArea);

            // Admin
            const admins = await User.find({ role: { $in: ['admin', 'admin_master'] } });
            destinatarios.push(...admins);

            // Eliminar duplicados (por si acaso)
            const uniqueDestinatarios = [...new Map(destinatarios.map(u => [u._id.toString(), u])).values()];

            for (const usuario of uniqueDestinatarios) {
                if (!usuario) continue;

                await this.crearNotificacion({
                    usuario: usuario._id,
                    tipo: 'alerta',
                    titulo: '⚠️ RETRASO CRÍTICO DETECTADO',
                    mensaje: `El proceso "${proceso.nombre}" en tienda ${tienda.codigo} está ${diasRetraso} días atrasado`,
                    prioridad: 'critica',
                    referencia: {
                        tipo: 'proceso',
                        id: proceso._id
                    },
                    metadata: {
                        tiendaCodigo: tienda.codigo,
                        tiendaNombre: tienda.nombre,
                        procesoNombre: proceso.nombre,
                        diasRetraso,
                        fechaLimite: proceso.fechas?.finEstimado
                    },
                    canales: {
                        email: true,
                        sms: true,
                        push: true
                    }
                });

                // Email de alerta
                try {
                    await emailService.sendEmail({
                        email: usuario.email,
                        subject: `🔴 ALERTA: Proceso atrasado - ${proceso.nombre}`,
                        html: this._getEmailTemplateRetraso(tienda, proceso, diasRetraso, usuario)
                    });
                } catch (emailError) {
                    console.error(`❌ Error enviando email de alerta a ${usuario.email}:`, emailError.message);
                }

                // SMS de alerta
                if (usuario.telefono) {
                    try {
                        await smsService.sendTemplateSMS(
                            usuario.telefono,
                            'atrasoCritico',
                            { codigo: tienda.codigo, nombre: proceso.nombre, dias: diasRetraso }
                        );
                    } catch (smsError) {
                        console.error(`❌ Error enviando SMS de alerta a ${usuario.telefono}:`, smsError.message);
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error en notificación de retraso:', error);
        }
    }

    /**
     * Notificar proceso próximo a vencer (para el job de monitoreo)
     */
    async emitProximoVencer(proceso, tienda, horasRestantes) {
        try {
            if (!proceso.equipo?.lider) return;

            const usuario = await User.findById(proceso.equipo.lider);
            if (!usuario) return;

            await this.crearNotificacion({
                usuario: usuario._id,
                tipo: 'recordatorio',
                titulo: '⏰ Proceso próximo a vencer',
                mensaje: `El proceso "${proceso.nombre}" en tienda ${tienda.codigo} vence en ${horasRestantes} horas`,
                prioridad: 'alta',
                referencia: {
                    tipo: 'proceso',
                    id: proceso._id
                },
                metadata: {
                    tiendaCodigo: tienda.codigo,
                    procesoNombre: proceso.nombre,
                    horasRestantes,
                    fechaLimite: proceso.fechas?.finEstimado
                },
                canales: {
                    email: true,
                    sms: true,
                    push: true
                }
            });

            // SMS de recordatorio
            if (usuario.telefono) {
                try {
                    await smsService.sendTemplateSMS(
                        usuario.telefono,
                        'recordatorio',
                        { codigo: tienda.codigo, nombre: proceso.nombre, horas: horasRestantes }
                    );
                } catch (smsError) {
                    console.error(`❌ Error enviando SMS recordatorio:`, smsError.message);
                }
            }

        } catch (error) {
            console.error('❌ Error en notificación de próximo vencer:', error);
        }
    }

    /**
     * Crear notificación en base de datos (uso genérico)
     */
    async crearNotificacion(data) {
        try {
            // Validar que el usuario existe
            const usuario = await User.findById(data.usuario);
            if (!usuario) {
                throw new Error(`Usuario ${data.usuario} no encontrado`);
            }

            const notificacion = await Notificacion.create({
                usuario: data.usuario,
                tipo: data.tipo,
                titulo: data.titulo,
                mensaje: data.mensaje,
                prioridad: data.prioridad || 'media',
                leida: false,
                referencia: data.referencia || null,
                metadata: data.metadata || {},
                enviadoPor: data.enviadoPor || null,
                canales: data.canales || { email: false, sms: false, push: true },
                fechaExpiracion: data.fechaExpiracion || null
            });

            return notificacion;
        } catch (error) {
            console.error('❌ Error creando notificación:', error);
            throw error;
        }
    }

    /**
     * Enviar email a un usuario
     */
    async enviarEmail(usuarioId, titulo, mensaje) {
        try {
            const usuario = await User.findById(usuarioId);
            if (!usuario || !usuario.email) {
                console.log(`⚠️ Usuario ${usuarioId} sin email`);
                return false;
            }

            await emailService.sendEmail({
                email: usuario.email,
                subject: titulo,
                html: `<h2>${titulo}</h2><p>${mensaje}</p>`
            });
            return true;
        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    /**
     * Enviar SMS a un usuario
     */
    async enviarSMS(usuarioId, mensaje) {
        try {
            const usuario = await User.findById(usuarioId);
            if (!usuario || !usuario.telefono) {
                console.log(`⚠️ Usuario ${usuarioId} sin teléfono`);
                return false;
            }

            await smsService.sendSMS(usuario.telefono, mensaje);
            return true;
        } catch (error) {
            console.error('❌ Error enviando SMS:', error);
            return false;
        }
    }

    /**
     * Marcar notificaciones como leídas
     */
    async marcarComoLeidas(usuarioId, notificacionIds) {
        try {
            const result = await Notificacion.updateMany(
                {
                    _id: { $in: notificacionIds },
                    usuario: usuarioId
                },
                {
                    leida: true
                }
            );

            console.log(`✅ ${result.modifiedCount} notificaciones marcadas como leídas`);
            return result;
        } catch (error) {
            console.error('❌ Error marcando notificaciones como leídas:', error);
            throw error;
        }
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    async marcarTodasComoLeidas(usuarioId) {
        try {
            const result = await Notificacion.updateMany(
                { usuario: usuarioId, leida: false },
                { leida: true }
            );

            console.log(`✅ ${result.modifiedCount} notificaciones de ${usuarioId} marcadas como leídas`);
            return result;
        } catch (error) {
            console.error('❌ Error marcando todas como leídas:', error);
            throw error;
        }
    }

    /**
     * Obtener notificaciones no leídas de un usuario
     */
    async getNotificacionesNoLeidas(usuarioId) {
        try {
            return await Notificacion.find({
                usuario: usuarioId,
                leida: false
            })
                .populate('referencia.id')
                .populate('enviadoPor', 'nombre email')
                .sort('-createdAt');
        } catch (error) {
            console.error('❌ Error obteniendo notificaciones no leídas:', error);
            throw error;
        }
    }

    /**
     * Obtener todas las notificaciones de un usuario (paginadas)
     */
    async getNotificaciones(usuarioId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const [notificaciones, total, noLeidas] = await Promise.all([
                Notificacion.find({ usuario: usuarioId })
                    .populate('referencia.id')
                    .populate('enviadoPor', 'nombre email')
                    .sort('-createdAt')
                    .skip(skip)
                    .limit(limit),
                Notificacion.countDocuments({ usuario: usuarioId }),
                Notificacion.countDocuments({ usuario: usuarioId, leida: false })
            ]);

            return {
                notificaciones,
                total,
                noLeidas,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('❌ Error obteniendo notificaciones:', error);
            throw error;
        }
    }

    /**
     * Eliminar notificaciones antiguas
     */
    async limpiarNotificacionesAntiguas(dias = 30) {
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - dias);

            const result = await Notificacion.deleteMany({
                createdAt: { $lt: fechaLimite },
                leida: true
            });

            console.log(`🧹 Limpieza: ${result.deletedCount} notificaciones antiguas eliminadas`);
            return result;
        } catch (error) {
            console.error('❌ Error limpiando notificaciones antiguas:', error);
            throw error;
        }
    }

    /**
     * Obtener destinatarios por área
     */
    async getDestinatariosPorArea(areas) {
        try {
            return await User.find({
                area: { $in: areas },
                activo: true
            }).select('_id nombre email telefono area role');
        } catch (error) {
            console.error('❌ Error obteniendo destinatarios por área:', error);
            return [];
        }
    }

    /**
     * Obtener responsables por área específica
     */
    async getResponsablesPorArea(area) {
        try {
            return await User.find({
                area: area,
                activo: true
            }).select('_id nombre email telefono area');
        } catch (error) {
            console.error('❌ Error obteniendo responsables por área:', error);
            return [];
        }
    }

    /**
     * Obtener estadísticas de notificaciones para un usuario
     */
    async getEstadisticas(usuarioId) {
        try {
            const total = await Notificacion.countDocuments({ usuario: usuarioId });
            const noLeidas = await Notificacion.countDocuments({
                usuario: usuarioId,
                leida: false
            });

            const ultimasSemana = await Notificacion.countDocuments({
                usuario: usuarioId,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            const porTipo = await Notificacion.aggregate([
                { $match: { usuario: usuarioId } },
                { $group: { _id: "$tipo", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            return {
                total,
                noLeidas,
                ultimasSemana,
                porcentajeLeidas: total > 0 ? Math.round(((total - noLeidas) / total) * 100) : 0,
                porTipo
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // ========== MÉTODOS PRIVADOS PARA TEMPLATES ==========

    /**
     * Template email para nueva tienda
     */
    _getEmailTemplateNuevaTienda(tienda, usuario) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #E4002B; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">KFC Ecuador</h1>
                    <p style="margin: 5px 0 0;">Sistema de Aperturas</p>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #E4002B;">Nueva Tienda en Proceso de Apertura</h2>
                    <p>Hola <strong>${usuario.nombre} ${usuario.apellido || ''}</strong>,</p>
                    <p>Se ha creado una nueva tienda en el sistema de aperturas:</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #E4002B;">
                        <p><strong>Código:</strong> ${tienda.codigo}</p>
                        <p><strong>Nombre:</strong> ${tienda.nombre}</p>
                        <p><strong>Dirección:</strong> ${tienda.direccion?.calle || 'N/A'}, ${tienda.direccion?.ciudad || 'N/A'}</p>
                        <p><strong>Fecha apertura:</strong> ${tienda.fechaAperturaPlanificada ? new Date(tienda.fechaAperturaPlanificada).toLocaleDateString('es-EC') : 'N/A'}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tiendas/${tienda._id}" 
                           style="background-color: #E4002B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver Tienda
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Template email para asignación
     */
    _getEmailTemplateAsignacion(tienda, usuario, area, motivo) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #E4002B; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">KFC Ecuador</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #E4002B;">Has sido asignado como responsable</h2>
                    <p>Hola <strong>${usuario.nombre} ${usuario.apellido || ''}</strong>,</p>
                    <p>Has sido asignado como responsable de <strong>${area}</strong> para la siguiente tienda:</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #E4002B;">
                        <p><strong>Tienda:</strong> ${tienda.codigo} - ${tienda.nombre}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tiendas/${tienda._id}" 
                           style="background-color: #E4002B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver Tienda
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Template email para cambio de estado
     */
    _getEmailTemplateCambioEstado(tienda, proceso, estadoAnterior, usuario) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #E4002B; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">KFC Ecuador</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #E4002B;">Cambio de estado en proceso</h2>
                    <p>Hola <strong>${usuario.nombre} ${usuario.apellido || ''}</strong>,</p>
                    <p>El proceso <strong>${proceso.nombre}</strong> ha cambiado de estado:</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #E4002B;">
                        <p><strong>Tienda:</strong> ${tienda.codigo} - ${tienda.nombre}</p>
                        <p><strong>Estado anterior:</strong> ${estadoAnterior}</p>
                        <p><strong>Estado actual:</strong> ${proceso.estado}</p>
                        ${proceso.fechas?.finEstimado ? `<p><strong>Fecha límite:</strong> ${new Date(proceso.fechas.finEstimado).toLocaleDateString('es-EC')}</p>` : ''}
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/procesos/${proceso._id}" 
                           style="background-color: #E4002B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver Proceso
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Template email para retraso
     */
    _getEmailTemplateRetraso(tienda, proceso, diasRetraso, usuario) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">KFC Ecuador - ALERTA</h1>
                </div>
                <div style="padding: 30px; background-color: #ffebee;">
                    <h2 style="color: #f44336;">🔴 RETRASO CRÍTICO DETECTADO</h2>
                    <p>Hola <strong>${usuario.nombre} ${usuario.apellido || ''}</strong>,</p>
                    <p>Se ha detectado un retraso crítico en el siguiente proceso:</p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <p><strong>Proceso:</strong> ${proceso.nombre}</p>
                        <p><strong>Tienda:</strong> ${tienda.codigo} - ${tienda.nombre}</p>
                        <p><strong>Días de retraso:</strong> <span style="color: #f44336; font-weight: bold;">${diasRetraso} días</span></p>
                        <p><strong>Fecha límite:</strong> ${proceso.fechas?.finEstimado ? new Date(proceso.fechas.finEstimado).toLocaleDateString('es-EC') : 'N/A'}</p>
                    </div>
                    <p><strong>Acción requerida:</strong> Se necesita atención inmediata.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/procesos/${proceso._id}" 
                           style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver Proceso Atrasado
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Notificar proceso completado (método privado)
     */
    async _notificarProcesoCompletado(proceso, tienda) {
        try {
            const destinatarios = [];

            // Responsable del proceso
            if (proceso.equipo?.lider) {
                const lider = await User.findById(proceso.equipo.lider);
                if (lider) destinatarios.push(lider);
            }

            // Admin
            const admins = await User.find({ role: { $in: ['admin', 'admin_master'] } });
            destinatarios.push(...admins);

            for (const usuario of destinatarios) {
                if (!usuario) continue;

                await this.crearNotificacion({
                    usuario: usuario._id,
                    tipo: 'completado',
                    titulo: '✅ Proceso completado',
                    mensaje: `El proceso "${proceso.nombre}" en tienda ${tienda.codigo} ha sido completado exitosamente`,
                    prioridad: 'baja',
                    referencia: {
                        tipo: 'proceso',
                        id: proceso._id
                    },
                    metadata: {
                        tiendaCodigo: tienda.codigo,
                        procesoNombre: proceso.nombre,
                        fechaCompletado: proceso.fechas?.finReal
                    },
                    canales: {
                        email: true,
                        sms: false,
                        push: true
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error notificando proceso completado:', error);
        }
    }
}

module.exports = new NotificationService();