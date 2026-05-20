// backend/scripts/actualizarCadenaUsuarios.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aperturas_kfc';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function actualizarUsuarios() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB:', MONGO_URI);

        // Agregar campo cadenaAsignada a todos los usuarios que no lo tienen
        const result = await User.updateMany(
            { cadenaAsignada: { $exists: false } },
            { $set: { cadenaAsignada: 'TODAS' } }
        );
        console.log(`✅ ${result.modifiedCount} usuarios actualizados con cadenaAsignada`);

        // Verificar resultados
        const users = await User.find({}, 'nombre email cadenaAsignada');
        console.log(`\n📋 Total usuarios en BD: ${users.length}`);
        users.forEach(u => console.log(`   - ${u.email} -> Cadena: ${u.cadenaAsignada || 'TODAS'}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

actualizarUsuarios();