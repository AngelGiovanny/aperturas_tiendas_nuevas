// backend/services/emailService.js
const nodemailer = require('nodemailer');
const User = require('../models/User');
const path = require('path');

// Configuración del transporter usando variables de entorno
let transporter = null;

const initTransporter = () => {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'giovanny1104angel@gmail.com',
            pass: process.env.EMAIL_PASS
        }
    });

    console.log('📧 Servicio de email configurado con:', process.env.EMAIL_USER);
    return transporter;
};

// =============================================
// FUNCIÓN PRINCIPAL: Obtener destinatarios según la cadena de la tienda
// =============================================
const obtenerDestinatariosPorCadena = async (cadenaTienda) => {
    try {
        // 1. Usuarios que ven TODAS las cadenas
        const usuariosTodasCadenas = await User.find({
            cadenaAsignada: 'TODAS',
            activo: true,
            email: { $exists: true, $ne: '' }
        }).select('email nombre apellido role cadenaAsignada');

        // 2. Usuarios asignados específicamente a esta cadena
        const usuariosCadenaEspecifica = await User.find({
            cadenaAsignada: cadenaTienda,
            activo: true,
            email: { $exists: true, $ne: '' }
        }).select('email nombre apellido role cadenaAsignada');

        // 3. Usuarios específicos por rol (siempre se incluyen)
        const emailsFijos = [
            'angel.gualotuna@kfc.com.ec',      // Admin KFC
            'giovanny1104angel@gmail.com',     // Admin Personal
            'soporte@kfc.com.ec',              // Soporte
            'angelica.torres@kfc.com.ec',      // Angelica Torres
            'oscar.diaz@kfc.com.ec',           // Oscar Diaz
            'oscar.castro@kfc.com.ec',         // Oscar Castro
            'stephanie.molina@kfc.com.ec',     // Stephanie Molina
            'darwin.mora@kfc.com.ec',          // Darwin Mora
            'soporte@trade.ec',                // Trade
            'erika.farina@trade.ec',           // Erika Farina
            'jdiego.vaca@kfc.com.ec'           // Juan Diego Vaca
        ];

        const usuariosFijos = await User.find({
            email: { $in: emailsFijos },
            activo: true
        }).select('email nombre apellido role');

        // 4. Operaciones por cadena (si aplica)
        const emailsOperacionesPorCadena = {
            'KFC': ['david.beltran@kfc.com.ec', 'carlos.velastegui@kfc.com.ec'],
            'JUAN_VALDEZ': ['david.beltran@kfc.com.ec'],
            'GUS': ['david.beltran@kfc.com.ec'],
            'MENESTRAS': ['david.beltran@kfc.com.ec'],
            'CAJUN': ['david.beltran@kfc.com.ec'],
            'AMERICAN_DELI': ['david.beltran@kfc.com.ec'],
            'ESPANOL': ['david.beltran@kfc.com.ec'],
            'BASKIN_ROBBINS': ['david.beltran@kfc.com.ec'],
            'CINNABON': ['david.beltran@kfc.com.ec'],
            'TROPI': ['david.beltran@kfc.com.ec'],
            'IL_CAPPO': ['david.beltran@kfc.com.ec']
        };

        const emailsOperaciones = emailsOperacionesPorCadena[cadenaTienda] || ['david.beltran@kfc.com.ec'];
        const usuariosOperaciones = await User.find({
            email: { $in: emailsOperaciones },
            activo: true
        }).select('email nombre apellido role');

        // Combinar todos los destinatarios
        const todosDestinatarios = [
            ...usuariosTodasCadenas,
            ...usuariosCadenaEspecifica,
            ...usuariosFijos,
            ...usuariosOperaciones
        ];

        // Eliminar duplicados por email
        const destinatariosUnicos = [];
        const emailsSet = new Set();

        for (const user of todosDestinatarios) {
            if (user.email && !emailsSet.has(user.email)) {
                emailsSet.add(user.email);
                destinatariosUnicos.push(user);
            }
        }

        console.log(`📧 Destinatarios para cadena ${cadenaTienda}: ${destinatariosUnicos.length} usuarios`);
        destinatariosUnicos.forEach(u => {
            console.log(`   - ${u.email} (${u.role}) - Cadena: ${u.cadenaAsignada || 'TODAS'}`);
        });

        return destinatariosUnicos;

    } catch (error) {
        console.error('❌ Error obteniendo destinatarios:', error);
        return [];
    }
};

// =============================================
// FUNCIÓN: Enviar correo de creación de tienda (MULTITEMA - Conservando HTML original)
// =============================================
const enviarCorreoCreacionTienda = async (tienda, usuarioCreador, tecnicoCX) => {
    try {
        const transporter = initTransporter();

        // Obtener destinatarios dinámicamente según la cadena de la tienda
        const destinatarios = await obtenerDestinatariosPorCadena(tienda.cadena);

        // ✅ Verificar si necesita incluir a Trade (Pick Up o Canal Propio activo)
        const tienePickUp = tienda.configuracionEstaciones?.pickUp === true;
        const tieneCanalPropio = tienda.configuracionEstaciones?.delivery?.canalPropio === true;
        const necesitaTrade = tienePickUp || tieneCanalPropio;

        // Construir lista de destinatarios base
        let emailsDestino = destinatarios.map(d => d.email);

        // ✅ Agregar a Anthony Villalba y Valeria Bravo SIEMPRE (para puntos de emisión)
        const emailsPuntosEmision = ['anthony.villalba@kfc.com.ec', 'valeria.bravo@kfc.com.ec'];

        // Fusionar y eliminar duplicados
        const todosEmails = [...emailsDestino, ...emailsPuntosEmision];
        const emailsUnicos = [...new Set(todosEmails)];

        if (emailsUnicos.length === 0) {
            console.warn(`⚠️ No hay destinatarios para la tienda ${tienda.codigo}`);
            return { success: false, error: 'No hay destinatarios' };
        }

        const fechaActual = new Date().toLocaleString('es-EC', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const hora = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const saludo = hora >= '19:00' ? 'Buenas noches' : (hora >= '12:00' ? 'Buenas tardes' : 'Buenos días');

        // Obtener usuarios MKT específicos de esta cadena
        const usuariosMKT = destinatarios.filter(d => d.role === 'marketing');
        const nombresMKT = usuariosMKT.map(u => `${u.nombre} ${u.apellido || ''}`.trim()).join(', ') || 'MKT por asignar';
        const emailsMKT = usuariosMKT.map(u => u.email).join(', ');

        // Obtener usuarios Operaciones de esta cadena
        const usuariosOperaciones = destinatarios.filter(d => d.role === 'operaciones');
        const nombresOperaciones = usuariosOperaciones.map(u => `${u.nombre} ${u.apellido || ''}`.trim()).join(', ') || 'Operaciones';

        // ✅ Construir sección condicional de Trade
        const tradeSection = necesitaTrade ? `
            <li><strong>@Trade</strong> (<a href="mailto:soporte@trade.ec">soporte@trade.ec</a>), <strong>@Erika Farina</strong> (<a href="mailto:erika.farina@trade.ec">erika.farina@trade.ec</a>), <strong>@Juan Diego Vaca</strong> (<a href="mailto:jdiego.vaca@kfc.com.ec">jdiego.vaca@kfc.com.ec</a>)</li>
            <ul>
                <li>Creación de la tienda para la integración de delivery ${tieneCanalPropio ? '(Canal Propio)' : ''} ${tienePickUp ? 'y Pick Up' : ''}</li>
                <li>Creación de los métodos de pago por integración de órdenes</li>
            </ul>
        ` : '';

        // ✅ HTML CON MULTITEMA - SOLO SE AGREGAN LOS ESTILOS @media, EL RESTO ES TU CÓDIGO ORIGINAL
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Nueva Tienda Creada - ${tienda.codigo}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #cc0000, #990000); color: white; padding: 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .content { padding: 25px; }
                    .info-box { background: #f8f9fa; border-left: 4px solid #cc0000; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .info-item { margin: 8px 0; }
                    .info-label { font-weight: bold; width: 140px; display: inline-block; }
                    .task-list { margin: 15px 0; padding-left: 20px; }
                    .task-list li { margin: 8px 0; }
                    .badge { display: inline-block; background: #cc0000; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; }
                    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 5px; font-size: 12px; color: #856404; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; }
                    .button { background: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
                    .info-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; }
                    
                    /* ✅ TEMA OSCURO - AGREGADO SIN MODIFICAR TU CÓDIGO ORIGINAL */
                    @media (prefers-color-scheme: dark) {
                        body { background-color: #1a1a1a; }
                        .container { background: #2d2d2d; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
                        .header { background: linear-gradient(135deg, #8b0000, #5c0000); color: #ffffff; }
                        .header p { color: #ffb74d; }
                        .info-box { background: #3d3d3d; border-left-color: #cc0000; color: #e0e0e0; }
                        .badge { background: #cc0000; color: #ffffff; }
                        .warning-box { background: #2d2d1a; border-left-color: #ffc107; color: #ffb74d; }
                        .footer { background: #3d3d3d; color: #aaa; border-top-color: #555; }
                        .button { background: #cc0000; color: #ffffff; }
                        a { color: #ff6b6b; }
                        .info-label { color: #ccc; }
                        .info-badge { background: #1b3a2a; color: #4caf50; }
                        .task-list { color: #e0e0e0; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏪 NUEVA TIENDA CREADA</h1>
                        <p>Sistema de Aperturas KFC - Notificación Automática</p>
                    </div>
                    <div class="content">
                        <div class="warning-box">
                            ⚠️ <strong>PRUEBAS DE SISTEMA EN DESARROLLO</strong> - Por favor ignorar este correo hasta la entrega oficial del sistema.
                        </div>
                        
                        <p>${saludo},</p>
                        
                        <p>Estimado equipo,</p>
                        
                        <div class="info-box">
                            <h3>📋 INFORMACIÓN DE LA TIENDA</h3>
                            <div class="info-item"><span class="info-label">Código:</span> ${tienda.codigo}</div>
                            <div class="info-item"><span class="info-label">Nombre:</span> ${tienda.nombre}</div>
                            <div class="info-item"><span class="info-label">Cadena:</span> ${tienda.cadena}</div>
                            <div class="info-item"><span class="info-label">Dirección:</span> ${tienda.direccion?.calle || 'No registrada'}</div>
                            <div class="info-item"><span class="info-label">Ciudad:</span> ${tienda.direccion?.ciudad || 'No registrada'}</div>
                            <div class="info-item"><span class="info-label">Teléfono:</span> ${tienda.telefono || 'No registrado'}</div>
                            <div class="info-item"><span class="info-label">Fecha Planificada:</span> ${tienda.fechaAperturaPlanificada ? new Date(tienda.fechaAperturaPlanificada).toLocaleDateString('es-EC') : 'No definida'}</div>
                            <div class="info-item"><span class="info-label">Creado por:</span> ${usuarioCreador.nombre} (${usuarioCreador.email})</div>
                            <div class="info-item"><span class="info-label">CX Asignado:</span> ${tecnicoCX?.nombre || 'Por asignar'} <span class="badge">Técnico de campo</span></div>
                        </div>
                        
                        <p>Esta tienda estará a cargo de <strong>${tecnicoCX?.nombre || 'Analista CX por asignar'}</strong> para la configuración como tal por parte del DSI por lo cual, se solicita lo siguiente:</p>
                        
                        <h3>✅ TAREAS REQUERIDAS</h3>
                        
                        <ul class="task-list">
                            <li><strong>@Soporte Mesa de Servicios</strong> (<a href="mailto:soporte@kfc.com.ec">soporte@kfc.com.ec</a>), <strong>@Angelica Torres</strong> (<a href="mailto:angelica.torres@kfc.com.ec">angelica.torres@kfc.com.ec</a>)</li>
                            <ul>
                                <li>Creación de usuarios de Kioscos</li>
                                <li>Creación de cajero Pick Up</li>
                                <li>Creación de usuarios cajeros del local</li>
                                <li>Creación de los casos tanto para configuración como para despliegues ya que se interviene dos procesos diferentes</li>
                            </ul>
                            <li><strong>@Oscar Diaz</strong> (<a href="mailto:oscar.diaz@kfc.com.ec">oscar.diaz@kfc.com.ec</a>), <strong>@Oscar Castro</strong> (<a href="mailto:oscar.castro@kfc.com.ec">oscar.castro@kfc.com.ec</a>)</li>
                            <ul>
                                <li>MAC del server</li>
                                <li>Puntos de emisión solicitados y autorizados por Contabilidad</li>
                                <li>Conexión a los equipos tanta cajas como servidor para paso de servicios</li>
                                <li>OBDC del server actualizado</li>
                                <li>NODE actualizado</li>
                                <li>TFS creados en cajas y servidor</li>
                                <li>Confirmación si salen con Medianet</li>
                            </ul>
                            <li><strong>@Anthony Villalba</strong> (<a href="mailto:anthony.villalba@kfc.com.ec">anthony.villalba@kfc.com.ec</a>), <strong>@Valeria Bravo</strong> (<a href="mailto:valeria.bravo@kfc.com.ec">valeria.bravo@kfc.com.ec</a>)</li>
                            <ul>
                                <li>Activación de puntos de emisión según formato estándar de estaciones</li>
                            </ul>
                            <li><strong>@${nombresMKT}</strong> (<a href="mailto:${emailsMKT}">${emailsMKT}</a>)</li>
                            <ul>
                                <li>Solicitud de pagos con De Una para este local tiene dos estaciones de counter</li>
                            </ul>
                            <li><strong>@Operaciones por cadena (${nombresOperaciones}), @CDC/Operaciones</strong></li>
                            <ul>
                                <li>Archivo KML del polígono de DT en caso de tener delivery</li>
                                <li>Confirmación si sale con localizadores para el respectivo despliegue</li>
                            </ul>
                            <li><strong>@Stephanie Molina</strong> (<a href="mailto:stephanie.molina@kfc.com.ec">stephanie.molina@kfc.com.ec</a>), <strong>@Darwin Mora</strong> (<a href="mailto:darwin.mora@kfc.com.ec">darwin.mora@kfc.com.ec</a>)</li>
                            <ul>
                                <li>Confirmación de los canales de delivery que se va a manejar</li>
                                <li>Verificación de la tienda en el SIR para que suba las respectivas ventas</li>
                            </ul>
                            ${tradeSection}
                        </ul>
                        
                        <div class="info-box">
                            <h3>📎 CHECK LIST DE AVANCES</h3>
                            <p>Adjunto la tienda al <strong>Check List de avances en línea</strong> para su confirmación.</p>
                            <div style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tiendas/${tienda._id}" class="button">🔗 Ver Tienda en el Sistema</a>
                            </div>
                        </div>
                        
                        <p>Sin más que acotar o solicitar estaré al pendiente de esta información para comenzar a realizar esta tienda y poder dejar en flujo para el respectivo viaje a la ciudad destino sin novedades y se pueda generar tanto la primera factura como la apertura sin novedades.</p>
                        
                        <p>Atentamente,<br>
                        <strong>${usuarioCreador.nombre}</strong><br>
                        Sistema de Aperturas KFC</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} KFC Ecuador - Sistema de Aperturas de Tiendas</p>
                        <p>Este es un correo automático, por favor no responder a este mensaje.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const info = await transporter.sendMail({
            from: `"Sistema Aperturas KFC" <${process.env.EMAIL_USER}>`,
            to: emailsUnicos.join(', '),
            subject: `🏪 Check List MXP - Tienda a crear: ${tienda.codigo} - ${tienda.nombre}`,
            html: htmlContent
        });

        console.log(`✅ Correo enviado para tienda ${tienda.codigo}: ${info.messageId}`);
        console.log(`📧 Destinatarios: ${emailsUnicos.length}`);
        console.log(`📦 Pick Up activo: ${tienePickUp}, Canal Propio activo: ${tieneCanalPropio}, Trade incluido: ${necesitaTrade}`);

        return { success: true, messageId: info.messageId, destinatarios: emailsUnicos.length };

    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        return { success: false, error: error.message };
    }
};

// =============================================
// 🆕 FUNCIÓN: Notificar avance de modal (cuando se completa un checklist)
// =============================================
const enviarCorreoAvanceModal = async (tienda, modalNombre, modalPorcentaje, usuarioCompleto) => {
    try {
        const transporter = initTransporter();

        const destinatarios = await obtenerDestinatariosPorCadena(tienda.cadena);
        const emailsDestino = destinatarios.map(d => d.email);

        // Agregar siempre a los responsables de seguimiento
        const emailsSeguimiento = ['angel.gualotuna@kfc.com.ec', 'oscar.diaz@kfc.com.ec', 'oscar.castro@kfc.com.ec'];
        const todosEmails = [...new Set([...emailsDestino, ...emailsSeguimiento])];

        const hora = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const saludo = hora >= '19:00' ? 'Buenas noches' : (hora >= '12:00' ? 'Buenas tardes' : 'Buenos días');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Avance de Apertura - ${tienda.codigo}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #2e7d32, #1b5e20); color: white; padding: 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 22px; }
                    .content { padding: 25px; }
                    .progress-box { background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
                    .progress-percent { font-size: 48px; font-weight: bold; color: #2e7d32; }
                    .info-item { margin: 10px 0; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; }
                    .button { background: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
                    
                    /* ✅ TEMA OSCURO */
                    @media (prefers-color-scheme: dark) {
                        body { background: #1a1a1a; }
                        .container { background: #2d2d2d; }
                        .header { background: linear-gradient(135deg, #1b5e20, #0d2818); }
                        .progress-box { background: #1b3a2a; border-left-color: #4caf50; }
                        .progress-percent { color: #4caf50; }
                        .footer { background: #3d3d3d; color: #aaa; border-top-color: #555; }
                        .button { background: #4caf50; }
                        .info-item { color: #e0e0e0; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 AVANCE DE APERTURA</h1>
                        <p>${tienda.codigo} - ${tienda.nombre}</p>
                    </div>
                    <div class="content">
                        <p>${saludo},</p>
                        <p>Se reporta un nuevo avance en el proceso de apertura de la tienda:</p>
                        
                        <div class="progress-box">
                            <div class="progress-percent">${modalPorcentaje}%</div>
                            <p><strong>${modalNombre}</strong> - Completado</p>
                        </div>
                        
                        <div class="info-item"><strong>📋 Tienda:</strong> ${tienda.codigo} - ${tienda.nombre}</div>
                        <div class="info-item"><strong>✅ Modal completado:</strong> ${modalNombre}</div>
                        <div class="info-item"><strong>👤 Completado por:</strong> ${usuarioCompleto?.nombre || 'Sistema'} ${usuarioCompleto?.apellido || ''}</div>
                        <div class="info-item"><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-EC')}</div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tiendas/${tienda._id}" class="button">🔗 Ver Progreso</a>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 12px; color: #666;">Este es un correo automático de seguimiento del proceso de apertura.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} KFC Ecuador - Sistema de Aperturas de Tiendas</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const info = await transporter.sendMail({
            from: `"Sistema Aperturas KFC" <${process.env.EMAIL_USER}>`,
            to: todosEmails.join(', '),
            subject: `📊 Avance de Apertura - ${modalNombre} completado - Tienda ${tienda.codigo}`,
            html: htmlContent
        });

        console.log(`✅ Correo de avance enviado para modal ${modalNombre} de tienda ${tienda.codigo}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error enviando correo de avance:', error);
        return { success: false, error: error.message };
    }
};

// =============================================
// 🆕 FUNCIÓN: Enviar correo POST MORTEM (finalización de apertura)
// =============================================
const enviarCorreoPostMortem = async (tienda, usuarioCreador, imagenesAdjuntas = [], metricas = {}) => {
    try {
        const transporter = initTransporter();

        // Obtener técnico CX asignado
        let tecnicoCX = null;
        if (tienda.responsableCX) {
            tecnicoCX = await User.findById(tienda.responsableCX).select('nombre apellido email');
        }

        const hora = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const saludo = hora >= '19:00' ? 'Buenas noches' : (hora >= '12:00' ? 'Buenas tardes' : 'Buenos días');

        // Destinatarios del Post Mortem
        const destinatariosPostMortem = [
            'angel.gualotuna@kfc.com.ec',
            'anthony.villalba@kfc.com.ec',
            'valeria.bravo@kfc.com.ec',
            'oscar.diaz@kfc.com.ec',
            'oscar.castro@kfc.com.ec',
            'soporte@trade.ec',
            'erika.farina@trade.ec',
            'jdiego.vaca@kfc.com.ec'
        ];

        if (tecnicoCX?.email) {
            destinatariosPostMortem.push(tecnicoCX.email);
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Post Mortem - Apertura ${tienda.nombre}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #1a472a, #2d6a4f); color: white; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; }
                    .info-card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #2d6a4f; }
                    .info-row { display: flex; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
                    .info-label { width: 140px; font-weight: 600; }
                    .section-title { background: #e9ecef; padding: 10px 15px; border-radius: 8px; font-weight: 600; margin: 20px 0 15px 0; }
                    .modal-list { list-style: none; padding: 0; }
                    .modal-item { display: flex; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px; }
                    .modal-check { width: 24px; height: 24px; background: #2e7d32; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; color: white; }
                    .image-gallery { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
                    .image-thumb { width: 100px; height: 100px; background: #f8f9fa; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6; }
                    .image-thumb img { width: 100%; height: 100%; object-fit: cover; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #dee2e6; }
                    .responsible-tag { background: #e3f2fd; padding: 5px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin: 5px; }
                    
                    /* ✅ TEMA OSCURO */
                    @media (prefers-color-scheme: dark) {
                        body { background: #1a1a1a; color: #e0e0e0; }
                        .container { background: #2d2d2d; }
                        .header { background: linear-gradient(135deg, #0d2818, #1b4d3b); }
                        .badge { background: #1b3a2a; color: #4caf50; }
                        .info-card { background: #3d3d3d; border-left-color: #4caf50; }
                        .info-row { border-bottom-color: #555; }
                        .info-label { color: #aaa; }
                        .section-title { background: #3d3d3d; color: #81c784; }
                        .modal-item { background: #3d3d3d; }
                        .modal-check { background: #4caf50; }
                        .footer { background: #3d3d3d; border-top-color: #555; }
                        .responsible-tag { background: #1a3a5c; color: #90caf9; }
                        .image-thumb { border-color: #555; background: #3d3d3d; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 POST MORTEM · APERTURA DE TIENDA</h1>
                        <p>Informe técnico final del proceso de apertura</p>
                    </div>
                    <div class="content">
                        <div style="text-align: center;">
                            <span class="badge">✅ APERTURA COMPLETADA</span>
                        </div>

                        <div class="info-card">
                            <h3>🏪 Información de la Tienda</h3>
                            <div class="info-row"><div class="info-label">Código:</div><div><strong>${tienda.codigo || 'N/A'}</strong></div></div>
                            <div class="info-row"><div class="info-label">Nombre:</div><div><strong>${tienda.nombre || 'N/A'}</strong></div></div>
                            <div class="info-row"><div class="info-label">Cadena:</div><div>${tienda.cadena || 'N/A'}</div></div>
                            <div class="info-row"><div class="info-label">Dirección:</div><div>${tienda.direccion?.calle || ''}, ${tienda.direccion?.ciudad || ''}</div></div>
                            <div class="info-row"><div class="info-label">Fecha Apertura:</div><div>${new Date().toLocaleDateString('es-ES')}</div></div>
                        </div>

                        <div class="section-title">👥 Equipo Responsable</div>
                        <div>
                            ${tecnicoCX ? `<span class="responsible-tag">🔧 Técnico CX: ${tecnicoCX.nombre} ${tecnicoCX.apellido || ''}</span>` : '<span class="responsible-tag">⚠️ Técnico CX: No asignado</span>'}
                            <span class="responsible-tag">📊 Finalizado por: ${usuarioCreador?.nombre || 'Sistema'}</span>
                        </div>

                        <div class="section-title">📍 Puntos de Emisión</div>
                        <div>
                            <span class="responsible-tag" style="background:#2e7d32;color:white;">Anthony Villalba</span>
                            <span class="responsible-tag" style="background:#2e7d32;color:white;">Valeria Bravo</span>
                        </div>

                        <div class="section-title">✅ Modales Completados</div>
                        <ul class="modal-list">
                            <li class="modal-item"><span class="modal-check">✓</span> Configuración Inicial <span style="margin-left:auto;">${metricas.modal1Fecha || 'Completado'}</span></li>
                            <li class="modal-item"><span class="modal-check">✓</span> Integración Agregadores <span style="margin-left:auto;">${metricas.modal2Fecha || 'Completado'}</span></li>
                            <li class="modal-item"><span class="modal-check">✓</span> Recepción de Órdenes <span style="margin-left:auto;">${metricas.modal3Fecha || 'Completado'}</span></li>
                            <li class="modal-item"><span class="modal-check">✓</span> Automatización Menús <span style="margin-left:auto;">${metricas.modal4Fecha || 'Completado'}</span></li>
                            <li class="modal-item"><span class="modal-check">✓</span> Apertura y Puesta en Marcha <span style="margin-left:auto;">${new Date().toLocaleDateString('es-ES')}</span></li>
                        </ul>

                        <div class="section-title">📊 Métricas del Proceso</div>
                        <div class="info-card" style="background:#e8f5e9;">
                            <div class="info-row"><div class="info-label">Días totales:</div><div><strong>${metricas.duracionTotalDias || 'N/A'}</strong></div></div>
                            <div class="info-row"><div class="info-label">Eficiencia:</div><div><strong>${metricas.eficiencia || '100'}%</strong></div></div>
                            <div class="info-row"><div class="info-label">Incidencias:</div><div><strong>${metricas.totalIncidencias || 0}</strong></div></div>
                        </div>

                        ${imagenesAdjuntas && imagenesAdjuntas.length > 0 ? `
                        <div class="section-title">📸 Evidencia Fotográfica</div>
                        <div class="image-gallery">
                            ${imagenesAdjuntas.map((img, idx) => `<div class="image-thumb"><img src="cid:imagen_${idx}" alt="Evidencia ${idx + 1}"></div>`).join('')}
                        </div>
                        <p style="font-size: 12px; margin-top: 10px;">Total: ${imagenesAdjuntas.length} imagen(es) adjunta(s)</p>
                        ` : ''}

                        <div class="info-card" style="border-left-color: #ff9800;">
                            <h3>📝 Observaciones y Lecciones Aprendidas</h3>
                            <p>${metricas.observaciones || 'Sin observaciones adicionales.'}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>${saludo}, este es un correo automático generado al finalizar la apertura.</p>
                        <p>Sistema de Gestión de Aperturas · ${new Date().toLocaleString('es-ES')}</p>
                        <p style="margin-top: 10px; font-size: 10px;">Documento confidencial - Distribución interna DSI / Operaciones / CX</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Construir attachments para imágenes
        const attachments = imagenesAdjuntas.map((img, idx) => {
            if (img.buffer) {
                return {
                    filename: img.filename || `evidencia_${idx + 1}.jpg`,
                    content: img.buffer,
                    cid: `imagen_${idx}`
                };
            }
            return null;
        }).filter(Boolean);

        const info = await transporter.sendMail({
            from: `"Sistema Aperturas KFC" <${process.env.EMAIL_USER}>`,
            to: destinatariosPostMortem.join(', '),
            subject: `📋 POST MORTEM · Apertura completada - ${tienda.nombre} (${tienda.codigo || 'N/A'})`,
            html: htmlContent,
            attachments: attachments,
            priority: 'high'
        });

        console.log(`✅ Correo Post Mortem enviado para tienda ${tienda.codigo}`);
        return info;

    } catch (error) {
        console.error('❌ Error enviando correo Post Mortem:', error);
        throw error;
    }
};

// =============================================
// FUNCIÓN: Enviar correo de nueva implementación (MEJORADA - PROFESIONAL)
// =============================================
const enviarCorreoNuevaImplementacion = async (implementacion, tecnicoCX) => {
    try {
        const transporter = initTransporter();

        if (!tecnicoCX || !tecnicoCX.email) {
            console.warn(`⚠️ No hay técnico CX asignado para la implementación ${implementacion.codigo}`);
            return { success: false, error: 'No hay técnico CX asignado' };
        }

        // Obtener datos adicionales del técnico
        const tecnicoCompleto = await User.findById(tecnicoCX._id).select('nombre apellido email telefono');

        const hora = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const saludo = hora >= '19:00' ? 'Buenas noches' : (hora >= '12:00' ? 'Buenas tardes' : 'Buenos días');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Nueva Implementación Asignada - ${implementacion.codigo}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                    .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #cc0000, #990000); color: white; padding: 25px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { margin: 5px 0 0; opacity: 0.9; }
                    .content { padding: 30px; }
                    .info-box { background: #f8f9fa; border-left: 4px solid #cc0000; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .info-item { margin: 12px 0; }
                    .info-label { font-weight: bold; width: 140px; display: inline-block; color: #555; }
                    .info-value { color: #333; }
                    .priority-badge { display: inline-block; background: #ff9800; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                    .button { background: #cc0000; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: bold; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; }
                    .warning-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; font-size: 13px; color: #856404; }
                    .action-list { margin: 15px 0; padding-left: 20px; }
                    .action-list li { margin: 8px 0; }
                    
                    /* ✅ TEMA OSCURO */
                    @media (prefers-color-scheme: dark) {
                        body { background: #1a1a1a; color: #e0e0e0; }
                        .container { background: #2d2d2d; }
                        .header { background: linear-gradient(135deg, #8b0000, #5c0000); }
                        .info-box { background: #3d3d3d; color: #e0e0e0; }
                        .info-label { color: #aaa; }
                        .info-value { color: #e0e0e0; }
                        .footer { background: #3d3d3d; color: #aaa; border-top-color: #555; }
                        .warning-box { background: #2d2d1a; color: #d4a017; }
                        a { color: #90caf9; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔧 NUEVA IMPLEMENTACIÓN ASIGNADA</h1>
                        <p>Sistema de Gestión de Implementaciones KFC</p>
                    </div>
                    <div class="content">
                        <p>${saludo} <strong>${tecnicoCompleto.nombre} ${tecnicoCompleto.apellido || ''}</strong>,</p>
                        
                        <p>Se le ha asignado una nueva implementación en el sistema de gestión de aperturas KFC. Por favor, revise los detalles a continuación y tome atención al mismo.</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #cc0000;">📋 INFORMACIÓN DE LA IMPLEMENTACIÓN</h3>
                            <div class="info-item"><span class="info-label">Código:</span> <span class="info-value"><strong>${implementacion.codigo}</strong></span></div>
                            <div class="info-item"><span class="info-label">Nombre:</span> <span class="info-value">${implementacion.nombre}</span></div>
                            <div class="info-item"><span class="info-label">Cadena:</span> <span class="info-value">${implementacion.cadena}</span></div>
                            <div class="info-item"><span class="info-label">Fecha Planificada:</span> <span class="info-value">${implementacion.fechaImplementacionPlanificada ? new Date(implementacion.fechaImplementacionPlanificada).toLocaleDateString('es-EC') : 'No definida'}</span></div>
                            <div class="info-item"><span class="info-label">Fecha Asignación:</span> <span class="info-value">${new Date().toLocaleString('es-EC')}</span></div>
                            <div class="info-item"><span class="info-label">Prioridad:</span> <span class="priority-badge">ALTA</span></div>
                        </div>
                        
                        <div class="warning-box">
                            <strong>⚠️ ACCIONES REQUERIDAS:</strong>
                            <ul class="action-list">
                                <li>Revisar la configuración de estaciones de la tienda</li>
                                <li>Coordinar con el equipo de DSI para la integración</li>
                                <li>Validar puntos de emisión según estándar</li>
                                <li>Confirmar disponibilidad de recursos técnicos</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/implementaciones/${implementacion._id}" class="button">🔗 VER IMPLEMENTACIÓN</a>
                        </div>
                        
                        <p style="margin-top: 25px; font-size: 13px;">Por favor, confirme recepción de esta asignación y mantenga actualizado el estado del proceso en el sistema.</p>
                        
                        <p>Atentamente,<br>
                        <strong>Sistema de Implementaciones KFC</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} KFC Ecuador - Sistema de Gestión de Aperturas e Implementaciones</p>
                        <p>Este es un correo automático, por favor no responder a este mensaje.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const info = await transporter.sendMail({
            from: `"Sistema Implementaciones KFC" <${process.env.EMAIL_USER}>`,
            to: tecnicoCX.email,
            subject: `🔧 NUEVA IMPLEMENTACIÓN ASIGNADA: ${implementacion.codigo} - ${implementacion.nombre}`,
            html: htmlContent,
            priority: 'high'
        });

        console.log(`✅ Correo de implementación enviado a ${tecnicoCX.email}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error enviando correo de implementación:', error);
        return { success: false, error: error.message };
    }
};

// =============================================
// FUNCIÓN: Enviar correo de prueba (MULTITEMA)
// =============================================
const enviarCorreoPrueba = async (destinatario) => {
    try {
        const transporter = initTransporter();

        const info = await transporter.sendMail({
            from: `"Sistema Aperturas KFC" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: '🔧 Prueba de sistema - Notificación KFC Aperturas',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
                        .header { background: linear-gradient(135deg, #cc0000, #990000); color: white; padding: 20px; text-align: center; }
                        .content { padding: 25px; }
                        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #666; }
                        @media (prefers-color-scheme: dark) {
                            body { background: #1a1a1a; }
                            .container { background: #2d2d2d; color: #e0e0e0; }
                            .header { background: linear-gradient(135deg, #8b0000, #5c0000); }
                            .footer { background: #3d3d3d; color: #aaa; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Prueba Exitosa</h1>
                        </div>
                        <div class="content">
                            <p>El sistema de correos del Sistema de Aperturas KFC funciona correctamente.</p>
                            <p><strong>Email configurado:</strong> ${process.env.EMAIL_USER}</p>
                            <p><strong>Destinatario:</strong> ${destinatario}</p>
                        </div>
                        <div class="footer">
                            <p>⚠️ Pruebas de sistema en desarrollo - Ignorar este correo.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log(`✅ Correo de prueba enviado a ${destinatario}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error enviando correo de prueba:', error);
        return { success: false, error: error.message };
    }
};

// =============================================
// EXPORTAR MÓDULOS
// =============================================
module.exports = {
    initTransporter,
    enviarCorreoCreacionTienda,
    enviarCorreoNuevaImplementacion,
    enviarCorreoPrueba,
    enviarCorreoAvanceModal,
    enviarCorreoPostMortem,
    obtenerDestinatariosPorCadena
};