// pages/Login.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
    EnvelopeIcon,
    LockClosedIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await login(email, password)

            // ✅ Verificar si debe cambiar contraseña (corregido)
            if (response?.debeCambiarPassword) {
                toast('⚠️ Debes cambiar tu contraseña antes de continuar', {
                    duration: 5000,
                    icon: '🔐'
                })
                // Guardar email temporalmente para la página de cambio
                sessionStorage.setItem('resetEmail', email)
                navigate('/cambiar-password')
                return
            }

            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Credenciales inválidas')
            toast.error(err.message || 'Credenciales inválidas')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            {/* Tarjeta principal */}
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Lado izquierdo - KFC Branding (40%) */}
                <div className="bg-gradient-to-br from-kfc-red to-kfc-red-600 md:w-5/12 p-8 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                <BuildingStorefrontIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">KFC Ecuador</h1>
                                <p className="text-white/80 text-sm">App Domicilio</p>
                            </div>
                        </div>

                        <div className="inline-block bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
                            v2.0.5.3
                        </div>

                        <h2 className="text-3xl font-bold mb-4">Bienvenido</h2>
                        <p className="text-white/90 text-lg leading-relaxed">
                            Sistema de gestión de pedidos y domicilios para tiendas KFC.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                'Gestión de pedidos en tiempo real',
                                'Dashboard ejecutivo',
                                'Control de cancelaciones',
                                'Múltiples procesadores'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="bg-white/20 p-1 rounded-full">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <span className="text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-white/60 text-sm mt-8">
                        © 2026 International Food Services
                    </p>
                </div>

                {/* Lado derecho - Formulario (60%) */}
                <div className="md:w-7/12 p-8 lg:p-12 bg-white">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Iniciar Sesión
                            </h3>
                            <p className="text-gray-500">
                                Por favor ingresa tus credenciales
                            </p>
                        </div>

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
                                    Email corporativo
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-kfc-red transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-kfc-red focus:ring-4 focus:ring-kfc-red/10 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                                        placeholder="nombre@kfc.com.ec"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-kfc-red transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-kfc-red focus:ring-4 focus:ring-kfc-red/10 transition-all outline-none bg-white text-gray-900 placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                    />
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
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <ArrowRightIcon className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <p className="text-xs text-gray-400">
                                    Acceso exclusivo para personal autorizado
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login