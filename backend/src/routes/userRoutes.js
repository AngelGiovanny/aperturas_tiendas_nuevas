// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUsersByArea,
    assignCXUser,
    toggleUserActive,
    resetPassword  // ✅ AGREGAR ESTA IMPORTACIÓN
} = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas específicas primero (antes de las rutas con parámetros)
router.get('/assign-cx', authorize('admin', 'operaciones'), assignCXUser);
router.get('/area/:area', getUsersByArea);

// ✅ NUEVA RUTA: Restablecer contraseña (DEBE IR ANTES de /:id)
router.post('/:id/reset-password', authorize('admin', 'admin_master'), resetPassword);

// Rutas CRUD principales
router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/toggle-active', authorize('admin'), toggleUserActive);

module.exports = router;