// backend/check-data.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const FormaPago = require('./src/models/FormaPago');

async function checkData() {
    try {
        const mongoURI = 'mongodb://localhost:27017/aperturas_kfc';
        console.log(`Conectando a: ${mongoURI}`);
        await mongoose.connect(mongoURI);

        const db = mongoose.connection.db;
        console.log(`📚 Base de datos: ${db.databaseName}`);

        // Verificar colecciones
        const collections = await db.listCollections().toArray();
        console.log('📚 Colecciones:', collections.map(c => c.name));

        // Contar documentos
        const total = await FormaPago.countDocuments();
        console.log(`📊 Total documentos: ${total}`);

        // Contar por cadena
        const cadenas = ['2', '5', '8', '9', '10', '12', '14', '16'];
        for (const cadenaId of cadenas) {
            const count = await FormaPago.countDocuments({ cadenaId });
            console.log(`   Cadena ${cadenaId}: ${count} formas de pago`);
        }

        // Mostrar muestra cadena 10
        const muestra = await FormaPago.find({ cadenaId: '10' }).limit(10);
        console.log('\n📋 Muestra cadena 10:');
        muestra.forEach(f => console.log(`   - ${f.nombre}`));

        await mongoose.disconnect();
        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkData();