// pages/CambiarPassword.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
    LockClosedIcon,
    KeyIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CambiarPassword: React.FC = () => {
    const navigate = useNavigate()
    const { changePassword } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        nuevaPassword: '',
        confirmarPassword: ''
    })

    // Verificar que hay un email en sessionStorage o usuario logueado
    useEffect(() => {
        const resetEmail = sessionStorage.getItem('resetEmail')
        const user = localStorage.getItem('user')

        if (!resetEmail && !user) {
            toast.error('No hay sesión activa', { icon: '❌' })
            navigate('/login')
        }
    }, [navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.nuevaPassword || !formData.confirmarPassword) {
            setError('Por favor complete todos los campos')
            return
        }

        if (formData.nuevaPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        if (formData.nuevaPassword !== formData.confirmarPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setLoading(true)

        try {
            await changePassword(formData.nuevaPassword)
            toast.success('Contraseña cambiada exitosamente', { icon: '✅' })
            // Limpiar sessionStorage
            sessionStorage.removeItem('resetEmail')
            // Redirigir al dashboard
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Error al cambiar la contraseña')
            toast.error(err.message || 'Error al cambiar la contraseña')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                        <BuildingStorefrontIcon className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Cambiar Contraseña
                    </h1>
                    <p className="text-gray-500">
                        Por seguridad, debes cambiar tu contraseña temporal
                    </p>
                </div>

                {/* Tarjeta del formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600 flex items-center gap-2">
                                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.nuevaPassword}
                                    onChange={(e) => setFormData({ ...formData, nuevaPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:border-kfc-red focus:ring-4 focus:ring-kfc-red/10 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Mínimo 6 caracteres
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmarPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:border-kfc-red focus:ring-4 focus:ring-kfc-red/10 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-kfc-red hover:bg-kfc-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-kfc-red/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    Cambiar Contraseña
                                    <ArrowRightIcon className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CambiarPassword