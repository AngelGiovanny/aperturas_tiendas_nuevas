// pages/Admin/Usuarios.tsx
import React, { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { User } from '../../types'
import { usuariosService } from '../../services/usuariosService'
import {
    UserPlusIcon,
    PencilSquareIcon,
    TrashIcon,
    UserCircleIcon,
    ArrowPathIcon,
    KeyIcon,
    EnvelopeIcon,
    PhoneIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Tipos
type UserRole = 'admin' | 'admin_master' | 'operaciones' | 'it' | 'dsi' | 'cx' | 'contabilidad' | 'trade' | 'marketing' | 'mesa_servicio' | 'aperturas' | 'campo' | 'tecnico' | 'instalador' | 'soporte'
type BadgeStatus = 'default' | 'success' | 'warning' | 'error' | 'info'

// Dominio permitido
const DOMINIO_KFC = '@kfc.com.ec'

// ✅ CADENAS DISPONIBLES
const CADENAS = [
    { value: 'TODAS', label: 'Todas las cadenas' },
    { value: 'KFC', label: 'KFC' },
    { value: 'AMERICAN_DELI', label: 'American Deli' },
    { value: 'CAJUN', label: 'Cajun' },
    { value: 'ESPANOL', label: 'El Español' },
    { value: 'GUS', label: 'GUS' },
    { value: 'JUAN_VALDEZ', label: 'Juan Valdez' },
    { value: 'MENESTRAS', label: 'Menestras del Negro' },
    { value: 'TROPI', label: 'TropiBurger' },
    { value: 'IL_CAPPO', label: 'IL CAPPO' },
    { value: 'CASA_RES', label: 'Casa Res' },
    { value: 'FEDERER', label: 'Federer' },
    { value: 'BASKIN_ROBBINS', label: 'Baskin Robbins' },
    { value: 'CINNABON', label: 'Cinnabon' },
    { value: 'DOLCE_INCONTRO', label: 'Dolce Incontro' },
]

const toUserRole = (role: string): UserRole => {
    const validRoles: UserRole[] = ['admin', 'admin_master', 'operaciones', 'it', 'dsi', 'cx', 'contabilidad', 'trade', 'marketing', 'mesa_servicio', 'aperturas', 'campo', 'tecnico', 'instalador', 'soporte']
    if (validRoles.includes(role as UserRole)) {
        return role as UserRole
    }
    return 'cx'
}

// Función para generar contraseña temporal
const generarContrasenaTemporal = (nombre: string, apellido: string): string => {
    const nombreLimpiado = nombre.toLowerCase().replace(/[^a-z]/g, '')
    const apellidoLimpiado = apellido.toLowerCase().replace(/[^a-z]/g, '')
    const base = `${nombreLimpiado}.${apellidoLimpiado}`
    if (base.length < 6) {
        return `KFC${Math.random().toString(36).substring(2, 8).toUpperCase()}!`
    }
    return base
}

// Función para validar email de KFC
const validarEmailKFC = (email: string): boolean => {
    return email.toLowerCase().endsWith(DOMINIO_KFC)
}

const Usuarios: React.FC = () => {
    const [usuarios, setUsuarios] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [resetPasswordModal, setResetPasswordModal] = useState(false)
    const [userToReset, setUserToReset] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        role: 'cx' as UserRole,
        area: '',
        telefono: '',
        cadenaAsignada: 'TODAS',  // ✅ NUEVO CAMPO
    })
    const [formErrors, setFormErrors] = useState({
        email: '',
        telefono: '',
    })

    const roles: { value: UserRole; label: string }[] = [
        { value: 'admin', label: 'Administrador' },
        { value: 'admin_master', label: 'Master' },
        { value: 'operaciones', label: 'Operaciones' },
        { value: 'it', label: 'IT' },
        { value: 'dsi', label: 'DSI' },
        { value: 'cx', label: 'CX' },
        { value: 'contabilidad', label: 'Contabilidad' },
        { value: 'trade', label: 'Trade' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'mesa_servicio', label: 'Mesa de Servicio' },
        { value: 'aperturas', label: 'Aperturas' },
        { value: 'campo', label: 'Campo' },
        { value: 'tecnico', label: 'Técnico' },
        { value: 'instalador', label: 'Instalador' },
        { value: 'soporte', label: 'Soporte' },
    ]

    const areas = [
        { value: 'administracion', label: 'Administración' },
        { value: 'operaciones', label: 'Operaciones' },
        { value: 'infraestructura', label: 'Infraestructura' },
        { value: 'desarrollo', label: 'Desarrollo' },
        { value: 'cx', label: 'CX' },
        { value: 'trade', label: 'Trade' },
        { value: 'contabilidad', label: 'Contabilidad' },
        { value: 'it', label: 'IT' },
        { value: 'dsi', label: 'DSI' },
        { value: 'marketing', label: 'Marketing' },
    ]

    useEffect(() => {
        loadUsuarios()
    }, [])

    const loadUsuarios = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await usuariosService.getAll()
            setUsuarios(data)
            if (data.length === 0) {
                toast('No hay usuarios registrados', { icon: 'ℹ️' })
            } else {
                toast.success(`${data.length} usuarios cargados`)
            }
        } catch (error: any) {
            console.error('Error cargando usuarios:', error)
            setError(error.message || 'Error al cargar usuarios')
            toast.error('Error al cargar usuarios')
        } finally {
            setLoading(false)
        }
    }

    const validarFormulario = (): boolean => {
        const errors = { email: '', telefono: '' }
        let isValid = true

        if (!formData.email) {
            errors.email = 'El email es requerido'
            isValid = false
        } else if (!validarEmailKFC(formData.email)) {
            errors.email = `El email debe terminar en ${DOMINIO_KFC}`
            isValid = false
        }

        if (!formData.telefono) {
            errors.telefono = 'El teléfono es requerido'
            isValid = false
        } else if (!/^\d{10,15}$/.test(formData.telefono.replace(/\D/g, ''))) {
            errors.telefono = 'Ingrese un número de teléfono válido (10-15 dígitos)'
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validarFormulario()) {
            return
        }

        try {
            if (selectedUser) {
                await usuariosService.update(selectedUser._id, {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    role: formData.role,
                    area: formData.area,
                    telefono: formData.telefono,
                    cadenaAsignada: formData.cadenaAsignada,  // ✅ AGREGADO
                })
                toast.success('Usuario actualizado exitosamente')
            } else {
                const contrasenaTemporal = generarContrasenaTemporal(formData.nombre, formData.apellido)

                await usuariosService.create({
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    password: contrasenaTemporal,
                    role: formData.role,
                    area: formData.area,
                    telefono: formData.telefono,
                    cadenaAsignada: formData.cadenaAsignada,  // ✅ AGREGADO
                    debeCambiarPassword: true,
                })
                toast.success(`Usuario creado exitosamente. Contraseña temporal: ${contrasenaTemporal}`)
            }
            setIsModalOpen(false)
            resetForm()
            loadUsuarios()
        } catch (error: any) {
            console.error('Error guardando usuario:', error)
            toast.error(error.response?.data?.error || 'Error al guardar usuario')
        }
    }

    const handleResetPassword = async () => {
        if (!userToReset) return

        const contrasenaTemporal = generarContrasenaTemporal(
            userToReset.nombre,
            userToReset.apellido || ''
        )

        try {
            await usuariosService.update(userToReset._id, {
                password: contrasenaTemporal,
                debeCambiarPassword: true,
            })
            toast.success(`Contraseña restablecida. Nueva contraseña temporal: ${contrasenaTemporal}`)
            setResetPasswordModal(false)
            setUserToReset(null)
            loadUsuarios()
        } catch (error: any) {
            console.error('Error restableciendo contraseña:', error)
            toast.error(error.response?.data?.error || 'Error al restablecer la contraseña')
        }
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await usuariosService.delete(id)
                toast.success('Usuario eliminado exitosamente')
                loadUsuarios()
            } catch (error: any) {
                console.error('Error eliminando usuario:', error)
                toast.error(error.response?.data?.error || 'Error al eliminar usuario')
            }
        }
    }

    const resetForm = () => {
        setSelectedUser(null)
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            role: 'cx',
            area: '',
            telefono: '',
            cadenaAsignada: 'TODAS',  // ✅ AGREGADO
        })
        setFormErrors({ email: '', telefono: '' })
    }

    const getRoleBadgeColor = (role: string): BadgeStatus => {
        switch (role) {
            case 'admin_master': return 'error'
            case 'admin': return 'warning'
            case 'cx': return 'success'
            case 'it': return 'info'
            case 'dsi': return 'info'
            case 'operaciones': return 'default'
            default: return 'default'
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="mb-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1
                            className="text-4xl font-extrabold dark:text-white"
                            style={{ color: '#000000', fontWeight: '800' }}
                        >
                            Usuarios
                        </h1>

                        <p
                            className="mt-2 text-base font-medium dark:text-gray-300"
                            style={{ color: '#000000' }}
                        >
                            Administración de usuarios del sistema
                        </p>

                        <div className="mt-4 space-y-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                            <p className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="text-base">📧</span>
                                <span>Los emails deben terminar en <code className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded text-black dark:text-white border border-gray-300 dark:border-gray-600 font-mono text-sm">@kfc.com.ec</code></span>
                            </p>
                            <p className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="text-base">📱</span>
                                <span>El teléfono es obligatorio (10-15 dígitos)</span>
                            </p>
                            <p className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="text-base">🔑</span>
                                <span>La contraseña se generará automáticamente como <code className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded text-black dark:text-white border border-gray-300 dark:border-gray-600 font-mono text-sm">nombre.apellido</code></span>
                            </p>
                            <p className="text-amber-700 dark:text-amber-300 flex items-center gap-2 ml-6">
                                <span className="text-base">⚠️</span>
                                <span>El usuario deberá cambiarla en su primer inicio de sesión</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={loadUsuarios}
                            icon={<ArrowPathIcon className="h-5 w-5" />}
                        >
                            Actualizar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                resetForm()
                                setIsModalOpen(true)
                            }}
                            icon={<UserPlusIcon className="h-5 w-5" />}
                        >
                            Nuevo Usuario
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                    <button onClick={loadUsuarios} className="mt-2 text-red-600 dark:text-red-400 underline text-sm">
                        Reintentar
                    </button>
                </div>
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Contacto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Cadena
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Área
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {usuarios.map((usuario) => (
                            <tr key={usuario._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {usuario.nombre} {usuario.apellido || ''}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {usuario.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                                        {usuario.telefono || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge status={getRoleBadgeColor(usuario.role)} size="sm">
                                        {usuario.role}
                                    </Badge>
                                    {usuario.debeCambiarPassword && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                                                Cambiar clave
                                            </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {usuario.cadenaAsignada === 'TODAS' ? 'Todas' : usuario.cadenaAsignada}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                    {usuario.area || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                        status={usuario.activo ? 'success' : 'error'}
                                        size="sm"
                                    >
                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedUser(usuario)
                                                setFormData({
                                                    nombre: usuario.nombre,
                                                    apellido: usuario.apellido || '',
                                                    email: usuario.email,
                                                    password: '',
                                                    role: toUserRole(usuario.role),
                                                    area: usuario.area || '',
                                                    telefono: usuario.telefono || '',
                                                    cadenaAsignada: usuario.cadenaAsignada || 'TODAS',  // ✅ AGREGADO
                                                })
                                                setFormErrors({ email: '', telefono: '' })
                                                setIsModalOpen(true)
                                            }}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Editar usuario"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUserToReset(usuario)
                                                setResetPasswordModal(true)
                                            }}
                                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                                            title="Restablecer contraseña"
                                        >
                                            <KeyIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(usuario._id, usuario.nombre)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            title="Eliminar usuario"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {usuarios.length === 0 && (
                        <div className="text-center py-12">
                            <UserCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                No hay usuarios
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Comienza creando un nuevo usuario
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4"
                                icon={<UserPlusIcon className="h-5 w-5" />}
                            >
                                Crear primer usuario
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de Usuario */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false)
                                resetForm()
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                        >
                            {selectedUser ? 'Actualizar' : 'Crear'} Usuario
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            placeholder="Ej: Juan"
                        />
                        <Input
                            label="Apellido"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            placeholder="Ej: Pérez"
                        />
                    </div>

                    <div>
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value })
                                setFormErrors({ ...formErrors, email: '' })
                            }}
                            required
                            placeholder="ejemplo@kfc.com.ec"
                            icon={<EnvelopeIcon className="h-5 w-5" />}
                            error={formErrors.email}
                            helperText={`El email debe terminar en ${DOMINIO_KFC}`}
                        />
                    </div>

                    <div>
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => {
                                setFormData({ ...formData, telefono: e.target.value })
                                setFormErrors({ ...formErrors, telefono: '' })
                            }}
                            required
                            placeholder="0999999999"
                            icon={<PhoneIcon className="h-5 w-5" />}
                            error={formErrors.telefono}
                            helperText="Ingrese 10-15 dígitos (ej: 0999999999)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rol
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Área
                            </label>
                            <select
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Seleccionar área</option>
                                {areas.map(area => (
                                    <option key={area.value} value={area.value}>
                                        {area.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ✅ CAMPO CADENA ASIGNADA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cadena Asignada
                        </label>
                        <select
                            value={formData.cadenaAsignada}
                            onChange={(e) => setFormData({ ...formData, cadenaAsignada: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                        >
                            {CADENAS.map(cadena => (
                                <option key={cadena.value} value={cadena.value}>{cadena.label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            El usuario solo podrá ver tiendas de esta cadena
                        </p>
                    </div>

                    {!selectedUser && (
                        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-300 dark:border-blue-700">
                            <div className="flex items-start gap-3">
                                <KeyIcon className="h-5 w-5 text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
                                        La contraseña se generará automáticamente como <code className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded text-blue-900 dark:text-blue-100 font-mono">nombre.apellido</code>
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                        El usuario deberá cambiarla en su primer inicio de sesión.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Modal de Restablecimiento de Contraseña */}
            <Modal
                isOpen={resetPasswordModal}
                onClose={() => {
                    setResetPasswordModal(false)
                    setUserToReset(null)
                }}
                title="Restablecer Contraseña"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResetPasswordModal(false)
                                setUserToReset(null)
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleResetPassword}
                            icon={<KeyIcon className="h-4 w-4" />}
                        >
                            Restablecer
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-100 dark:bg-amber-900/50 rounded-lg border border-amber-300 dark:border-amber-700">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                ¿Restablecer contraseña de {userToReset?.nombre}?
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                                Se generará una contraseña temporal: <code className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded text-amber-900 dark:text-amber-100 font-mono">{userToReset && generarContrasenaTemporal(userToReset.nombre, userToReset.apellido || '')}</code>
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        El usuario deberá cambiar su contraseña en el próximo inicio de sesión.
                    </p>
                </div>
            </Modal>
        </Layout>
    )
}

export default Usuarios