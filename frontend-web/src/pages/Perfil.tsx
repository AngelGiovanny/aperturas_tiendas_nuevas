import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/layout/Layout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { authService } from '../services/auth'
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
    KeyIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Perfil: React.FC = () => {
    const { user, logout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres')
            return
        }

        try {
            setLoading(true)
            await authService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            )
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            toast.success('Contraseña actualizada exitosamente')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600 mt-2">
                        Información personal y configuración de cuenta
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Información Personal */}
                    <Card>
                        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                            <div className="bg-gradient-to-br from-kfc-red to-kfc-red-dark p-4 rounded-2xl">
                                <UserCircleIcon className="h-16 w-16 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user?.nombre}
                                </h2>
                                <p className="text-kfc-red font-semibold mt-1 capitalize">
                                    {user?.role?.replace('_', ' ')}
                                </p>
                                <p className="text-gray-600">{user?.area}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Información de Contacto
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium text-gray-900">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Teléfono</p>
                                            <p className="font-medium text-gray-900">{user?.telefono}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Información de Cuenta
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <IdentificationIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">ID de Usuario</p>
                                            <p className="font-medium text-gray-900 text-sm font-mono">
                                                {user?._id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Miembro desde</p>
                                        <p className="font-medium text-gray-900">
                                            {user?.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Cambiar Contraseña */}
                    <Card>
                        <div className="flex items-center gap-2 mb-6">
                            <KeyIcon className="h-5 w-5 text-kfc-red" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Cambiar Contraseña
                            </h3>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <Input
                                type="password"
                                label="Contraseña actual"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({
                                    ...passwordData,
                                    currentPassword: e.target.value
                                })}
                                required
                            />
                            <Input
                                type="password"
                                label="Nueva contraseña"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value
                                })}
                                required
                            />
                            <Input
                                type="password"
                                label="Confirmar nueva contraseña"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.target.value
                                })}
                                required
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                            >
                                Actualizar Contraseña
                            </Button>
                        </form>
                    </Card>

                    {/* Cerrar Sesión */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Cerrar Sesión
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Termina tu sesión actual en el sistema
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={logout}
                            >
                                Cerrar Sesión
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    )
}

export default Perfil