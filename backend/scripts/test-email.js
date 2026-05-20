// backend/scripts/test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('📧 Probando configuración de email...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`📧 EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`📧 EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Sistema Aperturas KFC" <${process.env.EMAIL_USER}>`,
            to: 'giovanny1104angel@gmail.com',
            subject: '🔧 Prueba de configuración - Sistema Aperturas KFC',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Prueba Exitosa</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
                        .header { background: #cc0000; color: white; padding: 10px; text-align: center; }
                        .content { padding: 20px; border: 1px solid #ddd; }
                        .success { color: green; font-size: 48px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Sistema Aperturas KFC</h1>
                        </div>
                        <div class="content">
                            <div class="success">✅</div>
                            <h2 style="text-align: center;">Configuración Exitosa</h2>
                            <p>El sistema de correos del Sistema de Aperturas KFC funciona correctamente.</p>
                            <p><strong>Email configurado:</strong> ${process.env.EMAIL_USER}</p>
                            <p><strong>Destinatario de prueba:</strong> giovanny1104angel@gmail.com</p>
                            <hr>
                            <p><small>⚠️ Pruebas de sistema en desarrollo - Ignorar este correo.</small></p>
                            <p><small>📅 Fecha: ${new Date().toLocaleString()}</small></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('\n✅ CORREO ENVIADO EXITOSAMENTE!');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📧 Enviado a: giovanny1104angel@gmail.com`);
        console.log(`📧 Desde: ${process.env.EMAIL_USER}`);

    } catch (error) {
        console.error('\n❌ ERROR ENVIANDO CORREO:');
        console.error(`   ${error.message}`);
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('   1. Verifica que EMAIL_USER sea correcto');
        console.log('   2. Verifica que EMAIL_PASS sea la contraseña de aplicación (16 caracteres con espacios)');
        console.log('   3. Asegúrate de tener "Verificación en dos pasos" activada');
        console.log('   4. Revisa que la cuenta de Gmail no tenga restricciones de seguridad');
    }
}

testEmail();