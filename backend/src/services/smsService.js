/**
 * Servicio de SMS para KFC Aperturas
 * Soporta modo simulación cuando no hay credenciales
 */

let client = null;

// Verificar credenciales de Twilio de forma segura
const twilioConfigurado = process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER &&
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    process.env.TWILIO_ACCOUNT_SID.length > 20;

// Solo inicializar Twilio si hay credenciales válidas
if (twilioConfigurado) {
    try {
        const twilio = require('twilio');
        client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        console.log('✅ Twilio inicializado correctamente');
    } catch (error) {
        console.warn('⚠️ Error inicializando Twilio:', error.message);
        console.warn('   SMS funcionarán en modo simulación');
        client = null;
    }
} else {
    console.log('📱 Modo SIMULACIÓN: SMS no configurados (usa credenciales reales para activar)');
    console.log('   TWILIO_ACCOUNT_SID debe empezar con "AC" y tener longitud válida');
}

/**
 * Plantillas de SMS para diferentes tipos de notificaciones
 */
const smsTemplates = {
    // Notificación de nueva tienda
    nuevaTienda: (tienda) =>
        `KFC Aperturas: Nueva tienda ${tienda.codigo} - ${tienda.nombre} creada. Revisa el sistema.`,

    // Notificación de asignación de responsable
    asignacion: (tienda, area) =>
        `KFC Aperturas: Has sido asignado a tienda ${tienda.codigo} como responsable de ${area}.`,

    // Notificación de validación requerida
    validacionRequerida: (tienda, proceso) =>
        `KFC Aperturas: Validación requerida para ${proceso.nombre} en tienda ${tienda.codigo}`,

    // Recordatorio de proceso próximo a vencer
    recordatorio: (tienda, proceso, horas) =>
        `⏰ KFC Aperturas: Recordatorio: ${proceso.nombre} en ${tienda.codigo} vence en ${horas} horas.`,

    // Notificación de cambio de estado
    cambioEstado: (tienda, proceso, estado) =>
        `KFC Aperturas: Proceso ${proceso.nombre} en tienda ${tienda.codigo} cambió a ${estado}.`,

    // Alerta de retraso crítico
    atrasoCritico: (tienda, proceso, dias) =>
        `⚠️ KFC Aperturas: ALERTA - Proceso ${proceso.nombre} en tienda ${tienda.codigo} está ${dias} días ATRASADO. Actuar urgente.`,

    // Confirmación de acción completada
    completado: (tienda, proceso) =>
        `✅ KFC Aperturas: Proceso ${proceso.nombre} en tienda ${tienda.codigo} completado exitosamente.`
};

/**
 * Función para enviar SMS
 * @param {string} to - Número de teléfono destino
 * @param {string} message - Mensaje a enviar (o template a usar)
 * @param {string} template - Nombre de la plantilla (opcional)
 * @param {object} data - Datos para la plantilla (opcional)
 * @returns {Promise<object>} Resultado del envío
 */
const sendSMS = async (to, message, template = null, data = null) => {
    try {
        // Validar entrada
        if (!to) {
            return {
                success: false,
                error: 'Número de teléfono no proporcionado',
                simulated: false
            };
        }

        // Usar plantilla si se proporciona
        let finalMessage = message;
        if (template && smsTemplates[template] && data) {
            finalMessage = smsTemplates[template](data);
        }

        // Validar formato de número de teléfono
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(to)) {
            console.warn('⚠️ Formato de número inválido:', to);
            console.warn('   El número debe tener formato internacional (+593999999999)');

            // Intentar corregir formato común de Ecuador
            if (to.length === 10 && to.startsWith('09')) {
                to = '+593' + to.substring(1);
                console.log('   Corregido a:', to);
            } else {
                return {
                    success: false,
                    error: 'Número de teléfono inválido. Use formato internacional (+593999999999)',
                    simulated: false
                };
            }
        }

        // Si no hay cliente Twilio, simular envío
        if (!client) {
            console.log('\n📱 [SIMULACIÓN] SMS:');
            console.log(`   📱 Para: ${to}`);
            console.log(`   📝 Mensaje: ${finalMessage}`);
            console.log(`   📊 Longitud: ${finalMessage.length} caracteres`);
            console.log(`   ⏱️  Timestamp: ${new Date().toLocaleString('es-EC')}`);
            console.log(`   ℹ️  Modo: SIMULACIÓN (no se envió SMS real)\n`);

            return {
                success: true,
                simulated: true,
                to,
                message: finalMessage,
                template: template || 'personalizado',
                timestamp: new Date().toISOString()
            };
        }

        // Enviar SMS real con Twilio
        console.log(`📱 Enviando SMS a ${to}...`);

        const result = await client.messages.create({
            body: finalMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        console.log(`✅ SMS enviado correctamente a ${to}:`, result.sid);
        console.log(`   Status: ${result.status}`);
        console.log(`   Fecha: ${new Date().toLocaleString('es-EC')}`);

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            simulated: false,
            to,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Error enviando SMS:', error.message);

        // Fallback detallado
        console.log('📱 [FALLBACK] Simulando SMS por error:');
        console.log(`   Para: ${to}`);
        console.log(`   Mensaje: ${message || 'Sin mensaje'}`);
        console.log(`   Error: ${error.message}`);

        return {
            success: false,
            error: error.message,
            simulated: true,
            fallback: true,
            to,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Función para verificar estado de Twilio
 * @returns {object} Estado actual del servicio SMS
 */
const getSMSStatus = () => {
    return {
        configurado: !!client,
        modoSimulacion: !client,
        accountSid: process.env.TWILIO_ACCOUNT_SID ?
            `${process.env.TWILIO_ACCOUNT_SID.substring(0, 5)}...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : 'no-configurado',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'no-configurado',
        timestamp: new Date().toISOString()
    };
};

/**
 * Función para enviar SMS con plantilla predefinida
 * @param {string} to - Número de teléfono
 * @param {string} templateName - Nombre de la plantilla
 * @param {object} data - Datos para la plantilla
 */
const sendTemplateSMS = async (to, templateName, data) => {
    return sendSMS(to, null, templateName, data);
};

/**
 * Función para enviar SMS a múltiples destinatarios
 * @param {Array<string>} recipients - Lista de números
 * @param {string} message - Mensaje
 * @param {string} templateName - Plantilla (opcional)
 * @param {object} data - Datos (opcional)
 */
const sendBulkSMS = async (recipients, message, templateName = null, data = null) => {
    const results = [];

    for (const to of recipients) {
        const result = await sendSMS(to, message, templateName, data);
        results.push(result);

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const exitosos = results.filter(r => r.success).length;
    const fallidos = results.filter(r => !r.success).length;

    console.log(`\n📊 RESUMEN DE ENVÍO MASIVO:`);
    console.log(`   Total: ${recipients.length}`);
    console.log(`   ✅ Exitosos: ${exitosos}`);
    console.log(`   ❌ Fallidos: ${fallidos}`);

    return {
        success: fallidos === 0,
        results,
        estadisticas: {
            total: recipients.length,
            exitosos,
            fallidos
        }
    };
};

module.exports = {
    sendSMS,
    sendTemplateSMS,
    sendBulkSMS,
    smsTemplates,
    getSMSStatus
};