// backend/scripts/insert-all-formas-pago.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const FormaPago = require('../src/models/FormaPago');

// TODAS las formas de pago para todas las cadenas (SIN IDs DUPLICADOS)
const formasPagoPorCadena = {
    // ==================== AMERICAN DELI PATIOS (cdn_id = 2) ====================
    "2": [
        { id: "c1b49ebc-90d7-e611-80c6-000d3a330947", nombre: "FALTANTE DE CAJA CXC", codigo: "114", orden: 0 },
        { id: "c2b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO EXTERNO", codigo: "197", orden: 1 },
        { id: "c3b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INTERDPT", codigo: "197", orden: 2 },
        { id: "c4b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INVENTARIO", codigo: "197", orden: 3 },
        { id: "c5b49ebc-90d7-e611-80c6-000d3a330947", nombre: "PRODUCTO CXC", codigo: "", orden: 4 },
        { id: "c6b49ebc-90d7-e611-80c6-000d3a330947", nombre: "PAYPHONE", codigo: "", orden: 5 },
        { id: "c7b49ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION FUENTE", codigo: "168", orden: 6 },
        { id: "c8b49ebc-90d7-e611-80c6-000d3a330947", nombre: "DEBITO", codigo: "322", orden: 7 },
        { id: "c9b49ebc-90d7-e611-80c6-000d3a330947", nombre: "VISA", codigo: "34", orden: 8 },
        { id: "cab49ebc-90d7-e611-80c6-000d3a330947", nombre: "TARJETAS", codigo: "322", orden: 9 },
        { id: "cbb49ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION IVA", codigo: "217", orden: 10 },
        { id: "ccb49ebc-90d7-e611-80c6-000d3a330947", nombre: "ALIA", codigo: "66", orden: 11 },
        { id: "cdb49ebc-90d7-e611-80c6-000d3a330947", nombre: "DINERS CLUB", codigo: "82", orden: 12 },
        { id: "ceb49ebc-90d7-e611-80c6-000d3a330947", nombre: "EMPLEADO", codigo: "197", orden: 13 },
        { id: "cfb49ebc-90d7-e611-80c6-000d3a330947", nombre: "DISCOVER", codigo: "537", orden: 14 },
        { id: "d0b49ebc-90d7-e611-80c6-000d3a330947", nombre: "MASTERCARD", codigo: "18", orden: 15 },
        { id: "d1b49ebc-90d7-e611-80c6-000d3a330947", nombre: "AMERICAN EXPRESS", codigo: "50", orden: 16 },
        { id: "d2b49ebc-90d7-e611-80c6-000d3a330947", nombre: "EFECTIVO", codigo: "2", orden: 17 },
        { id: "d3b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CHEQUES", codigo: "98", orden: 18 }
    ],

    // ==================== CAJUN (cdn_id = 5) ====================
    "5": [
        { id: "e7b49ebc-90d7-e611-80c6-000d3a330947", nombre: "FALTANTE DE CAJA CXC", codigo: "117", orden: 0 },
        { id: "e8b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO EXTERNO", codigo: "200", orden: 1 },
        { id: "e9b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INTERDPT", codigo: "200", orden: 2 },
        { id: "eab49ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INVENTARIO", codigo: "200", orden: 3 },
        { id: "ebb49ebc-90d7-e611-80c6-000d3a330947", nombre: "PRODUCTO CXC", codigo: "200", orden: 4 },
        { id: "ecb49ebc-90d7-e611-80c6-000d3a330947", nombre: "PAYPHONE", codigo: "", orden: 5 },
        { id: "edb49ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION FUENTE", codigo: "171", orden: 6 },
        { id: "eeb49ebc-90d7-e611-80c6-000d3a330947", nombre: "DEBITO", codigo: "325", orden: 7 },
        { id: "efb49ebc-90d7-e611-80c6-000d3a330947", nombre: "VISA", codigo: "37", orden: 8 },
        { id: "f0b49ebc-90d7-e611-80c6-000d3a330947", nombre: "TARJETAS", codigo: "85", orden: 9 },
        { id: "f1b49ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION IVA", codigo: "220", orden: 10 },
        { id: "f2b49ebc-90d7-e611-80c6-000d3a330947", nombre: "ALIA", codigo: "69", orden: 11 },
        { id: "f3b49ebc-90d7-e611-80c6-000d3a330947", nombre: "DINERS CLUB", codigo: "85", orden: 12 },
        { id: "f4b49ebc-90d7-e611-80c6-000d3a330947", nombre: "EMPLEADO", codigo: "117", orden: 13 },
        { id: "f5b49ebc-90d7-e611-80c6-000d3a330947", nombre: "DISCOVER", codigo: "539", orden: 14 },
        { id: "f6b49ebc-90d7-e611-80c6-000d3a330947", nombre: "MASTERCARD", codigo: "21", orden: 15 },
        { id: "f7b49ebc-90d7-e611-80c6-000d3a330947", nombre: "AMERICAN EXPRESS", codigo: "53", orden: 16 },
        { id: "f8b49ebc-90d7-e611-80c6-000d3a330947", nombre: "EFECTIVO", codigo: "5", orden: 17 },
        { id: "f9b49ebc-90d7-e611-80c6-000d3a330947", nombre: "CHEQUES", codigo: "101", orden: 18 }
    ],

    // ==================== EL ESPAÑOL (cdn_id = 8) ====================
    "8": [
        { id: "20b59ebc-90d7-e611-80c6-000d3a330947", nombre: "FALTANTE DE CAJA CXC", codigo: "120", orden: 0 },
        { id: "21b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO EXTERNO", codigo: "203", orden: 1 },
        { id: "22b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INTERDPT", codigo: "203", orden: 2 },
        { id: "23b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INVENTARIO", codigo: "203", orden: 3 },
        { id: "24b59ebc-90d7-e611-80c6-000d3a330947", nombre: "PRODUCTO CXC", codigo: "203", orden: 4 },
        { id: "25b59ebc-90d7-e611-80c6-000d3a330947", nombre: "PAYPHONE", codigo: "", orden: 5 },
        { id: "26b59ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION FUENTE", codigo: "174", orden: 6 },
        { id: "27b59ebc-90d7-e611-80c6-000d3a330947", nombre: "DEBITO", codigo: "328", orden: 7 },
        { id: "28b59ebc-90d7-e611-80c6-000d3a330947", nombre: "VISA", codigo: "40", orden: 8 },
        { id: "29b59ebc-90d7-e611-80c6-000d3a330947", nombre: "TARJETAS", codigo: "328", orden: 9 },
        { id: "2ab59ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION IVA", codigo: "223", orden: 10 },
        { id: "2bb59ebc-90d7-e611-80c6-000d3a330947", nombre: "ALIA", codigo: "72", orden: 11 },
        { id: "2cb59ebc-90d7-e611-80c6-000d3a330947", nombre: "DINERS CLUB", codigo: "88", orden: 12 },
        { id: "2db59ebc-90d7-e611-80c6-000d3a330947", nombre: "EMPLEADO", codigo: "120", orden: 13 },
        { id: "2eb59ebc-90d7-e611-80c6-000d3a330947", nombre: "DISCOVER", codigo: "542", orden: 14 },
        { id: "2fb59ebc-90d7-e611-80c6-000d3a330947", nombre: "MASTERCARD", codigo: "136", orden: 15 },
        { id: "30b59ebc-90d7-e611-80c6-000d3a330947", nombre: "AMERICAN EXPRESS", codigo: "56", orden: 16 },
        { id: "31b59ebc-90d7-e611-80c6-000d3a330947", nombre: "EFECTIVO", codigo: "8", orden: 17 },
        { id: "32b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CHEQUES", codigo: "104", orden: 18 }
    ],

    // ==================== GUS (cdn_id = 9) ====================
    "9": [
        { id: "33b59ebc-90d7-e611-80c6-000d3a330947", nombre: "FALTANTE DE CAJA CXC", codigo: "121", orden: 0 },
        { id: "34b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO EXTERNO", codigo: "204", orden: 1 },
        { id: "35b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INTERDPT", codigo: "204", orden: 2 },
        { id: "36b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CREDITO INVENTARIO", codigo: "204", orden: 3 },
        { id: "37b59ebc-90d7-e611-80c6-000d3a330947", nombre: "PRODUCTO CXC", codigo: "", orden: 4 },
        { id: "38b59ebc-90d7-e611-80c6-000d3a330947", nombre: "PAYPHONE", codigo: "", orden: 5 },
        { id: "39b59ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION FUENTE", codigo: "175", orden: 6 },
        { id: "3ab59ebc-90d7-e611-80c6-000d3a330947", nombre: "DEBITO", codigo: "329", orden: 7 },
        { id: "3bb59ebc-90d7-e611-80c6-000d3a330947", nombre: "VISA", codigo: "41", orden: 8 },
        { id: "3cb59ebc-90d7-e611-80c6-000d3a330947", nombre: "TARJETAS", codigo: "329", orden: 9 },
        { id: "3db59ebc-90d7-e611-80c6-000d3a330947", nombre: "RETENCION IVA", codigo: "224", orden: 10 },
        { id: "3eb59ebc-90d7-e611-80c6-000d3a330947", nombre: "ALIA", codigo: "73", orden: 11 },
        { id: "3fb59ebc-90d7-e611-80c6-000d3a330947", nombre: "DINERS CLUB", codigo: "89", orden: 12 },
        { id: "40b59ebc-90d7-e611-80c6-000d3a330947", nombre: "EMPLEADO", codigo: "204", orden: 13 },
        { id: "41b59ebc-90d7-e611-80c6-000d3a330947", nombre: "DISCOVER", codigo: "543", orden: 14 },
        { id: "42b59ebc-90d7-e611-80c6-000d3a330947", nombre: "MASTERCARD", codigo: "25", orden: 15 },
        { id: "43b59ebc-90d7-e611-80c6-000d3a330947", nombre: "AMERICAN EXPRESS", codigo: "57", orden: 16 },
        { id: "44b59ebc-90d7-e611-80c6-000d3a330947", nombre: "EFECTIVO", codigo: "9", orden: 17 },
        { id: "45b59ebc-90d7-e611-80c6-000d3a330947", nombre: "CHEQUES", codigo: "105", orden: 18 }
    ],

    // ==================== KENTUCKY FRIED CHICKEN (cdn_id = 10) ====================
    "10": [
        { id: "5656f9c5-3bd8-e611-80c6-000d3a330947", nombre: "FALTANTE DE CAJA CXC", codigo: "125", orden: 0 },
        { id: "5756f9c5-3bd8-e611-80c6-000d3a330947", nombre: "CREDITO EXTERNO", codigo: "192", orden: 1 },
        { id: "5856f9c5-3bd8-e611-80c6-000d3a330947", nombre: "CREDITO INTERDPT", codigo: "192", orden: 2 },
        { id: "5956f9c5-3bd8-e611-80c6-000d3a330947", nombre: "CREDITO INVENTARIO", codigo: "192", orden: 3 },
        { id: "5a56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "PRODUCTO CXC", codigo: "", orden: 4 },
        { id: "5b56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "PAYPHONE", codigo: "", orden: 5 },
        { id: "5c56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "RETENCION FUENTE", codigo: "163", orden: 6 },
        { id: "5d56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "TARJETAS", codigo: "330", orden: 7 },
        { id: "5e56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "ALIA", codigo: "77", orden: 8 },
        { id: "5f56f9c5-3bd8-e611-80c6-000d3a330947", nombre: "EMPLEADO", codigo: "192", orden: 9 },
        { id: "6056f9c5-3bd8-e611-80c6-000d3a330947", nombre: "CHEQUES", codigo: "109", orden: 10 },
        { id: "ddc519ee-62ec-e511-80c5-0050568602d0", nombre: "EFECTIVO", codigo: "13", orden: 11 },
        { id: "da0a9503-85cf-e511-80c6-000d3a3261f3", nombre: "VISA", codigo: "282", orden: 12 },
        { id: "db0a9503-85cf-e511-80c6-000d3a3261f3", nombre: "AMERICAN EXPRESS", codigo: "61", orden: 13 },
        { id: "d20a9503-85cf-e511-80c6-000d3a3261f3", nombre: "DINERS CLUB", codigo: "93", orden: 14 },
        { id: "d30a9503-85cf-e511-80c6-000d3a3261f3", nombre: "DISCOVER", codigo: "544", orden: 15 },
        { id: "f10a9503-85cf-e511-80c6-000d3a3261f3", nombre: "MASTERCARD", codigo: "283", orden: 16 },
        { id: "d50a9503-85cf-e511-80c6-000d3a3261f3", nombre: "DEBITO", codigo: "330", orden: 17 }
    ],

    // ==================== JUAN VALDEZ CAFÉ (cdn_id = 12) ====================
    "12": [
        { id: "forma_12_001", nombre: "CAJA CHICA OTROS", codigo: "176", orden: 0 },
        { id: "forma_12_002", nombre: "DESCUENTOS", codigo: "569", orden: 1 },
        { id: "forma_12_003", nombre: "FIDELIZACION", codigo: "191", orden: 2 },
        { id: "forma_12_004", nombre: "CONSUMO RECARGA", codigo: "605", orden: 3 },
        { id: "forma_12_005", nombre: "RECARGA EFECTIVO", codigo: "606", orden: 4 },
        { id: "forma_12_006", nombre: "VITALITY", codigo: "191", orden: 5 },
        { id: "forma_12_007", nombre: "UBER", codigo: "191", orden: 6 },
        { id: "forma_12_008", nombre: "AGREGADOR", codigo: "191", orden: 7 },
        { id: "forma_12_009", nombre: "GLOVO", codigo: "191", orden: 8 },
        { id: "forma_12_010", nombre: "CUPON ELECTRONICO", codigo: "191", orden: 9 },
        { id: "forma_12_011", nombre: "DEBIT KUSHKI", codigo: "1559", orden: 10 },
        { id: "forma_12_012", nombre: "DINERS KUSHKI", codigo: "1533", orden: 11 },
        { id: "forma_12_013", nombre: "DISCOVER KUSHKI", codigo: "1507", orden: 12 },
        { id: "forma_12_014", nombre: "MASTERCARD KUSHKI", codigo: "1585", orden: 13 },
        { id: "forma_12_015", nombre: "VISA KUSHKI", codigo: "1611", orden: 14 },
        { id: "forma_12_016", nombre: "TARJETA SALDO", codigo: "1451", orden: 15 },
        { id: "forma_12_017", nombre: "MULTIMARCA EFECTIVO", codigo: "12", orden: 16 },
        { id: "forma_12_018", nombre: "MULTIMARCA", codigo: "191", orden: 17 },
        { id: "forma_12_019", nombre: "PEDIDOSYA", codigo: "191", orden: 18 },
        { id: "forma_12_020", nombre: "RAPPI", codigo: "191", orden: 19 },
        { id: "forma_12_021", nombre: "UNION PAY", codigo: "1376", orden: 20 },
        { id: "forma_12_022", nombre: "UBER DIRECT EFECTIVO", codigo: "191", orden: 21 },
        { id: "forma_12_023", nombre: "DEBITO PAYMENTEZ", codigo: "1743", orden: 22 },
        { id: "forma_12_024", nombre: "DINERS PAYMENTEZ", codigo: "1753", orden: 23 },
        { id: "forma_12_025", nombre: "DISCOVER PAYMENTEZ", codigo: "1754", orden: 24 },
        { id: "forma_12_026", nombre: "VISA PAYMENTEZ", codigo: "1723", orden: 25 },
        { id: "forma_12_027", nombre: "MASTERCARD PAYMENTEZ", codigo: "1724", orden: 26 },
        { id: "forma_12_028", nombre: "DEBITO PAYMENTEZ", codigo: "1725", orden: 27 }
    ],

    // ==================== DOLCE INCONTRO (cdn_id = 14) ====================
    "14": [
        { id: "forma_14_001", nombre: "FALTANTE DE CAJA CXC", codigo: "126", orden: 0 },
        { id: "forma_14_002", nombre: "CREDITO EXTERNO", codigo: "193", orden: 1 },
        { id: "forma_14_003", nombre: "CREDITO INVENTARIO", codigo: "193", orden: 2 },
        { id: "forma_14_004", nombre: "PRODUCTO CXC", codigo: "", orden: 3 },
        { id: "forma_14_005", nombre: "PAYPHONE", codigo: "251", orden: 4 },
        { id: "forma_14_006", nombre: "RETENCION FUENTE", codigo: "164", orden: 5 },
        { id: "forma_14_007", nombre: "DEBITO", codigo: "333", orden: 6 },
        { id: "forma_14_008", nombre: "VISA", codigo: "46", orden: 7 },
        { id: "forma_14_009", nombre: "TARJETAS", codigo: "333", orden: 8 },
        { id: "forma_14_010", nombre: "RETENCION IVA", codigo: "213", orden: 9 },
        { id: "forma_14_011", nombre: "ALIA", codigo: "78", orden: 10 },
        { id: "forma_14_012", nombre: "DINERS CLUB", codigo: "94", orden: 11 },
        { id: "forma_14_013", nombre: "EMPLEADO", codigo: "126", orden: 12 },
        { id: "forma_14_014", nombre: "DISCOVER", codigo: "375", orden: 13 },
        { id: "forma_14_015", nombre: "MASTERCARD", codigo: "30", orden: 14 },
        { id: "forma_14_016", nombre: "AMERICAN EXPRESS", codigo: "62", orden: 15 },
        { id: "forma_14_017", nombre: "EFECTIVO", codigo: "14", orden: 16 },
        { id: "forma_14_018", nombre: "CHEQUES", codigo: "110", orden: 17 },
        { id: "forma_14_019", nombre: "CAJA CHICA OTROS", codigo: "176", orden: 18 },
        { id: "forma_14_020", nombre: "DESCUENTOS", codigo: "569", orden: 19 },
        { id: "forma_14_021", nombre: "TARJETA SALDO", codigo: "1454", orden: 20 },
        { id: "forma_14_022", nombre: "MULTIMARCA EFECTIVO", codigo: "14", orden: 21 },
        { id: "forma_14_023", nombre: "MULTIMARCA", codigo: "193", orden: 22 },
        { id: "forma_14_024", nombre: "PEDIDOSYA", codigo: "193", orden: 23 },
        { id: "forma_14_025", nombre: "RAPPI", codigo: "195", orden: 24 },
        { id: "forma_14_026", nombre: "UNION PAY", codigo: "1393", orden: 25 },
        { id: "forma_14_027", nombre: "UBER DIRECT EFECTIVO", codigo: "193", orden: 26 },
        { id: "forma_14_028", nombre: "DEBIT KUSHKI", codigo: "1560", orden: 27 },
        { id: "forma_14_029", nombre: "DINERS KUSHKI", codigo: "1534", orden: 28 },
        { id: "forma_14_030", nombre: "DISCOVER KUSHKI", codigo: "1508", orden: 29 },
        { id: "forma_14_031", nombre: "MASTERCARD KUSHKI", codigo: "1586", orden: 30 },
        { id: "forma_14_032", nombre: "VISA KUSHKI", codigo: "1612", orden: 31 },
        { id: "forma_14_033", nombre: "DEBIT KUSHKI SMART LINK", codigo: "1700", orden: 32 },
        { id: "forma_14_034", nombre: "MASTERCARD KUSHKI SMART LINK", codigo: "1701", orden: 33 },
        { id: "forma_14_035", nombre: "VISA KUSHKI SMART LINK", codigo: "1702", orden: 34 }
    ]
};

async function insertAllFormasPago() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aperturas_kfc';
        console.log(`🔌 Conectando a MongoDB: ${mongoURI}`);
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        let totalInsertados = 0;

        for (const [cadenaId, formas] of Object.entries(formasPagoPorCadena)) {
            console.log(`\n📦 Procesando cadena ID: ${cadenaId}...`);

            // Eliminar datos existentes para esta cadena
            const deleted = await FormaPago.deleteMany({ cadenaId: cadenaId });
            console.log(`  🧹 Eliminados ${deleted.deletedCount} registros existentes`);

            // Insertar nuevos datos
            let count = 0;
            for (const fp of formas) {
                try {
                    await FormaPago.create({
                        id: fp.id,
                        nombre: fp.nombre,
                        cadenaId: cadenaId,
                        orden: fp.orden,
                        codigo: fp.codigo || '',
                        descripcion: '',
                        activo: true
                    });
                    count++;
                } catch (err) {
                    if (err.code === 11000) {
                        console.log(`  ⚠️ ID duplicado: ${fp.id} - Reemplazando...`);
                        // Si hay duplicado, actualizar en lugar de insertar
                        await FormaPago.updateOne(
                            { id: fp.id },
                            {
                                nombre: fp.nombre,
                                cadenaId: cadenaId,
                                orden: fp.orden,
                                codigo: fp.codigo || '',
                                activo: true
                            },
                            { upsert: true }
                        );
                        count++;
                    } else {
                        console.error(`  ❌ Error insertando ${fp.nombre}:`, err.message);
                    }
                }
            }

            console.log(`  ✅ Insertados/Actualizados ${count} formas de pago para cadena ${cadenaId}`);
            totalInsertados += count;
        }

        console.log(`\n✨ TOTAL PROCESADO: ${totalInsertados} formas de pago`);

        // Verificar resultado
        const total = await FormaPago.countDocuments();
        console.log(`📊 Total en base de datos: ${total}`);

        // Mostrar resumen por cadena
        const resumen = await FormaPago.aggregate([
            { $group: { _id: "$cadenaId", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        console.log('\n📋 Resumen por cadena:');
        resumen.forEach(r => {
            console.log(`  Cadena ${r._id}: ${r.count} formas de pago`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Proceso completado exitosamente');

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

insertAllFormasPago();