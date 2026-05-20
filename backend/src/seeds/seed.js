// backend/scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tienda = require('../models/Tienda');
const Proceso = require('../models/Proceso');
require('dotenv').config();

const usuariosDemo = [
    // Usuario Admin Master existente (KFC)
    {
        nombre: 'Angel',
        apellido: 'Gualotuna',
        email: 'angel.gualotuna@kfc.com.ec',
        password: 'AdminKFC2026!',
        role: 'admin_master',
        area: 'administracion',
        telefono: '+593958603424',
        debeCambiarPassword: false,
        passwordTemporal: false
    },
    // ✅ NUEVO USUARIO MASTER (Personal para pruebas)
    {
        nombre: 'Giovanny',
        apellido: 'Administrador',
        email: 'giovanny1104angel@gmail.com',
        password: 'AdminPersonal2026!',
        role: 'admin_master',
        area: 'administracion',
        telefono: '+593999999999',
        debeCambiarPassword: false,
        passwordTemporal: false
    },
    // Usuarios de prueba
    {
        nombre: 'Operaciones',
        apellido: 'Principal',
        email: 'operaciones@kfc.com.ec',
        password: 'Operaciones2025!',
        role: 'operaciones',
        area: 'operaciones',
        telefono: '+593987654321',
        debeCambiarPassword: true,
        passwordTemporal: true
    },
    {
        nombre: 'IT',
        apellido: 'Manager',
        email: 'it@kfc.com.ec',
        password: 'IT2025!',
        role: 'it',
        area: 'it',
        telefono: '+593912345678',
        debeCambiarPassword: true,
        passwordTemporal: true
    },
    {
        nombre: 'DSI',
        apellido: 'Principal',
        email: 'dsi@kfc.com.ec',
        password: 'DSI2025!',
        role: 'dsi',
        area: 'dsi',
        telefono: '+593923456789',
        debeCambiarPassword: true,
        passwordTemporal: true
    },
    {
        nombre: 'CX',
        apellido: 'Principal',
        email: 'cx@kfc.com.ec',
        password: 'CX2025!',
        role: 'cx',
        area: 'cx',
        telefono: '+593934567890',
        debeCambiarPassword: true,
        passwordTemporal: true
    }
];

const tiendasDemo = [
    {
        codigo: 'K125',
        nombre: 'Quitumbe',
        cadena: 'KFC',
        estadoGeneral: 'en_proceso',
        fechaAperturaPlanificada: '2024-04-15',
        direccion: {
            calle: 'Av. Quitumbe Ñan',
            ciudad: 'Quito',
            provincia: 'Pichincha'
        },
        progreso: 65,
        tipoServicio: 'Fast Food'
    },
    {
        codigo: 'CK06',
        nombre: 'Santa María',
        cadena: 'KFC',
        estadoGeneral: 'pendiente',
        fechaAperturaPlanificada: '2024-05-20',
        direccion: {
            calle: 'Av. Santa María',
            ciudad: 'Quito',
            provincia: 'Pichincha'
        },
        progreso: 25,
        tipoServicio: 'Fast Food'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 Conectado a MongoDB');

        // Limpiar base de datos
        await User.deleteMany({});
        await Tienda.deleteMany({});
        await Proceso.deleteMany({});

        console.log('🗑️  Colecciones limpiadas');

        // Crear usuarios
        const usuariosCreados = [];
        for (const usuario of usuariosDemo) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(usuario.password, salt);

            const nuevoUsuario = await User.create({
                ...usuario,
                password: hashedPassword
            });
            usuariosCreados.push(nuevoUsuario);
            console.log(`✅ Usuario creado: ${usuario.email} (${usuario.role})`);
        }

        // Crear tiendas
        for (const tienda of tiendasDemo) {
            await Tienda.create({
                ...tienda,
                creadoPor: usuariosCreados[0]._id,
                responsable: usuariosCreados[2]._id,
                responsables: {
                    operaciones: usuariosCreados[2]._id,
                    it: usuariosCreados[3]._id,
                    dsi: usuariosCreados[4]._id,
                    cx: usuariosCreados[5]._id
                }
            });
            console.log(`✅ Tienda creada: ${tienda.codigo}`);
        }

        console.log('\n🎉 Base de datos poblada exitosamente!');
        console.log('\n📋 CREDENCIALES DE ACCESO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👑 ADMIN MASTER (KFC):');
        console.log(`   Email: angel.gualotuna@kfc.com.ec`);
        console.log(`   Password: AdminKFC2026!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👑 ADMIN MASTER (PERSONAL - PRUEBAS):');
        console.log(`   Email: giovanny1104angel@gmail.com`);
        console.log(`   Password: AdminPersonal2026!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👥 USUARIOS DE PRUEBA:');
        console.log(`   operaciones@kfc.com.ec / Operaciones2025!`);
        console.log(`   it@kfc.com.ec / IT2025!`);
        console.log(`   dsi@kfc.com.ec / DSI2025!`);
        console.log(`   cx@kfc.com.ec / CX2025!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error poblando base de datos:', error);
        process.exit(1);
    }
};

seedDatabase();