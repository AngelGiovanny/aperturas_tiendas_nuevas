// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const procesoRoutes = require('./routes/procesoRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const formasPagoRoutes = require('./routes/formasPagoRoutes');
const pruebaRoutes = require('./routes/pruebaRoutes');
const implementacionRoutes = require('./routes/implementacionRoutes'); // ✅ RUTA CORREGIDA

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', apiLimiter);

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tiendas', tiendaRoutes);
app.use('/api/procesos', procesoRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api', formasPagoRoutes);
app.use('/api', pruebaRoutes);
app.use('/api/implementaciones', implementacionRoutes); // ✅ RUTA DE IMPLEMENTACIONES

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Aperturas KFC funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV
    });
});

// 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;