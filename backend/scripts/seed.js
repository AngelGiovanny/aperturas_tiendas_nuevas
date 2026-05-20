require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Tienda = require('../src/models/Tienda');
const Proceso = require('../src/models/Proceso');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('🌱 Sembrando base de datos...');

        // Limpiar datos existentes
        await User.deleteMany({});
        await Tienda.deleteMany({});
        await Proceso.deleteMany({});

        // Crear usuarios de prueba
        const users = [
            {
                nombre: 'Administrador KFC',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin',
                area: 'administracion',
                telefono: '+593958603424'
            },
            {
                nombre: 'David Beltran',
                email: 'david.beltran@kfc.com.ec',
                password: 'Operaciones123',
                role: 'operaciones',
                area: 'operaciones',
                telefono: '+593987654321'
            },
            {
                nombre: 'Carlos Velastegui',
                email: 'carlos.velastegui@kfc.com.ec',
                password: 'IT2026',
                role: 'it',
                area: 'infraestructura',
                telefono: '+593912345678'
            },
            {
                nombre: 'Luis Suarez',
                email: 'luis.suarez@kfc.com.ec',
                password: 'DSI2026',
                role: 'dsi',
                area: 'desarrollo',
                telefono: '+593923456789'
            },
            {
                nombre: 'Byron Morales',
                email: 'byron.morales@kfc.com.ec',
                password: 'CX2026',
                role: 'cx',
                area: 'cx',
                telefono: '+593934567890'
            },
            {
                nombre: 'Jonathan Zurita',
                email: 'jonathan.zurita@kfc.com.ec',
                password: 'Trade2026',
                role: 'trade',
                area: 'trade',
                telefono: '+593945678901'
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ ${createdUsers.length} usuarios creados`);

        // Crear tienda de prueba
        const tienda = await Tienda.create({
            codigo: 'K192',
            nombre: 'KFC Samborondón',
            direccion: {
                calle: 'Av. León Febres Cordero',
                ciudad: 'Guayaquil',
                provincia: 'Guayas',
                codigoPostal: '090902'
            },
            localidad: 'SAMBORONDON',
            categoria: 'KFC - GYE',
            tipoServicio: 'IL',
            ruc: '1791415132001',
            empresa: 'INT FOOD SERVICES CORP SA',
            telefono: '23955400',
            fechaAperturaPlanificada: new Date('2026-03-15'),
            estadoGeneral: 'pendiente',
            creadoPor: createdUsers[0]._id,
            responsables: {
                cx: createdUsers[4]._id,
                operaciones: createdUsers[1]._id
            }
        });

        console.log(`✅ Tienda de prueba creada: ${tienda.codigo}`);

        console.log('\n🎉 Base de datos sembrada exitosamente!');
        console.log('\n📝 Credenciales de acceso:');
        console.log(`   Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
        console.log('   David Beltran: david.beltran@kfc.com.ec / Operaciones123');
        console.log('   Carlos Velastegui: carlos.velastegui@kfc.com.ec / IT2026');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error sembrando base de datos:', error);
        process.exit(1);
    }
};

seedDatabase();