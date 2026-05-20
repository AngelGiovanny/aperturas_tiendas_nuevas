// backend/scripts/crearUsuariosPorCadena.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aperturas_kfc';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const usuariosPorCadena = [
    // JUAN VALDEZ
    { nombre: 'Maria Augusta', apellido: 'Redroban', email: 'maugusta.redroban@kfc.com.ec', cadena: 'JUAN_VALDEZ', area: 'marketing', role: 'marketing', telefono: '0999999991' },
    { nombre: 'David', apellido: 'Bastidas', email: 'david.bastidas@kfc.com.ec', cadena: 'JUAN_VALDEZ', area: 'marketing', role: 'marketing', telefono: '0999999992' },
    { nombre: 'Yandri', apellido: 'Ortiz', email: 'yandri.ortiz@kfc.com.ec', cadena: 'JUAN_VALDEZ', area: 'marketing', role: 'marketing', telefono: '0999999993' },
    // POLLO GUS
    { nombre: 'Karla', apellido: 'Cedeño', email: 'karla.cedeno@kfc.com.ec', cadena: 'GUS', area: 'marketing', role: 'marketing', telefono: '0999999994' },
    // MENESTRAS DEL NEGRO
    { nombre: 'Carolina', apellido: 'Bucheli', email: 'carolina.bucheli@kfc.com.ec', cadena: 'MENESTRAS', area: 'marketing', role: 'marketing', telefono: '0999999995' },
    { nombre: 'Stefania', apellido: 'Hernandez', email: 'stefania.hernandez@kfc.com.ec', cadena: 'MENESTRAS', area: 'marketing', role: 'marketing', telefono: '0999999996' },
    { nombre: 'Genesis', apellido: 'Mora', email: 'genesis.mora@kfc.com.ec', cadena: 'MENESTRAS', area: 'marketing', role: 'marketing', telefono: '0999999997' },
    // CAJUN
    { nombre: 'Diana', apellido: 'Olmedo', email: 'diana.olmedo@kfc.com.ec', cadena: 'CAJUN', area: 'marketing', role: 'marketing', telefono: '0999999998' },
    // AMERICAN DELI
    { nombre: 'Andres', apellido: 'Marriott', email: 'andres.marriott@kfc.com.ec', cadena: 'AMERICAN_DELI', area: 'marketing', role: 'marketing', telefono: '0999999999' },
    // EL ESPAÑOL
    { nombre: 'Daniella', apellido: 'Oquendo', email: 'daniella.oquendo@kfc.com.ec', cadena: 'ESPANOL', area: 'marketing', role: 'marketing', telefono: '0999999910' },
    // CINNABON & BASKIN
    { nombre: 'Ana', apellido: 'Moncayo', email: 'ana.moncayo@kfc.com.ec', cadena: 'BASKIN_ROBBINS', area: 'marketing', role: 'marketing', telefono: '0999999911' },
    // TROPI BURGER
    { nombre: 'Roy', apellido: 'Kurze', email: 'roy.kurze@kfc.com.ec', cadena: 'TROPI', area: 'marketing', role: 'marketing', telefono: '0999999912' },
    // IL CAPPO
    { nombre: 'Fatima Nicole', apellido: 'Menendez', email: 'fatima.menendez@kfc.com.ec', cadena: 'IL_CAPPO', area: 'marketing', role: 'marketing', telefono: '0999999913' },
    // KFC
    { nombre: 'Mabe', apellido: 'Padilla', email: 'mbeatriz.padilla@kfc.com.ec', cadena: 'KFC', area: 'marketing', role: 'marketing', telefono: '0999999914' },
    { nombre: 'Melany', apellido: 'Martinez', email: 'melany.martinez@kfc.com.ec', cadena: 'KFC', area: 'marketing', role: 'marketing', telefono: '0999999915' },
];

const generarContrasenaTemporal = (nombre, apellido) => {
    const nombreLimpiado = nombre.toLowerCase().replace(/[^a-z]/g, '');
    const apellidoLimpiado = apellido.toLowerCase().replace(/[^a-z]/g, '');
    return apellidoLimpiado ? `${nombreLimpiado}.${apellidoLimpiado}` : nombreLimpiado;
};

async function crearUsuarios() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB:', MONGO_URI);

        let creados = 0;
        let existentes = 0;

        for (const usuario of usuariosPorCadena) {
            const existingUser = await User.findOne({ email: usuario.email });
            const contrasenaTemporal = generarContrasenaTemporal(usuario.nombre, usuario.apellido);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasenaTemporal, salt);

            if (existingUser) {
                console.log(`⚠️ Usuario ya existe: ${usuario.email} - Saltando...`);
                existentes++;
            } else {
                const newUser = new User({
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    password: hashedPassword,
                    role: usuario.role,
                    area: usuario.area,
                    telefono: usuario.telefono,
                    cadenaAsignada: usuario.cadena,
                    debeCambiarPassword: true,
                    passwordTemporal: true,
                    activo: true,
                });
                await newUser.save();
                console.log(`✅ Creado: ${usuario.email} | Cadena: ${usuario.cadena} | Contraseña: ${contrasenaTemporal}`);
                creados++;
            }
        }

        console.log(`\n🎉 Resumen:`);
        console.log(`   - Usuarios creados: ${creados}`);
        console.log(`   - Usuarios existentes: ${existentes}`);
        console.log(`   - Total procesados: ${usuariosPorCadena.length}`);

        // Mostrar todos los usuarios finales
        const totalUsers = await User.countDocuments();
        console.log(`\n📋 Total usuarios en BD: ${totalUsers}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

crearUsuarios();