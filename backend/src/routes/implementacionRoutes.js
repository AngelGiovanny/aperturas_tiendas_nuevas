// backend/routes/implementacionRoutes.js
const express = require('express');
const router = express.Router();
const {
    getImplementaciones,
    getImplementacion,
    createImplementacion,
    updateImplementacion,
    deleteImplementacion,
    cambiarEstadoImplementacion
} = require('../controllers/implementacionController');
const { auth, authorize } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas principales
router.get('/', getImplementaciones);
router.post('/', createImplementacion);
router.get('/:id', getImplementacion);
router.put('/:id', updateImplementacion);
router.delete('/:id', authorize('admin', 'admin_master'), deleteImplementacion);
router.patch('/:id/estado', cambiarEstadoImplementacion);

module.exports = router;