// backend/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Obtener todos los usuarios (con soporte para all=true)
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, area, search, all } = req.query;

        let query = {};

        if (role) query.role = role;
        if (area) query.area = area;
        if (search) {
            query.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Si all=true, traer TODOS los usuarios sin paginación
        if (all === 'true') {
            const users = await User.find(query)
                .select('-password')
                .sort('-createdAt');

            console.log(`✅ Enviando TODOS los usuarios: ${users.length}`);

            return res.json({
                success: true,
                count: users.length,
                data: users
            });
        }

        // Si no, usar paginación normal
        const users = await User.find(query)
            .select('-password')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort('-createdAt');

        const total = await User.countDocuments(query);

        console.log(`📊 Página ${page}: Enviando ${users.length} de ${total} usuarios`);

        res.json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: users
        });
    } catch (error) {
        console.error('Error en getUsers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error en getUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Crear usuario
// @route   POST /api/users
// @access  Admin
exports.createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, password, role, area, telefono, debeCambiarPassword } = req.body;

        console.log('📝 Creando usuario:', { nombre, email, role, area });

        // Validar campos requeridos
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Validar que la contraseña tenga al menos 6 caracteres
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nombre,
            apellido: apellido || '',
            email,
            password: hashedPassword,
            role: role || 'cx',
            area: area || 'cx',
            telefono: telefono || '',
            passwordTemporal: true,
            debeCambiarPassword: debeCambiarPassword !== undefined ? debeCambiarPassword : true,
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;

        console.log('✅ Usuario creado exitosamente:', email);

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en createUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Actualizar usuario (INCLUYE ACTUALIZACIÓN DE CONTRASEÑA)
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
    try {
        const { nombre, apellido, email, role, area, telefono, activo, password, debeCambiarPassword } = req.body;

        console.log('🔄 Actualizando usuario:', { id: req.params.id, email, tienePassword: !!password });

        const updateData = {
            nombre,
            apellido,
            email,
            role,
            area,
            telefono,
            activo,
            updatedAt: new Date()
        };

        // ✅ IMPORTANTE: Si se envía una nueva contraseña, hashearla
        if (password && password.trim() !== '') {
            console.log('🔐 Actualizando contraseña para usuario:', email);
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Si se envía debeCambiarPassword
        if (debeCambiarPassword !== undefined) {
            updateData.debeCambiarPassword = debeCambiarPassword;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        console.log('✅ Usuario actualizado:', email);

        res.json({
            success: true,
            data: user,
            message: 'Usuario actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Eliminar usuario
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        console.log('✅ Usuario eliminado:', user.email);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener usuarios por área
// @route   GET /api/users/area/:area
// @access  Private
exports.getUsersByArea = async (req, res) => {
    try {
        const users = await User.find({
            area: req.params.area,
            activo: true
        }).select('-password');

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error en getUsersByArea:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Asignar usuario CX aleatorio
// @route   GET /api/users/assign-cx
// @access  Private
exports.assignCXUser = async (req, res) => {
    try {
        const cxUsers = await User.find({
            role: 'cx',
            activo: true
        }).select('-password');

        if (cxUsers.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No hay usuarios CX disponibles'
            });
        }

        const randomIndex = Math.floor(Math.random() * cxUsers.length);
        const assignedUser = cxUsers[randomIndex];

        res.json({
            success: true,
            data: assignedUser
        });
    } catch (error) {
        console.error('Error en assignCXUser:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Activar/Desactivar usuario
// @route   PUT /api/users/:id/toggle-active
// @access  Admin
exports.toggleUserActive = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        user.activo = !user.activo;
        await user.save();

        console.log(`✅ Usuario ${user.activo ? 'activado' : 'desactivado'}:`, user.email);

        res.json({
            success: true,
            data: user,
            message: `Usuario ${user.activo ? 'activado' : 'desactivado'} exitosamente`
        });
    } catch (error) {
        console.error('Error en toggleUserActive:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Restablecer contraseña (ruta específica)
// @route   POST /api/users/:id/reset-password
// @access  Admin
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevaPassword } = req.body;

        if (!nuevaPassword || nuevaPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

        user.password = hashedPassword;
        user.debeCambiarPassword = true;
        user.passwordTemporal = true;
        await user.save();

        console.log(`✅ Contraseña restablecida para: ${user.email}`);

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente',
            data: { email: user.email }
        });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};