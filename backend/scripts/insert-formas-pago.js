// backend/scripts/insert-formas-pago.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const FormaPago = require('../src/models/FormaPago');

// Formas de pago para cadena 10 (KFC)
const formasPago = [
    { id: '2ed2a98f-a9cd-e911-80e5-000d3a019254', nombre: 'AGREGADOR' },
    { id: '5e56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'ALIA' },
    { id: 'f1626b4b-519a-f011-98e5-a8e24b9c0a4a', nombre: 'ALIA KUSHKI' },
    { id: 'e8fa48b4-529a-f011-98e5-a8e24b9c0a4a', nombre: 'ALIA PAYMENTEZ' },
    { id: 'db0a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'AMERICAN EXPRESS' },
    { id: 'c8033004-cb8c-ef11-9c36-e18191d08780', nombre: 'AMERICAN EXPRESS KUSHKI' },
    { id: 'f6e8911d-e4a1-ef11-9c36-e18191d08780', nombre: 'AMERICAN EXPRESS PAYMENTEZ' },
    { id: '5eca486b-f0f9-e611-80c6-000d3a330947', nombre: 'CAJA CHICA OTROS' },
    { id: '19c80fc1-b68f-ef11-9c36-e18191d08780', nombre: 'CAMPANIA SOLIDARIA' },
    { id: '6056f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'CHEQUES' },
    { id: '5756f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'CREDITO EXTERNO' },
    { id: '5856f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'CREDITO INTERDPT' },
    { id: '5956f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'CREDITO INVENTARIO' },
    { id: '0f937411-29e9-e911-80e8-000d3a019254', nombre: 'CUPON ELECTRONICO' },
    { id: '212703bd-58f4-ea11-80f0-000d3a019254', nombre: 'DATAFONO' },
    { id: '472f529c-1624-ef11-86d2-e177a5fa5d5a', nombre: 'DE UNA' },
    { id: '1ddbf20d-5e07-eb11-80f1-000d3a019254', nombre: 'DEBIT KUSHKI' },
    { id: 'bfab6ef7-3ec1-ef11-88d0-803c32872e3c', nombre: 'DEBIT KUSHKI SMART LINK' },
    { id: 'd50a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'DEBITO' },
    { id: '8c698b97-f992-ee11-ad36-c89665503cdf', nombre: 'DEBITO PAYMENTEZ' },
    { id: '2b359a9f-22ca-e711-80cf-000d3a330947', nombre: 'DESCUENTOS' },
    { id: 'd20a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'DINERS CLUB' },
    { id: '28fa9351-5f07-eb11-80f1-000d3a019254', nombre: 'DINERS KUSHKI' },
    { id: '0c6a0fe3-df96-ef11-9c36-e18191d08780', nombre: 'DINERS PAYMENTEZ' },
    { id: 'd30a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'DISCOVER' },
    { id: '589e08ca-5f07-eb11-80f1-000d3a019254', nombre: 'DISCOVER KUSHKI' },
    { id: '042862f8-cb22-ef11-86d2-e177a5fa5d5a', nombre: 'DISCOVER PAYMENTEZ' },
    { id: 'ddc519ee-62ec-e511-80c5-0050568602d0', nombre: 'EFECTIVO' },
    { id: '5f56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'EMPLEADO' },
    { id: '5656f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'FALTANTE DE CAJA CXC' },
    { id: '39e17491-bf17-eb11-80f1-000d3a019254', nombre: 'FIDELIZACION' },
    { id: '4e345a93-f00c-eb11-80f1-000d3a019254', nombre: 'GLOVO EFECTIVO' },
    { id: 'f10a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'MASTERCARD' },
    { id: '7200a333-6007-eb11-80f1-000d3a019254', nombre: 'MASTERCARD KUSHKI' },
    { id: 'f65e89d8-3dc1-ef11-88d0-803c32872e3c', nombre: 'MASTERCARD KUSHKI SMART LINK' },
    { id: 'c25ae165-fa92-ee11-ad36-c89665503cdf', nombre: 'MASTERCARD PAYMENTEZ' },
    { id: '57ab4a9b-e360-eb11-80f4-000d3a019254', nombre: 'MULTIMARCA' },
    { id: 'fe799e19-e460-eb11-80f4-000d3a019254', nombre: 'MULTIMARCA EFECTIVO' },
    { id: '0a6c4636-ff6a-ef11-991b-dc3b75c1ff70', nombre: 'OTRA' },
    { id: 'a29cb486-3c70-ea11-80ec-000d3a019254', nombre: 'PARA LLEVAR' },
    { id: '5b56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'PAYPHONE' },
    { id: '3592bc4e-457c-eb11-80f4-000d3a019254', nombre: 'PEDIDOSYA' },
    { id: '5a56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'PRODUCTO CXC' },
    { id: '4324eda2-bd82-eb11-80f4-000d3a019254', nombre: 'RAPPI' },
    { id: '5c56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'RETENCION FUENTE' },
    { id: 'e60a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'RETENCION IVA' },
    { id: 'baf48e20-023c-eb11-80f1-000d3a019254', nombre: 'TARJETA SALDO' },
    { id: '5d56f9c5-3bd8-e611-80c6-000d3a330947', nombre: 'TARJETAS' },
    { id: '0086f7ad-a776-e911-80e0-000d3a019254', nombre: 'UBER' },
    { id: '6dda7f43-557b-ef11-991b-ac0f91031b4c', nombre: 'UBER DIRECT EFECTIVO' },
    { id: 'd486a3d3-5856-e911-80e0-000d3a019254', nombre: 'UBER EATS' },
    { id: 'ed242e48-f10c-eb11-80f1-000d3a019254', nombre: 'UBER EFECTIVO' },
    { id: 'ff7b8331-df51-ea11-80ea-000d3a019254', nombre: 'UNION PAY' },
    { id: 'b5bdea83-539a-f011-98e5-a8e24b9c0a4a', nombre: 'UNIONPAY PAYMENTEZ' },
    { id: 'da0a9503-85cf-e511-80c6-000d3a3261f3', nombre: 'VISA' },
    { id: '9a77903e-6107-eb11-80f1-000d3a019254', nombre: 'VISA KUSHKI' },
    { id: '3dc3bf3b-3cc1-ef11-88d0-803c32872e3c', nombre: 'VISA KUSHKI SMART LINK' },
    { id: '06dcb761-f892-ee11-ad36-c89665503cdf', nombre: 'VISA PAYMENTEZ' }
];

async function insertData() {
    try {
        const mongoURI = 'mongodb://localhost:27017/aperturas_kfc';
        console.log(`Conectando a: ${mongoURI}`);
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar datos existentes para cadena 10
        await FormaPago.deleteMany({ cadenaId: '10' });
        console.log('🧹 Datos antiguos eliminados para cadena 10');

        // Insertar nuevos datos
        let count = 0;
        for (let i = 0; i < formasPago.length; i++) {
            const fp = formasPago[i];
            await FormaPago.create({
                id: fp.id,
                nombre: fp.nombre,
                cadenaId: '10',
                orden: i,
                activo: true
            });
            count++;
            if (count % 10 === 0) {
                console.log(`  Insertados ${count} de ${formasPago.length}`);
            }
        }

        console.log(`✅ Insertados ${count} formas de pago para cadena 10`);

        // Verificar
        const total = await FormaPago.countDocuments();
        console.log(`📊 Total en base de datos: ${total}`);

        const muestra = await FormaPago.find({ cadenaId: '10' }).limit(5);
        console.log('📋 Muestra:', muestra.map(f => f.nombre));

        await mongoose.disconnect();
        console.log('✨ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

insertData();