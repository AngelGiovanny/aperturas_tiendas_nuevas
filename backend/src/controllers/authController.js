// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/emailService');

console.log('📦 Controlador de autenticación cargado');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Admin
exports.register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, role, area, telefono } = req.body;

        // Validar campos requeridos
        if (!nombre || !email || !password || !role || !area || !telefono) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Verificar si usuario existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const user = await User.create({
            nombre,
            apellido: apellido || '',
            email,
            password: hashedPassword,
            role,
            area,
            telefono,
            passwordTemporal: true,
            debeCambiarPassword: true,
            activo: true
        });

        // Enviar email de bienvenida (con try-catch para no bloquear)
        try {
            await sendEmail({
                email: user.email,
                subject: 'Bienvenido al Sistema de Aperturas KFC',
                html: `
                    <h1>Bienvenido ${user.nombre}</h1>
                    <p>Tu cuenta ha sido creada exitosamente.</p>
                    <p><strong>Rol:</strong> ${user.role}</p>
                    <p><strong>Área:</strong> ${user.area}</p>
                    <p><strong>Teléfono:</strong> ${user.telefono}</p>
                    <p><strong>Contraseña temporal:</strong> ${password}</p>
                    <p>Debes cambiar tu contraseña en el primer inicio de sesión.</p>
                `
            });
        } catch (emailError) {
            console.error('Error enviando email:', emailError.message);
            // No fallar el registro por error de email
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: {
                ...userResponse,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('❌ Error en register:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`🔍 Intento de login: ${email}`);

        // Validar que existen los campos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Por favor ingrese email y contraseña'
            });
        }

        // Buscar usuario con password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`❌ Usuario no encontrado: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        console.log(`🔐 Comparación de contraseña para ${email}: ${isMatch ? '✅ exitosa' : '❌ fallida'}`);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        if (!user.activo) {
            console.log(`❌ Usuario inactivo: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada. Contacte al administrador.'
            });
        }

        // Actualizar último acceso
        await User.updateOne(
            { _id: user._id },
            { $set: { ultimoAcceso: new Date() } }
        );

        console.log(`✅ Login exitoso: ${email}`);

        const userResponse = {
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            role: user.role,
            area: user.area,
            telefono: user.telefono,
            passwordTemporal: user.passwordTemporal,
            debeCambiarPassword: user.debeCambiarPassword || false,
            activo: user.activo
        };

        res.json({
            success: true,
            data: {
                ...userResponse,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Obtener perfil actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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
        console.error('❌ Error en getMe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// =============================================
// ✅ ÚNICA FUNCIÓN CORREGIDA (el resto está IGUAL)
// =============================================
// @desc    Cambiar contraseña
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        // ✅ CORRECCIÓN: Usar solo newPassword (sin currentPassword)
        const { newPassword } = req.body;

        console.log(`🔐 Cambiando contraseña para usuario: ${req.user.email}`);

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Por favor ingrese la nueva contraseña'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.passwordTemporal = false;
        user.debeCambiarPassword = false;
        await user.save();

        console.log(`✅ Contraseña actualizada para: ${user.email}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en changePassword:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
// =============================================

// @desc    Cambiar rol de usuario
// @route   PUT /api/auth/change-role/:id
// @access  Admin
exports.changeRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                error: 'Por favor ingrese el nuevo rol'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        console.log(`✅ Rol actualizado para ${user.email}: ${role}`);

        res.json({
            success: true,
            data: user,
            message: `Rol actualizado a ${role}`
        });
    } catch (error) {
        console.error('❌ Error en changeRole:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

console.log('✅ Controlador de autenticación configurado correctamente');