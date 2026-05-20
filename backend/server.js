const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno ANTES que nada
dotenv.config();

// IMPORTANTE: Todas las rutas deben incluir /src/
const connectDB = require('./src/config/database');  // 👈 OK
const app = require('./src/app');                    // 👈 OK
const User = require('./src/models/User');            // 👈 OK

// Conectar a MongoDB
connectDB();

// Importar jobs (monitoreo de tiempos) - también con /src/
try {
    require('./src/jobs/monitoreoTiempoJob');        // 👈 OK
    console.log('✅ Job de monitoreo cargado correctamente');
} catch (error) {
    console.log('⚠️ Job de monitoreo no encontrado (opcional)');
}

// Crear usuario admin por defecto (SOLO si no existe)
const createAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (!adminExists) {
            const adminUser = await User.create({
                nombre: 'Angel',
                apellido: 'Gualotuña',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin_master',
                area: 'administracion',
                telefono: process.env.ADMIN_PHONE || '+593958603424',
                activo: true,
                passwordTemporal: false
            });

            console.log(`✅ Usuario admin master creado: ${adminUser.email}`);
        } else {
            console.log(`✅ Usuario admin master ya existe: ${process.env.ADMIN_EMAIL}`);
            console.log(`   Role: ${adminExists.role}`);
            console.log(`   Área: ${adminExists.area}`);
        }
    } catch (error) {
        console.error('❌ Error creando usuario admin:', error);
    }
};

// Iniciar servidor
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`\n🚀 Servidor iniciado en modo ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📂 Estructura: backend/src/`);
    console.log(`📡 Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Tiendas: http://localhost:${PORT}/api/tiendas`);
    console.log(`   - Procesos: http://localhost:${PORT}/api/procesos`);
    console.log(`   - Usuarios: http://localhost:${PORT}/api/users`);
    console.log(`   - Notificaciones: http://localhost:${PORT}/api/notificaciones`);
    console.log(`   - Reportes: http://localhost:${PORT}/api/reportes\n`);

    // Crear admin si no existe
    await createAdminUser();
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});